import { Request, Response } from "express";
import { Op, fn, col } from "sequelize";
import Todo, { TodoInstance } from "../models/todo";
import FamilyEvents, { FamilyEventsInstance } from "../models/familyEvents";
import Calendar from "../models/calendar";
import sequelize from "../config/database";

const TodoInstance = Todo(sequelize);
const FamilyEventsInstance = FamilyEvents(sequelize);
const CalendarInstance = Calendar(sequelize);

export const search = async (req: Request, res: Response) => {
  const searchTerm = req.query.q as string;
  const userId = req.user.id;

  try {
    const todoResults = await TodoInstance.findAll({
      where: {
        [Op.and]: [
          { user_id: userId },
          { text: { [Op.like]: `%${searchTerm}%` } },
        ],
      },
    });

    const familyEventsResults = await FamilyEventsInstance.findAll({
      where: {
        [Op.and]: [
          { user_id: userId },
          {
            [Op.or]: [
              { target: { [Op.like]: `%${searchTerm}%` } },
              { type: { [Op.like]: `%${searchTerm}%` } },
              sequelize.where(fn("DATE_FORMAT", col("date"), "%Y-%m-%d"), {
                [Op.like]: `%${searchTerm}%`,
              }),
            ],
          },
        ],
      },
    });

    const calendarResults = await CalendarInstance.findAll({
      where: {
        [Op.and]: [
          { user_id: userId },
          {
            [Op.or]: [
              { title: { [Op.like]: `%${searchTerm}%` } },
              sequelize.where(fn("DATE_FORMAT", col("startDate"), "%Y-%m-%d"), {
                [Op.like]: `%${searchTerm}%`,
              }),
              sequelize.where(fn("DATE_FORMAT", col("endDate"), "%Y-%m-%d"), {
                [Op.like]: `%${searchTerm}%`,
              }),
            ],
          },
        ],
      },
    });

    res.json({
      todos: todoResults,
      familyEvents: familyEventsResults,
      calendar: calendarResults,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("검색 중 오류가 발생했습니다.");
  }
};
