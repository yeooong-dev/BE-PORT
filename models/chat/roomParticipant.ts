import { Model, DataTypes, Sequelize } from "sequelize";

export class RoomParticipant extends Model {
  public roomId!: number;
  public userId!: number;
  public joinedAt!: Date;
}

export const initRoomParticipant = (sequelize: Sequelize) => {
  RoomParticipant.init(
    {
      roomId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "room_participants",
      sequelize,
      timestamps: false,
    }
  );
};
