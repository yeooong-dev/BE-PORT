import express from "express";
import * as authController from "../controller/authController";
import * as mypageController from "../controller/mypageController";
import upload from "../middleware/upload";

const router = express.Router();

// 회원가입
router.post("/register", authController.register);
router.post("/checkEmail", authController.checkEmail);

// 로그인
router.post("/login", authController.login);

// 회원정보
router.get("/user", authController.getUserInfo);

// 프로필 CRUD
router.post("/profile/image", upload, mypageController.imgAdd);
router.get("/profile/image/:userId", mypageController.imgGet);
router.put("/profile/image/:userId", upload, mypageController.imgUpdate);
router.delete("/profile/image/:userId", mypageController.imgDelete);

// 성함 변경
router.put("/profile/name/:userId", mypageController.updateName);

// 비밀번호 변경
router.put("/profile/password/:userId", mypageController.updatePassword);

// 회원 탈퇴
router.delete("/profile/:userId", mypageController.deleteAccount);

export default router;
