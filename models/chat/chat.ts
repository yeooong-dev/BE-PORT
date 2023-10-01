import { Model, DataTypes, Sequelize } from "sequelize";

export class Chat extends Model {
  public id!: number;
  public roomId!: number;
  public userId!: number;
  public message!: string;
  public createdAt!: Date;
}

export const initChat = (sequelize: Sequelize) => {
  Chat.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      roomId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "chats",
      sequelize,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: false,
    }
  );
};
