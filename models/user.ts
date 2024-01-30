import { Sequelize, DataTypes, Model, ModelCtor } from "sequelize";

export interface UserAttributes {
  id?: number;
  email: string;
  name?: string;
  company_name?: string;
  password: string;
  profile_image?: string | null;
  company_code?: string | null;
}

export interface UserModel extends Model<UserAttributes>, UserAttributes {}

const User = (sequelize: Sequelize): ModelCtor<UserModel> => {
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
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      profile_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      company_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      company_code: {
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
