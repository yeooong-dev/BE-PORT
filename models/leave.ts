import { DataTypes, Model, Sequelize } from "sequelize";

interface LeaveAttributes {
    id?: number;
    date: string;
    userId: number;
    status: "APPROVED" | "PENDING" | "DENIED";
}

interface LeaveInstance extends Model<LeaveAttributes, Omit<LeaveAttributes, "id">> {}

const Leave = (sequelize: Sequelize) => {
    const Leave = sequelize.define<LeaveInstance>(
        "Leave",
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            date: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM("APPROVED", "PENDING", "DENIED"),
                allowNull: false,
            },
        },
        {
            tableName: "leaves",
            timestamps: false,
        }
    );
    return Leave;
};

export default Leave;
