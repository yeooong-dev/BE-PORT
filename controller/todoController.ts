import Todo from "../models/todo";
import sequelize from "../config/database";
import { ExtendedRequestHandler } from "./types";
const TodoInstance = Todo(sequelize);

export const todoAdd: ExtendedRequestHandler = async (req, res) => {
  try {
    const { text, completed } = req.body;
    const user_id = req.user ? req.user.id : null;

    if (user_id !== null) {
      const todo = await TodoInstance.create({ text, completed, user_id });
      res.json(todo);
    } else {
      res.status(401).json({ error: "User not authenticated" });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
};

export const todoGet: ExtendedRequestHandler = async (req, res) => {
  try {
    const todos = await TodoInstance.findAll();
    res.json(todos);
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const todoUpdate: ExtendedRequestHandler = async (req, res) => {
  const user_id = req.user ? req.user.id : null;
  const todo_id = Number(req.params.todo_id);

  if (user_id !== null) {
    try {
      const { text, completed } = req.body;
      await TodoInstance.update(
        { text, completed },
        { where: { todo_id: todo_id, user_id } }
      );
      const updatedTodo = await TodoInstance.findOne({
        where: { todo_id: todo_id, user_id },
      });
      res.json(updatedTodo);
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "An unexpected error occurred" });
      }
    }
  } else {
    res.status(401).json({ error: "User not authenticated" });
  }
};

export const todoDelete: ExtendedRequestHandler = async (req, res) => {
  try {
    const user_id = req.user ? req.user.id : null;
    const todo_id = Number(req.params.todo_id);

    if (user_id !== null) {
      const todo = await TodoInstance.findOne({
        where: { todo_id: todo_id, user_id },
      });
      await TodoInstance.destroy({ where: { todo_id: todo_id, user_id } });
      res.json(todo);
    } else {
      res.status(401).json({ error: "User not authenticated" });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
};

export const todoToggleCheck: ExtendedRequestHandler = async (req, res) => {
  const user_id = req.user ? req.user.id : null;
  const todo_id = Number(req.params.todo_id);

  if (user_id !== null) {
    try {
      const todo = await TodoInstance.findOne({
        where: { todo_id: todo_id, user_id },
      });
      if (todo) {
        const updated = await todo.update({ completed: !todo.completed });
        res.json(updated);
      } else {
        res.status(404).json({ error: "Todo not found" });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "An unexpected error occurred" });
      }
    }
  } else {
    res.status(401).json({ error: "User not authenticated" });
  }
};
