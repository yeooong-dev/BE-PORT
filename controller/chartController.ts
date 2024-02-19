import { Request, Response } from "express";
import Company, { DepartmentAttributes } from "../models/company";
import sequelize from "../config/database";
import User from "../models/user";
const UserModel = User(sequelize);
const CompanyModel = Company(sequelize);

export const getCeoName = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findByPk(req.user.id);
    if (!user || !user.company_code) {
      return res.status(404).send({ message: "회사를 찾을 수 없습니다." });
    }

    const company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });

    if (!company || !company.ceoName) {
      return res.send({ ceoName: "" });
    }
    res.send({ ceoName: company.ceoName });
  } catch (error) {
    res
      .status(500)
      .send({ message: "CEO 이름을 검색하는 중 오류가 발생했습니다." });
  }
};

export const updateCeoName = async (req: Request, res: Response) => {
  try {
    const { ceoName } = req.body;
    const user = await UserModel.findByPk(req.user.id);

    if (!user || !user.company_code) {
      return res
        .status(404)
        .send({ message: "사용자 또는 회사를 찾을 수 없습니다." });
    }

    let company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });

    if (!company) {
      company = await CompanyModel.create({
        company_code: user.company_code,
        ceoName,
      });
    } else {
      await company.update({ ceoName });
    }

    res.send({ message: "CEO 이름이 성공적으로 업데이트 되었습니다." });
  } catch (error) {
    res
      .status(500)
      .send({ message: "CEO 이름을 업데이트 하는 중 오류가 발생했습니다." });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).send({ message: "사용자가 인증되지 않았습니다." });
    }

    const user = await UserModel.findByPk(req.user.id);
    if (!user || !user.company_code) {
      return res.status(404).send({ message: "회사를 찾을 수 없습니다." });
    }

    const company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });

    if (company && company.departments) {
      res.send(company.departments);
    } else {
      res.send({});
    }
  } catch (error: any) {
    console.error("부서 정보를 검색하는 중 오류 발생:", error);
    res.status(500).send({
      message: "부서 정보를 검색하는 중 오류가 발생했습니다.",
      error: error.toString(),
    });
  }
};

export const updateDepartments = async (req: Request, res: Response) => {
  try {
    const { departments } = req.body;
    const user = await UserModel.findByPk(req.user.id);

    if (!user || !user.company_code) {
      return res
        .status(404)
        .send({ message: "사용자 또는 회사를 찾을 수 없습니다." });
    }

    let company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });

    if (!company) {
      company = await CompanyModel.create({
        company_code: user.company_code,
        departments: departments,
      });
    } else {
      await company.update({ departments: departments });
    }

    res.send({ message: "부서가 성공적으로 업데이트 되었습니다." });
  } catch (error) {
    res
      .status(500)
      .send({ message: "부서를 업데이트 하는 중 오류가 발생했습니다." });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  const { departmentName } = req.body;

  try {
    const user = await UserModel.findByPk(req.user.id);
    if (!user || !user.company_code || !user.isCompany) {
      return res
        .status(404)
        .send({ message: "회사를 찾을 수 없거나 권한이 없습니다." });
    }

    const company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });
    if (!company) {
      return res.status(404).send({ message: "회사를 찾을 수 없습니다." });
    }

    let departments = company.departments || {};

    const updatedDepartments = { ...departments };
    delete updatedDepartments[departmentName];

    await company.update({ departments: updatedDepartments });

    res.send({ message: "부서가 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("부서를 삭제하는 중 오류 발생:", error);
    res
      .status(500)
      .send({ message: "부서를 삭제하는 중 오류가 발생했습니다." });
  }
};

