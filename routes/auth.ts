import express from "express";
const router = express.Router();
import * as authController from "../controller/authController";
import * as mypageController from "../controller/mypageController";
import upload from "../middleware/upload";

// 회원가입
router.post("/register", authController.register);
router.post("/checkEmail", authController.checkEmail);

// 로그인
router.post("/login", authController.login);

// 회원정보
router.get("/user", authController.getUserInfo);

// 프로필 사진 업로드
router.post("/profile/image", upload.single("image"), mypageController.imgAdd);

// 프로필 사진 조회
router.get("/profile/image", mypageController.imgGet);

// 프로필 사진 수정
router.put("/profile/image", mypageController.imgUpdate);

// 프로필 사진 삭제
router.delete("/profile/image", mypageController.imgDelete);

// 성함 변경
router.put("/profile/name", mypageController.updateName);

// 비밀번호 변경
router.put("/profile/password", mypageController.updatePassword);

// 회원 탈퇴
router.delete("/profile", mypageController.deleteAccount);

export default router;
