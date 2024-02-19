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

export const getAllFamilyEvents = async (req: Request, res: Response) => {
  const user_id = req.user ? req.user.id : null;

  if (user_id === null)
    return res.status(401).json({ error: "사용자가 인증되지 않았습니다." });

  try {
    const events = await FamilyEventsInstance.findAll({ where: { user_id } });
    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "예상치 못한 오류가 발생했습니다." });
  }
};

export const updateFamilyEvent = async (req: Request, res: Response) => {
  const id = Number(req.params.eventId);
  const user_id = req.user ? req.user.id : null;

  if (!id) return res.status(400).json({ error: "ID가 필요합니다." });
  if (user_id === null)
    return res.status(401).json({ error: "사용자가 인증되지 않았습니다." });

  try {
    const { target, date, type, amount } = req.body;
    if (!target || !date || !type || typeof amount !== "number") {
      return res.status(400).json({ error: "모든 필드는 필수입니다." });
    }

    await FamilyEventsInstance.update(
      { user_id, target, date, type, amount },
      { where: { id: id, user_id } }
    );

    const updatedEvent = await FamilyEventsInstance.findOne({
      where: { id: id, user_id },
    });

    if (!updatedEvent) throw new Error("업데이트된 이벤트를 찾을 수 없습니다.");

    res.json(updatedEvent);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
      res.status(500).json({ error: error.message });
    } else {
      console.error("가족 이벤트 업데이트 중 예상치 못한 오류 발생");
      res.status(500).json({ error: "예상치 못한 오류가 발생했습니다." });
    }
  }
};

export const deleteFamilyEvent = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const user_id = req.user ? req.user.id : null;

  if (user_id === null)
    return res.status(401).json({ error: "사용자가 인증되지 않았습니다." });

  try {
    const event = await FamilyEventsInstance.findOne({
      where: { id: eventId, user_id },
    });

    if (event) {
      await event.destroy();
      res.status(200).send("이벤트가 삭제되었습니다.");
    } else {
      res.status(404).send("이벤트를 찾을 수 없거나 삭제 권한이 없습니다.");
    }
  } catch (error) {
    res.status(500).json({ error: "예상치 못한 오류가 발생했습니다." });
  }
};

export const deleteAllFamilyEvents = async (req: Request, res: Response) => {
  const user_id = req.user ? req.user.id : null;

  if (user_id === null)
    return res.status(401).json({ error: "사용자가 인증되지 않았습니다." });

  try {
    await FamilyEventsInstance.destroy({ where: { user_id } });
    res.status(200).send("모든 이벤트가 삭제되었습니다.");
  } catch (error) {
    res.status(500).json({ error: "예상치 못한 오류가 발생했습니다." });
  }
};