export const registerEmployee = async (req: Request, res: Response) => {
  const { departmentName, employee } = req.body;

  try {
    const existingUser = await UserModel.findOne({
      where: { email: employee.email },
    });
    if (!existingUser) {
      return res.status(404).send({
        message: "가입된 사용자가 아니므로 직원 등록을 할 수 없습니다.",
      });
    }

    if (existingUser.company_code) {
      return res
        .status(409)
        .send({ message: "이미 다른 회사에 등록된 직원입니다." });
    }

    const user = await UserModel.findByPk(req.user.id);
    if (!user || !user.company_code) {
      return res.status(404).send({ message: "회사를 찾을 수 없습니다." });
    }

    const company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });

    if (!company) {
      return res.status(404).send({ message: "회사를 찾을 수 없습니다." });
    }

    let departments = company.departments || {};
    if (!departments[departmentName]) {
      departments[departmentName] = {};
    }

    if (departments[departmentName][employee.email]) {
      return res.status(409).send({ message: "이미 등록된 직원입니다." });
    }

    const updatedDepartments = {
      ...departments,
      [departmentName]: {
        ...departments[departmentName],
        [employee.name]: {
          email: employee.email,
          joinYear: employee.joinYear,
          annualLeaveLimit: employee.annualLeaveLimit,
        },
      },
    };

    await company.update({ departments: updatedDepartments });
    await existingUser.update({
      isEmployeeRegistered: true,
      company_code: company.company_code,
    });

    res.send({ message: "직원이 성공적으로 등록되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "직원 등록 중 오류가 발생했습니다." });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const { departmentName, employee } = req.body;

  try {
    const user = await UserModel.findByPk(req.user.id);
    if (!user || !user.company_code) {
      return res.status(404).send({ message: "회사를 찾을 수 없습니다." });
    }

    const company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });
    if (
      !company ||
      !company.departments ||
      !(departmentName in company.departments)
    ) {
      return res.status(404).send({ message: "해당 부서를 찾을 수 없습니다." });
    }

    let found = false;
    for (const employeeName in company.departments[departmentName]) {
      if (
        company.departments[departmentName][employeeName].email ===
        employee.email
      ) {
        delete company.departments[departmentName][employeeName];
        found = true;
        break;
      }
    }

    if (found) {
      company.changed("departments", true);
      await company.update({ departments: company.departments });

      const employeeUser = await UserModel.findOne({
        where: { email: employee.email },
      });
      if (employeeUser) {
        await employeeUser.update({
          company_code: null,
          isEmployeeRegistered: false,
        });
      }

      res.send({ message: "직원이 성공적으로 삭제되었습니다." });
    } else {
      return res.status(404).send({
        message: "지정된 부서에서 해당 이메일을 가진 직원을 찾을 수 없습니다.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "직원 삭제 중 오류가 발생했습니다." });
  }
};

export const getDailyMaxLeaves = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findByPk(req.user.id);
    if (!user || !user.company_code) {
      return res.status(404).send({ message: "회사를 찾을 수 없습니다." });
    }

    const company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });

    if (!company || !company.dailyMaxLeaves) {
      return res.send({ dailyMaxLeaves: "" });
    }
    res.send({ dailyMaxLeaves: company.dailyMaxLeaves });
  } catch (error) {
    res
      .status(500)
      .send({ message: "dailyMaxLeaves 검색 중 오류가 발생했습니다." });
  }
};

export const updateDailyMaxLeaves = async (req: Request, res: Response) => {
  try {
    const { dailyMaxLeaves } = req.body;
    const user = await UserModel.findByPk(req.user.id);

    if (!user || !user.company_code) {
      return res
        .status(404)
        .send({ message: "사용자 또는 회사를 찾을 수 없습니다." });
    }

    let company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });

    if (!company) {
      company = await CompanyModel.create({
        company_code: user.company_code,
        dailyMaxLeaves,
      });
    } else {
      await company.update({ dailyMaxLeaves });
    }

    res.send({ message: "dailyMaxLeaves가 성공적으로 업데이트되었습니다." });
  } catch (error) {
    res
      .status(500)
      .send({ message: "dailyMaxLeaves 업데이트 중 오류가 발생했습니다." });
  }
};
