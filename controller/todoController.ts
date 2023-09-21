import { Request, Response } from "express";
import Todo from "../models/todo";
import sequelize from "../config/database";

interface ExtendedRequest extends Request {
  user: { id: number };
}

const TodoInstance = Todo(sequelize);

// 생성
export const todoAdd = async (req: ExtendedRequest, res: Response) => {
  try {
    const { text, completed } = req.body;
    const user_id = req.user.id;
    const todo = await TodoInstance.create({ text, completed, user_id });
    res.json(todo);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
};

// 조회
export const todoGet = async (req: ExtendedRequest, res: Response) => {
  try {
    const user_id = req.user.id;
    const todo = await TodoInstance.findAll({ where: { user_id } });
    res.json(todo);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
};

// 수정
export const todoUpdate = async (req: ExtendedRequest, res: Response) => {
  try {
    const { text, completed } = req.body;
    const todo_id = Number(req.params.todoId);
    await TodoInstance.update({ text, completed }, { where: { todo_id } });
    res.json({ message: "Todo updated successfully" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
};

// 삭제
export const todoDelete = async (req: ExtendedRequest, res: Response) => {
  try {
    const todo_id = Number(req.params.todoId);
    await TodoInstance.destroy({ where: { todo_id } });
    res.json({ message: "Todo deleted successfully" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
};
