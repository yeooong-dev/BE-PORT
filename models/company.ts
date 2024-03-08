import { Sequelize, DataTypes, Model, ModelCtor } from "sequelize";

export interface CompanyAttributes {
    id?: number;
    company_code: string;
    dailyMaxLeaves?: number | null;
    ceoName?: string;
    departments?: DepartmentAttributes;
}

export interface DepartmentAttributes {
    [departmentName: string]: { [employeeName: string]: EmployeeAttributes };
}

export interface EmployeeAttributes {
    email: string;
    joinYear: string;
    annualLeaveLimit: number;
}

export interface CompanyModel extends Model<CompanyAttributes>, CompanyAttributes {}

const Company = (sequelize: Sequelize): ModelCtor<CompanyModel> => {
    const Company = sequelize.define<CompanyModel>(
        "Company",
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            company_code: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            dailyMaxLeaves: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            ceoName: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            departments: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            tableName: "companies",
            freezeTableName: true,
            timestamps: false,
        }
    );

    return Company;
};

export default Company;
