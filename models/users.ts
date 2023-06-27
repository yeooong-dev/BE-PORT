import { Sequelize, DataTypes, Model } from "sequelize";
import UserAttributes from "../models/userAttributes";

export interface UserModel extends Model<UserAttributes>, UserAttributes {}

const User = (sequelize: Sequelize) => {
    const User = sequelize.define<UserModel>(
        "User",
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            email: {
                type: DataTypes.STRING(45),
                allowNull: false,
            },
            nickname: {
                type: DataTypes.STRING(45),
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(45),
                allowNull: false,
            },
            password: {
                type: DataTypes.STRING(45),
                allowNull: false,
            },
        },
        {
            tableName: "users",
            freezeTableName: true,
            timestamps: false,
        }
    );

    return User;
};

export default User;
