import { Request, Response } from "express";
import User from "../models/user";
import { Room } from "../models/chat/room";
import { Chat } from "../models/chat/chat";
import sequelize from "../config/database";
import { Op } from "sequelize";

const UserModel = User(sequelize);

export const getUsers = async (req: Request, res: Response) => {
  try {
    // 기존 사용자 정보 로드
    const users = await UserModel.findAll({
      attributes: ["id", "name", "profile_image"],
      where: {
        id: {
          [Op.ne]: req.user?.id,
        },
      },
    });

    // 각 사용자의 마지막 메시지 로드
    const usersWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const lastChat = await Chat.findOne({
          where: { userId: user.id },
          order: [["createdAt", "DESC"]],
        });
        return {
          ...user.toJSON(),
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
