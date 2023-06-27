import express, { Router } from "express";
import { checkEmail, checkNickname, register } from "../controller/registerController";

const router: Router = express.Router();

// 이메일 중복 확인
router.post("/checkEmail", checkEmail);

// 닉네임 중복 확인
router.post("/checkNickname", checkNickname);

// 회원가입 처리
router.post("/register", register);

export default router;
