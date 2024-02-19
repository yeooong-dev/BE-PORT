import { Request, Response } from "express";
import User from "../models/user";
import { Room } from "../models/chat/room";
import { Chat } from "../models/chat/chat";
import sequelize from "../config/database";
import { Op } from "sequelize";
import { RoomParticipant } from "../models/chat/roomParticipant";
import { getIO } from "../socket";
import { Server as SocketIOServer } from "socket.io";
import moment from "moment-timezone";

const UserModel = User(sequelize);

export const getInteractedUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "사용자가 인증되지 않았습니다." });
    }

    const userRooms = await RoomParticipant.findAll({
      where: { userId, isVisible: true },
      attributes: ["roomId"],
    });

    const roomIds = userRooms.map((room) => room.roomId);

    const interactedUsers = await Promise.all(
      roomIds.map(async (roomId) => {
        const lastChat = await Chat.findOne({
          where: { roomId },
          order: [["createdAt", "DESC"]],
        });

        if (!lastChat) return null;

        const otherUserId =
          lastChat.userId === userId
            ? await RoomParticipant.findOne({
                where: { roomId, userId: { [Op.ne]: userId } },
                attributes: ["userId"],
              }).then((rp) => rp?.userId)
            : lastChat.userId;

        if (!otherUserId) return null;

        const otherUser = await UserModel.findOne({
          where: { id: otherUserId },
          attributes: ["id", "name", "profile_image", "company_name"],
        });

        return {
          user: otherUser,
          lastMessage: lastChat.message,
          roomId,
        };
      })
    );

    const validInteractedUsers = interactedUsers.filter((u) => u != null);
    res.json(validInteractedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "예기치 않은 오류가 발생했습니다." });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const users = await UserModel.findAll({
      attributes: ["id", "name", "profile_image", "company_name"],
      where: {
        id: {
          [Op.ne]: currentUserId,
        },
      },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "예기치 않은 오류가 발생했습니다." });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const userId = req.user?.id;
    console.log(
      `[getRoom] Requested by User ID: ${userId}, Room ID: ${roomId}`
    );

    if (isNaN(roomId) || !userId) {
      return res
        .status(400)
        .json({ error: "잘못된 방 ID 또는 사용자 ID입니다." });
    }

    // 사용자가 마지막으로 채팅방을 나간 시간을 확인하기 위한 쿼리
    const roomParticipantCondition = await RoomParticipant.findOne({
      where: { roomId, userId },
      attributes: ["isVisible", "leftAt"],
    });

    let chatsCondition = {};
    if (
      roomParticipantCondition &&
      roomParticipantCondition.isVisible === false &&
      roomParticipantCondition.leftAt
    ) {
      chatsCondition = {
        createdAt: { [Op.gt]: roomParticipantCondition.leftAt },
      };
    }

    const room = await Room.findByPk(roomId, {
      include: [
        {
          model: Chat,
          as: "chats",
          where: chatsCondition,
          required: false,
          include: [
            {
              model: UserModel,
              as: "user",
              attributes: ["id", "name", "profile_image", "company_name"],
            },
          ],
        },
        {
          model: RoomParticipant,
          as: "participants",
          attributes: ["userId", "isVisible", "leftAt"],
          required: false,
        },
      ],
      order: [[{ model: Chat, as: "chats" }, "createdAt", "ASC"]],
    });

    if (!room) {
      return res.json({});
    }

    if (room && room.chats) {
      console.log(
        `[getRoom] Returning ${room.chats.length} messages for Room ID: ${roomId}`
      );
    } else {
      console.log(
        `[getRoom] No chats found or chats is undefined for Room ID: ${roomId}`
      );
    }

    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "예기치 않은 오류가 발생했습니다." });
  }
};

export const checkIfRoomExists = async (req: Request, res: Response) => {
  const userIdsString = req.query.userIds as string;
  if (!userIdsString) {
    return res.status(400).json({ error: "사용자 ID가 필요합니다." });
  }

  const userIds = userIdsString
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  if (userIds.length === 0) {
    return res.status(400).json({ error: "잘못된 사용자 ID입니다." });
  }

  try {
    const rooms = await Room.findAll({
      include: [
        {
          model: RoomParticipant,
          as: "participants",
          attributes: ["userId"],
        },
      ],
    });

    const existingRoom = rooms.find((room) => {
      const participantIds = room.participants.map((p) => p.userId).sort();
      return userIds.sort().toString() === participantIds.sort().toString();
    });

    if (existingRoom) {
      return res.json({ exists: true, room: existingRoom });
    } else {
      return res.json({ exists: false, room: null });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "예기치 않은 오류가 발생했습니다." });
  }
};

