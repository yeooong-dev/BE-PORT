import { Request, Response } from "express";
import User from "../models/user";
import { Room } from "../models/chat/room";
import { Chat } from "../models/chat/chat";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body;
    const room = await Room.create();

    await (room as any).addUsers(userIds);

    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findByPk(roomId, { include: Chat });
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
