import { Request, Response } from "express";
import User from "../models/user";
import { Room } from "../models/chat/room";
import { Chat } from "../models/chat/chat";
import sequelize from "../config/database";
import { Op } from "sequelize";
import { RoomParticipant } from "../models/chat/roomParticipant";
import { getIO } from "../socket";

const UserModel = User(sequelize);

export const getInteractedUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const userRooms = await RoomParticipant.findAll({
      where: { userId },
      attributes: ["roomId"],
    });

    const roomIds: number[] = userRooms.map(
      (roomParticipant) => roomParticipant.roomId
    );

    const validRooms = await Room.findAll({
      where: {
        id: {
          [Op.in]: roomIds,
        },
      },
      attributes: ["id"],
    });

    const validRoomIds: number[] = validRooms.map((room) => room.id);

    const participants = await RoomParticipant.findAll({
      where: {
        roomId: validRoomIds,
        userId: {
          [Op.ne]: userId,
        },
      },
    });

    const uniqueUserIds = [...new Set(participants.map((p) => p.userId))];

    if (uniqueUserIds.length === 0) {
      return res.json([]);
    }

    const users = await UserModel.findAll({
      where: { id: uniqueUserIds },
      attributes: ["id", "name", "profile_image"],
    });

    const usersWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const lastChat = await Chat.findOne({
          where: {
            [Op.or]: [
              { userId: user.id, roomId: userId },
              { userId: userId, roomId: user.id },
            ],
          },
          order: [["createdAt", "DESC"]],
          attributes: ["message"],
        });

        return {
          ...user.dataValues,
          lastMessage: lastChat ? lastChat.message : null,
        };
      })
    );

    res.json(usersWithLastMessage);
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

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { userIds, name } = req.body;
    console.log(`Creating room with userIds: ${userIds}`);
    if (!name) throw new Error("Room name is required");
    const room = await Room.create({ name });
    const currentTimestamp = new Date();
    // @ts-ignore
    await room.addUsers(userIds, { through: { joinedAt: currentTimestamp } });
    res.json(room);
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
  try {
    if (typeof req.query.userIds !== "string") {
      return res.status(400).json({ error: "userIds must be a string" });
    }

    const userIds = req.query.userIds.split(",").map((id) => id.trim());

    if (!userIds.every((id) => /^\d+$/.test(id))) {
      return res.status(400).json({ error: "All userIds must be numeric" });
    }

    const userIdNumbers = userIds.map(Number);

    const roomsWithAllUsers = await Room.findAll({
      include: [
        {
          model: RoomParticipant,
          as: "participants",
          where: {
            userId: {
              [Op.in]: userIdNumbers,
            },
          },
          required: true,
        },
      ],
      group: ["Room.id"],
      having: sequelize.where(
        sequelize.fn("COUNT", sequelize.col("Room.id")),
        "=",
        userIdNumbers.length
      ),
    });

    if (roomsWithAllUsers.length > 0) {
      res.json({ exists: true, room: roomsWithAllUsers[0] });
    } else {
      res.json({ exists: false, room: null });
    }
  } catch (error) {
    console.error("함수 실행 중 오류 발생:", error);
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
    io.to(String(roomId)).emit("chat message", chatData);
    res.json(chatData);
  } catch (error) {
    console.error("Error in postMessage:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const removeUserFromRoom = async (req: Request, res: Response) => {
  try {
    const { roomId, userId } = req.params;

    await RoomParticipant.destroy({
      where: {
        roomId: Number(roomId),
        userId: Number(userId),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};
