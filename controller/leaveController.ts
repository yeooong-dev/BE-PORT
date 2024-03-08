import { Request, Response } from "express";
import { Op } from "sequelize";
import moment from "moment-timezone";
import db from "../models/index";
import { UserAttributes } from "../models/user";

interface LeaveAttributes {
    id: number;
    date: string;
    userId: number;
    status: "APPROVED" | "PENDING" | "DENIED";
    user?: UserAttributes;
}

interface LeaveAttributes {
    id: number;
    date: string;
    userId: number;
    status: "APPROVED" | "PENDING" | "DENIED";
    user?: UserAttributes;
}

const UserModel = db.User;
const CompanyModel = db.Company;
const Leave = db.Leave;

export const getLeaves = async (req: Request, res: Response) => {
    try {
        const dateString: string = req.query.date as string;
        const userId: number | null = req.user ? req.user.id : null;

        if (!userId) {
            return res.status(401).send("사용자가 인증되지 않았습니다.");
        }

        const user: UserAttributes | null = await db.User.findByPk(userId);
        if (!user || !user.company_code) {
            return res.status(400).send("사용자의 회사를 찾을 수 없습니다.");
        }

        const usersInCompany: UserAttributes[] = await db.User.findAll({
            where: { company_code: user.company_code },
            attributes: ["id", "name"],
        });

        const userIds: number[] = usersInCompany.map((user) => user.id).filter((id): id is number => id !== undefined);

        const startDate: string = moment.tz(dateString, "Asia/Seoul").startOf("day").format("YYYY-MM-DD");
        const endDate: string = moment.tz(dateString, "Asia/Seoul").add(1, "days").startOf("day").format("YYYY-MM-DD");

        const leaves: LeaveAttributes[] = await db.Leave.findAll({
            where: {
                date: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate,
                },
                userId: {
                    [Op.in]: userIds,
                },
            },
            include: [
                {
                    model: db.User,
                    as: "user",
                    attributes: ["name"],
                },
            ],
        });

        const response = leaves.map((leave) => {
            const leaveData = (leave as any).get({ plain: true });
            console.log(leaveData);
            return {
                ...leaveData,
                userName: leaveData.user?.name,
            };
        });

        res.json(response);
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
            console.error("사용자 인증 실패");
            return res.status(401).send("사용자 인증 실패");
        }

        const localDateString = moment.tz(date, "Asia/Seoul").format("YYYY-MM-DD");

        if (moment.tz("Asia/Seoul").isAfter(moment(localDateString).tz("Asia/Seoul").endOf("day"))) {
            return res.status(400).send("유효하지 않거나 지난 날짜입니다.");
        }

        const user = await UserModel.findByPk(userId);
        if (!user || !user.company_code) {
            return res.status(400).send("사용자의 회사를 찾을 수 없습니다.");
        }

        if (user.isCompany) {
            return res.status(403).send("기업은 연차신청을 할 수 없습니다.");
        }

        const company = await CompanyModel.findOne({
            where: { company_code: user.company_code },
        });
        if (!company || !company.departments) {
            return res.status(400).send("회사 설정 또는 부서 정보를 찾을 수 없습니다.");
        }

        const existingLeave = await Leave.findOne({
            where: {
                userId,
                date: localDateString,
            },
        });

        if (existingLeave) {
            return res.status(400).send("이미 해당 날짜에 신청하셨습니다.");
        }

        let departmentsCopy = JSON.parse(JSON.stringify(company.departments));
        let employeeUpdated = false;

        for (const departmentName in departmentsCopy) {
            for (const employeeName in departmentsCopy[departmentName]) {
                if (departmentsCopy[departmentName][employeeName].email === user.email) {
                    if (departmentsCopy[departmentName][employeeName].annualLeaveLimit > 0) {
                        departmentsCopy[departmentName][employeeName].annualLeaveLimit -= 1;
                        employeeUpdated = true;
                        break;
                    } else {
                        return res.status(400).send("사용 가능한 연차가 없습니다.");
                    }
                }
            }
            if (employeeUpdated) break;
        }

        if (!employeeUpdated) {
            return res.status(404).send("직원을 찾을 수 없습니다.");
        }

        await company.update({ departments: departmentsCopy });

        const leave = await Leave.create({
            date: localDateString,
            userId,
            status: "PENDING",
        });

        return res.json({
            message: "신청 완료되었습니다.",
            leave: leave,
        });
    } catch (error: any) {
        console.error("연차 신청 오류:", error);
        return res.status(500).send("서버 내부 오류 " + error.message);
    }
};

// 연차 신청 취소
export const deleteLeave = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null;

        if (!userId) {
            return res.status(401).send("사용자가 인증되지 않았습니다.");
        }

        const user = await UserModel.findByPk(userId);

        if (!user || !user.company_code) {
            return res.status(400).send("사용자의 회사를 찾을 수 없습니다.");
        }

        // 연차 신청 삭제
        const leave = await Leave.findOne({ where: { id } });

        if (!leave) {
            return res.status(404).send("연차 신청을 찾을 수 없습니다.");
        }

        await Leave.destroy({ where: { id } });

        // 회사 정보 업데이트
        const company = await CompanyModel.findOne({
            where: { company_code: user.company_code },
        });

        if (!company || !company.departments) {
            return res.status(404).send("회사 정보를 찾을 수 없습니다.");
        }

        let departmentsCopy = JSON.parse(JSON.stringify(company.departments));
        let employeeUpdated = false;

        for (const departmentName in departmentsCopy) {
            let employees = departmentsCopy[departmentName];
            for (const employeeName in employees) {
                let employee = employees[employeeName];
                if (employee.email === user.email) {
                    employee.annualLeaveLimit += 1;
                    employeeUpdated = true;
                    break;
                }
            }
            if (employeeUpdated) break;
        }

        if (!employeeUpdated) {
            return res.status(404).send("직원을 찾을 수 없습니다.");
        }

        await company.update({ departments: departmentsCopy });

        res.send("취소 완료되었습니다.");
    } catch (error: any) {
        console.error("서버 오류:", error.message);
        res.status(500).send("서버 오류: " + error.message);
    }
};
