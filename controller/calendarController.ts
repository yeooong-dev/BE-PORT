import { Request, Response } from "express";
import sequelize from "../config/database";
import Calendar from "../models/calendar";
const CalendarModel = Calendar(sequelize);

export const addCalendar = async (req: Request, res: Response) => {
  try {
    const { date, time, title } = req.body;
    const user_id = req.user ? req.user.id : null;

    if (user_id !== null) {
      const calendar = await CalendarModel.create({
        user_id,
        date,
        time,
        title,
      });
      res.json(calendar);
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

export const getCalendars = async (req: Request, res: Response) => {
  try {
    const events = await CalendarModel.findAll();
    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const updateCalendar = async (req: Request, res: Response) => {
  const id = Number(req.params.eventId);
  const user_id = req.user ? req.user.id : null;

  if (!id) return res.status(400).json({ error: "ID is required" });
  if (user_id === null)
    return res.status(401).json({ error: "User not authenticated" });

  try {
    const { user_id, date, time, title } = req.body;
    if (!date || !time || !title) {
      return res.status(400).json({ error: "All fields are required" });
    }

    await CalendarModel.update(
      { user_id, date, time, title },
      { where: { id: id, user_id } }
    );

    const updateCalendar = await CalendarModel.findOne({
      where: { id: id, user_id },
    });

    if (!updateCalendar) throw new Error("Updated event not found");

    res.json(updateCalendar);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error in updateCalendar:", error.message);
      res.status(500).json({ error: error.message });
    } else {
      console.error("An unexpected error occurred in updateCalendar");
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
};

export const deleteCalendar = async (req: Request, res: Response) => {
  const { calendarId } = req.params;

  try {
    const calendar = await CalendarModel.findByPk(calendarId);

    if (calendar) {
      await calendar.destroy();
      res.status(200).send("calendar deleted");
    } else {
      res.status(404).send("calendar not found");
    }
  } catch (error) {
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};
