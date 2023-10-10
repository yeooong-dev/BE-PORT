import { Request, Response } from "express";
import User from "../models/user";
import { Room } from "../models/chat/room";
import { Chat } from "../models/chat/chat";
import sequelize from "../config/database";
import { Op } from "sequelize";
import { RoomParticipant } from "../models/chat/roomParticipant";
const UserModel = User(sequelize);

export const getInteractedUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const userRooms = await RoomParticipant.findAll({
      where: { userId },
      attributes: ["roomId"],
    });

    const roomIds = userRooms.map((room) => room.roomId);

    const participants = await RoomParticipant.findAll({
      where: {
        roomId: roomIds,
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
    const { roomId } = req.params;
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
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const postMessage = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { userId, message } = req.body;
    const chat = await Chat.create({ userId, roomId, message });
    res.json(chat);
  } catch (error) {
    console.error(error);
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

    const remainingParticipants = await RoomParticipant.count({
      where: { roomId: Number(roomId) },
    });

    if (remainingParticipants === 0) {
      await Chat.destroy({ where: { roomId: Number(roomId) } });
      await Room.destroy({ where: { id: Number(roomId) } });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};
