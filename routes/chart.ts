import express from "express";
import * as chartController from "../controller/chartController";

const router = express.Router();

// 대표 이름 관련 라우트
router.get("/getCeoName", chartController.getCeoName);
router.post("/updateCeoName", chartController.updateCeoName);

// 부서 관련 라우트
router.get("/getDepartments", chartController.getDepartments);
router.post("/updateDepartments", chartController.updateDepartments);
router.post("/deleteDepartment", chartController.deleteDepartment);

// 직원 등록
router.post("/registerEmployee", chartController.registerEmployee);

// 직원 삭제
router.post("/deleteEmployee", chartController.deleteEmployee);

export default router;
