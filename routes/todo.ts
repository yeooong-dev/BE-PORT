import express from "express";
import * as todoController from "../controller/todoController";

const router = express.Router();

router.post("/add", todoController.todoAdd);
router.get("/get", todoController.todoGet);
router.put("/update/:todo_id", todoController.todoUpdate);
router.delete("/delete/:todo_id", todoController.todoDelete);
router.put("/toggle/:todo_id", todoController.todoToggleCheck);

export default router;
