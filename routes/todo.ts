import express from "express";
import * as todoController from "../controller/todoController";

const router = express.Router();

// 생성
router.post("/add", todoController.todoAdd);

// 조회
router.get("/get/:todoId", todoController.todoGet);

// 수정
router.put("/update/:todoId", todoController.todoUpdate);

// 삭제
router.delete("/delete/:todoId", todoController.todoDelete);

export default router;
