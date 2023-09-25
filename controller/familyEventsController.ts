import { Request, Response } from "express";
import sequelize from "../config/database";
import FamilyEvents from "../models/familyEvents";
const FamilyEventsInstance = FamilyEvents(sequelize);

export const addFamilyEvent = async (req: Request, res: Response) => {
  try {
    const { target, date, type, amount } = req.body;
    const user_id = req.user ? req.user.id : null;

    if (user_id !== null) {
      const familyEvent = await FamilyEventsInstance.create({
        user_id,
        target,
        date,
        type,
        amount,
      });
      res.json(familyEvent);
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

export const getAllFamilyEvents = async (req: Request, res: Response) => {
  try {
    const events = await FamilyEventsInstance.findAll();
    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const updateFamilyEvent = async (req: Request, res: Response) => {
  const id = Number(req.params.eventId);
  const user_id = req.user ? req.user.id : null;

  if (!id) return res.status(400).json({ error: "ID is required" });
  if (user_id === null)
    return res.status(401).json({ error: "User not authenticated" });

  try {
    const { target, date, type, amount } = req.body;
    if (!target || !date || !type || typeof amount !== "number") {
      return res.status(400).json({ error: "All fields are required" });
    }

    await FamilyEventsInstance.update(
      { user_id, target, date, type, amount },
      { where: { id: id, user_id } }
    );

    const updatedEvent = await FamilyEventsInstance.findOne({
      where: { id: id, user_id },
    });

    if (!updatedEvent) throw new Error("Updated event not found");

    res.json(updatedEvent);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error in updateFamilyEvent:", error.message);
      res.status(500).json({ error: error.message });
    } else {
      console.error("An unexpected error occurred in updateFamilyEvent");
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
};

export const deleteFamilyEvent = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    const event = await FamilyEventsInstance.findByPk(eventId);

    if (event) {
      await event.destroy();
      res.status(200).send("Event deleted");
    } else {
      res.status(404).send("Event not found");
    }
  } catch (error) {
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const deleteAllFamilyEvents = async (req: Request, res: Response) => {
  try {
    await FamilyEventsInstance.destroy({ where: {} });
    res.status(200).send("All events deleted");
  } catch (error) {
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};
