import { Sequelize, DataTypes, Model } from "sequelize";
import createUserModel, { UserModel } from "../user";

export class RoomParticipant extends Model {
  public roomId!: number;
  public userId!: number;
  public joinedAt!: Date;
  public leftAt!: Date | null;
  public user!: UserModel;
  public isVisible!: boolean;
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
      leftAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isVisible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: "room_participants",
      timestamps: false,
    }
  );

  const UserModel = createUserModel(sequelize);

  RoomParticipant.belongsTo(UserModel, {
    foreignKey: "userId",
    as: "user",
  });
};
