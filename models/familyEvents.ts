import { Sequelize, DataTypes, Model } from "sequelize";

export interface FamilyEventsAttributes {
  id?: number;
  user_id?: number;
  target: string;
  date: Date;
  type: string;
  amount: number;
}
export interface FamilyEventsInstance
  extends Model<FamilyEventsAttributes>,
    FamilyEventsAttributes {}

const FamilyEvents = (sequelize: Sequelize) => {
  const FamilyEvents = sequelize.define<FamilyEventsInstance>(
    "FamilyEvents",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      target: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "familyEvents",
      timestamps: false,
    }
  );
  return FamilyEvents;
};

export default FamilyEvents;
