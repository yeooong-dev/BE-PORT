import express from "express";
import * as chatController from "../controller/chatController";
const router = express.Router();

router.get("/room/exist", chatController.checkIfRoomExists);
router.get("/interactedUsers", chatController.getInteractedUsers);
router.get("/users", chatController.getUsers);
router.post("/room", chatController.createRoom);
router.get("/room/:roomId", chatController.getRoom);
router.post("/room/:roomId/message", chatController.postMessage);
router.delete("/room/:roomId/user/:userId", chatController.removeUserFromRoom);

export default router;
