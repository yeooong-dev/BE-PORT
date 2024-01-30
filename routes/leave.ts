import express from "express";
import * as leaveController from "../controller/leaveController";

const router = express.Router();

router.get("/get", leaveController.getLeaves);
router.post("/apply", leaveController.applyLeave);
router.delete("/delete/:id", leaveController.deleteLeave);

export default router;
