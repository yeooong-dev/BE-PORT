import express from "express";
import * as familyEventsController from "../controller/familyEventsController";

const router = express.Router();

router.post("/add", familyEventsController.addFamilyEvent);
router.get("/getAll", familyEventsController.getAllFamilyEvents);
router.put("/update/:eventId", familyEventsController.updateFamilyEvent);
router.delete("/delete/:eventId", familyEventsController.deleteFamilyEvent);
router.delete("/deleteAll", familyEventsController.deleteAllFamilyEvents);

export default router;
