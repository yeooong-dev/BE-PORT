import { Request, Response } from "express";
import sequelize from "../config/database";
import Calendar from "../models/calendar";
const CalendarModel = Calendar(sequelize);

export const addCalendar = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, startTime, endTime, title } = req.body;
    const user_id = req.user ? req.user.id : null;

    if (user_id !== null) {
      const calendar = await CalendarModel.create({
        user_id,
        startDate,
        endDate,
        startTime,
        endTime,
        title,
      });
      res.json(calendar);
    } else {
      res.status(401).json({ error: "사용자가 인증되지 않았습니다." });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "예상치 못한 오류가 발생했습니다." });
    }
  }
};

export const getCalendars = async (req: Request, res: Response) => {
  try {
    const user_id = req.user ? req.user.id : null;

    if (!user_id) {
      return res.status(401).json({ error: "사용자가 인증되지 않았습니다." });
    }

    const events = await CalendarModel.findAll({
      where: { user_id },
    });

    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "예상치 못한 오류가 발생했습니다." });
  }
};

export const updateCalendar = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user_id = req.user ? req.user.id : null;

  if (!id) return res.status(400).json({ error: "ID가 필요합니다." });
  if (user_id === null)
    return res.status(401).json({ error: "사용자가 인증되지 않았습니다." });

  try {
    const { startDate, endDate, startTime, endTime, title } = req.body;
    if (!startDate || !endDate || !startTime || !endTime || !title) {
      return res.status(400).json({ error: "모든 필드는 필수입니다." });
    }

    await CalendarModel.update(
      { user_id, startDate, endDate, startTime, endTime, title },
      { where: { id: id, user_id } }
    );

    const updateCalendar = await CalendarModel.findOne({
      where: { id: id, user_id },
    });

    if (!updateCalendar)
      throw new Error("업데이트된 이벤트를 찾을 수 없습니다.");

    res.json(updateCalendar);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("updateCalendar에서 오류 발생:", error.message);
      res.status(500).json({ error: error.message });
    } else {
      console.error("updateCalendar에서 예상치 못한 오류 발생");
      res.status(500).json({ error: "예상치 못한 오류가 발생했습니다." });
    }
  }
};

export const deleteCalendar = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user_id = req.user ? req.user.id : null;

  if (!user_id) {
    return res.status(401).json({ error: "사용자가 인증되지 않았습니다." });
  }

  try {
    const calendar = await CalendarModel.findOne({
      where: { id: id, user_id: user_id },
    });

    if (calendar) {
      await calendar.destroy();
      res.status(200).send("캘린더가 삭제되었습니다.");
    } else {
      res.status(404).send("캘린더를 찾을 수 없습니다.");
    }
  } catch (error) {
    res.status(500).json({ error: "예상치 못한 오류가 발생했습니다." });
  }
};
