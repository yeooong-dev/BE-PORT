import express from "express";
const router = express.Router();
import * as authController from "../controller/authController";

// 회원가입
router.post("/register", authController.register);
router.post("/checkEmail", authController.checkEmail);

// 로그인
router.post("/login", authController.login);

export default router;
