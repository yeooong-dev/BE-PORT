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
      return res.status(404).send({ message: "Company not found" });
    }

    const company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });

    if (!company || !company.ceoName) {
      return res.send({ ceoName: "" });
    }
    res.send({ ceoName: company.ceoName });
  } catch (error) {
    res.status(500).send({ message: "Error retrieving CEO name" });
  }
};

export const updateCeoName = async (req: Request, res: Response) => {
  try {
    const { ceoName } = req.body;
    const user = await UserModel.findByPk(req.user.id);

    if (!user || !user.company_code) {
      return res.status(404).send({ message: "User or company not found" });
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

    res.send({ message: "CEO name updated successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error updating CEO name" });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).send({ message: "User not authenticated" });
    }

    const user = await UserModel.findByPk(req.user.id);
    if (!user || !user.company_code) {
      return res.status(404).send({ message: "Company not found" });
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
    console.error("Error retrieving departments:", error);
    res.status(500).send({
      message: "Error retrieving departments",
      error: error.toString(),
    });
  }
};

export const updateDepartments = async (req: Request, res: Response) => {
  try {
    const { departments } = req.body;
    const user = await UserModel.findByPk(req.user.id);

    if (!user || !user.company_code) {
      return res.status(404).send({ message: "User or company not found" });
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

    res.send({ message: "Departments updated successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error updating departments" });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  const { departmentName } = req.body;

  try {
    const user = await UserModel.findByPk(req.user.id);
    if (!user || !user.company_code) {
      return res.status(404).send({ message: "Company not found" });
    }

    const company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });
    if (!company) {
      return res.status(404).send({ message: "Company not found" });
    }

    let departments = company.departments || {};

    const updatedDepartments = { ...departments };
    delete updatedDepartments[departmentName];

    await company.update({ departments: updatedDepartments });

    res.send({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).send({ message: "Error deleting department" });
  }
};

export const registerEmployee = async (req: Request, res: Response) => {
  const { departmentName, employee } = req.body;

  try {
    const user = await UserModel.findByPk(req.user.id);
    if (!user || !user.company_code) {
      return res.status(404).send({ message: "Company not found" });
    }

    const company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });

    if (!company) {
      return res.status(404).send({ message: "Company not found" });
    }

    let departments = company.departments || {};
    if (!departments[departmentName]) {
      departments[departmentName] = {};
    }

    const updatedDepartments = {
      ...departments,
      [departmentName]: {
        ...departments[departmentName],
        [employee.name]: {
          email: employee.email,
          joinYear: employee.joinYear,
        },
      },
    };

    await company.update({ departments: updatedDepartments });

    res.send(departments);
  } catch (error) {
    console.error("Error registering employee:", error);
    res.status(500).send({ message: "Error registering employee" });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const { departmentName, employeeName } = req.body;

  try {
    const user = await UserModel.findByPk(req.user.id);
    if (!user || !user.company_code) {
      return res.status(404).send({ message: "Company not found" });
    }

    const company = await CompanyModel.findOne({
      where: { company_code: user.company_code },
    });
    if (!company) {
      return res.status(404).send({ message: "Company not found" });
    }

    let departments = { ...company.departments };

    if (
      departments[departmentName] &&
      departments[departmentName][employeeName]
    ) {
      delete departments[departmentName][employeeName];

      await CompanyModel.update(
        {
          departments: departments,
        },
        {
          where: { company_code: user.company_code },
        }
      );
    } else {
      return res.status(404).send({ message: "Employee not found" });
    }

    res.send({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).send({ message: "Error deleting employee" });
  }
};
