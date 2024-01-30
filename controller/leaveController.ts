import { Request, Response } from "express";
import Leave from "../models/leave";
import sequelize from "../config/database";
import { Op } from "sequelize";
import moment from "moment-timezone";
import User from "../models/user";
import Company from "../models/company";

const UserModel = User(sequelize);
const CompanyModel = Company(sequelize);

export const getLeaves = async (req: Request, res: Response) => {
  try {
    const dateString = req.query.date as string;

    // 타임존을 고려하여 시작 날짜와 다음 날짜 구하기
    const startDate = moment
      .tz(dateString, "Asia/Seoul")
      .startOf("day")
      .format("YYYY-MM-DD");
    const endDate = moment
      .tz(dateString, "Asia/Seoul")
      .add(1, "days")
      .startOf("day")
      .format("YYYY-MM-DD");

    const leaves = await Leave.findAll({
      where: {
        date: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },
      include: [{ model: sequelize.model("User"), attributes: ["name"] }],
    });
    res.json(leaves);
  } catch (error: any) {
    console.error(error);
    res.status(500).send(error.message);
  }
};

export const applyLeave = async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      console.error("User not authenticated");
      return res.status(401).send("User not authenticated");
    }

    // 클라이언트에서 보낸 날짜를 직접 사용
    const localDateString = moment.tz(date, "Asia/Seoul").format("YYYY-MM-DD");

    // 오늘 이전의 날짜인지 확인
    if (
      moment
        .tz("Asia/Seoul")
        .isAfter(moment(localDateString).tz("Asia/Seoul").endOf("day"))
    ) {
      return res.status(400).send("Invalid or past date");
    }

    // 사용자 정보와 기업 설정 가져오기
    const user = await UserModel.findByPk(userId);
    if (!user || !user.company_code) {
      return res.status(400).send("Company not found for the user");
    }
    const company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });
    if (!company) {
      return res.status(400).send("Company settings not found");
    }

    // 하루 연차 신청 가능 인원수 검사
    const dailyLeaveCount = await Leave.count({
      where: {
        date: localDateString,
      },
    });

    const dailyMaxLeaves =
      company.dailyMaxLeaves != null ? company.dailyMaxLeaves : 2;

    if (dailyLeaveCount >= dailyMaxLeaves) {
      return res
        .status(400)
        .send("Leave application limit reached for this date");
    }

    // 연간 연차 사용 횟수 검사
    const annualLeaveUsed = await Leave.count({
      where: {
        userId,
        date: {
          [Op.gte]: moment().startOf("year").toDate(),
          [Op.lt]: moment().endOf("year").toDate(),
        },
      },
    });

    const annualLeaveLimit =
      company.annualLeaveLimit != null ? company.annualLeaveLimit : 12;

    if (annualLeaveUsed >= annualLeaveLimit) {
      return res.status(400).send("Annual leave limit reached for the user");
    }

    // 연차 신청
    const leave = await Leave.create({
      date: localDateString,
      userId,
      status: "PENDING",
    });

    res.json(leave);
  } catch (error: any) {
    console.error("Error in applyLeave:", error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
};

// 연차 신청 삭제
export const deleteLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // 연차 신청 ID
    const result = await Leave.destroy({
      where: { id },
    });

    if (result > 0) {
      res.send({ message: "Leave application deleted successfully" });
    } else {
      res.status(404).send({ message: "Leave application not found" });
    }
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};
