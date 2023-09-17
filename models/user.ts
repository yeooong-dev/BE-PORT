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
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      profile_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