async function findExistingRoom(userIds: number[]): Promise<Room | null> {
  const rooms = await Room.findAll({
    include: [
      {
        model: RoomParticipant,
        as: "participants",
        attributes: ["userId"],
      },
    ],
  });

  const existingRoom = rooms.find((room) => {
    const participantIds = room.participants.map((p) => p.userId).sort();
    return userIds.sort().toString() === participantIds.sort().toString();
  });

  return existingRoom || null;
}

export const createRoom = async (req: Request, res: Response) => {
  const { userIds, name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "방 이름이 필요합니다." });
  }

  const existingRoom = await findExistingRoom(userIds);
  if (existingRoom) {
    return res.json(existingRoom);
  }

  const newRoom = await Room.create({ name });
  const participants = userIds.map((userId: any) => ({
    roomId: newRoom.id,
    userId,
    joinedAt: new Date(),
    isVisible: true,
  }));

  await RoomParticipant.bulkCreate(participants);
  return res.json(newRoom);
};

export const postMessage = async (req: Request, res: Response) => {
  const io = getIO();
  try {
    const { roomId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const chat = await Chat.create({ userId, roomId, message });
    const user = await UserModel.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    const chatData = {
      ...chat.get(),
      user: {
        id: user.id,
        name: user.name,
        profile_image: user.profile_image,
        company_name: user.company_name,
      },
    };

    io.to(String(roomId)).emit("chat message", chatData);
    io.to(String(userId)).emit("update chat list", {
      roomId,
      lastMessage: chatData.content,
    });

    const participants = await RoomParticipant.findAll({
      where: { roomId },
    });

    participants.forEach((participant) => {
      updateChatList(participant.userId, io);
    });

    res.json(chatData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "예기치 않은 오류가 발생했습니다." });
  }
};

async function updateChatList(userId: number, io: SocketIOServer) {
  const userRooms = await RoomParticipant.findAll({
    where: { userId },
    attributes: ["roomId"],
  });

  const roomIds = userRooms.map((room) => room.roomId);

  const interactedUsers = await Promise.all(
    roomIds.map(async (roomId) => {
      const lastChat = await Chat.findOne({
        where: { roomId },
        order: [["createdAt", "DESC"]],
      });

      if (!lastChat) return null;

      const otherUserId =
        lastChat.userId === userId
          ? await RoomParticipant.findOne({
              where: { roomId, userId: { [Op.ne]: userId } },
              attributes: ["userId"],
            }).then((rp) => rp?.userId)
          : lastChat.userId;

      if (!otherUserId) return null;

      const otherUser = await UserModel.findOne({
        where: { id: otherUserId },
        attributes: ["id", "name", "profile_image", "company_name"],
      });

      return {
        user: otherUser,
        lastMessage: lastChat.message,
        roomId,
      };
    })
  );

  const validInteractedUsers = interactedUsers.filter((u) => u != null);

  io.to(userId.toString()).emit("updated chat list", validInteractedUsers);
}

export const removeUserFromRoom = async (req: Request, res: Response) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(roomId) || isNaN(userId)) {
      return res.status(400).json({ error: "잘못된 사용자 ID입니다." });
    }

    const roomParticipant = await RoomParticipant.findOne({
      where: { roomId, userId },
    });

    if (roomParticipant) {
      const currentTime = moment().tz("Asia/Seoul").toDate();
      await RoomParticipant.update(
        { isVisible: false, leftAt: currentTime },
        { where: { roomId, userId } }
      );

      res.json({
        success: true,
        message: "방에서 사용자가 나가고, 상태가 업데이트되었습니다.",
      });
    } else {
      return res
        .status(404)
        .json({ error: "방에서 사용자를 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "예기치 않은 오류가 발생했습니다." });
  }
};
