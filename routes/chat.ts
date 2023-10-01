import express from "express";
import * as chatController from "../controller/chatController";

const router = express.Router();

router.get("/users", chatController.getUsers);
router.post("/room", chatController.createRoom);
router.get("/room/:roomId", chatController.getRoom);
router.post("/room/:roomId/message", chatController.postMessage);

export default router;
