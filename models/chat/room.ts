import { Model, DataTypes, Sequelize } from "sequelize";

export class Room extends Model {
  public id!: number;
  public name!: string;
  public image_url!: string | null;
  public readonly createdAt!: Date;
}

export const initRoom = (sequelize: Sequelize) => {
  Room.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "rooms",
      sequelize,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: false,
    }
  );
};
