import { Request, Response } from "express";
import User from "../models/user";
import { Room } from "../models/chat/room";
import { Chat } from "../models/chat/chat";
import sequelize from "../config/database";
import { Op } from "sequelize";
import { RoomParticipant } from "../models/chat/roomParticipant";
import { getIO } from "../socket";
import { Server as SocketIOServer } from "socket.io";

const UserModel = User(sequelize);

export const getInteractedUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

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
          attributes: ["id", "name", "profile_image"],
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
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const users = await UserModel.findAll({
      attributes: ["id", "name", "profile_image"],
      where: {
        id: {
          [Op.ne]: currentUserId,
        },
      },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);

    if (isNaN(roomId)) {
      return res.status(400).json({ error: "Invalid room ID" });
    }

    const room = await Room.findByPk(roomId, {
      include: [
        {
          model: Chat,
          as: "chats",
          include: [
            {
              model: UserModel,
              as: "user",
              attributes: ["id", "name", "profile_image"],
            },
          ],
        },
      ],
    });

    if (!room) {
      return res.json({});
    }
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const checkIfRoomExists = async (req: Request, res: Response) => {
  const userIdsString = req.query.userIds as string;
  if (!userIdsString) {
    return res.status(400).json({ error: "User IDs are required" });
  }

  const userIds = userIdsString
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  if (userIds.length === 0) {
    return res.status(400).json({ error: "Invalid User IDs" });
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
      const participantIds = room.participants
        .map((p) => p.userId)
        .sort((a, b) => a - b);
      return JSON.stringify(userIds) === JSON.stringify(participantIds);
    });

    if (existingRoom) {
      return res.json({ exists: true, room: existingRoom });
    } else {
      return res.json({ exists: false, room: null });
    }
  } catch (error) {
    console.error("Error in checkIfRoomExists:", error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { userIds, name } = req.body;
    if (!name) throw new Error("Room name is required");

    const existingRooms = await Room.findAll({
      include: [
        {
          model: RoomParticipant,
          as: "participants",
          attributes: ["userId"],
        },
      ],
    });

    const existingRoom = existingRooms.find((room) => {
      const participantIds = room.participants.map((p) => p.userId).sort();
      return (
        participantIds.length === userIds.length &&
        participantIds.every((value, index) => value === userIds.sort()[index])
      );
    });

    if (existingRoom) {
      return res.json(existingRoom);
    }

    const room = await Room.create({ name });
    const participants = userIds.map((userId: any) => ({
      roomId: room.id,
      userId,
      joinedAt: new Date(),
    }));

    await RoomParticipant.bulkCreate(participants);

    return res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
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
      throw new Error("User not found");
    }

    const chatData = {
      ...chat.get(),
      user: {
        id: user.id,
        name: user.name,
        profile_image: user.profile_image,
      },
    };
    console.log(`Emitting chat message to room ${roomId}`, chatData);
    io.to(String(roomId)).emit("chat message", chatData);

    const participants = await RoomParticipant.findAll({
      where: { roomId },
    });

    participants.forEach((participant) => {
      updateChatList(participant.userId, io);
    });

    res.json(chatData);
  } catch (error) {
    console.error("Error in postMessage:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
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
        attributes: ["id", "name", "profile_image"],
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
    const roomId = parseInt(req.params.roomId);
    const userId = parseInt(req.params.userId);

    if (isNaN(roomId) || isNaN(userId)) {
      return res.status(400).json({ error: "Invalid room ID or user ID" });
    }

    const result = await RoomParticipant.update(
      { isVisible: false },
      {
        where: {
          roomId: roomId,
          userId: userId,
        },
      }
    );

    if (result[0] === 0) {
      return res.status(404).json({ error: "Room participant not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};
