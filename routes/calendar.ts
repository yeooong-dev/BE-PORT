// calendarRouter.ts
import express from "express";
import * as calendarController from "../controller/calendarController";

const router = express.Router();

router.post("/add", calendarController.addCalendar);
router.get("/getAll", calendarController.getCalendars);
router.put("/update/:id", calendarController.updateCalendar);
router.delete("/delete/:id", calendarController.deleteCalendar);

export default router;
