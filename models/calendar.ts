import { Sequelize, DataTypes, Model } from "sequelize";

export interface CalendarAttributes {
  id?: number;
  user_id?: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  title: string;
}

export interface CalendarModel
  extends Model<CalendarAttributes>,
    CalendarAttributes {}

const Calendar = (sequelize: Sequelize) => {
  const Calendar = sequelize.define<CalendarModel>(
    "Calendar",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      tableName: "calendar",
      freezeTableName: true,
      timestamps: false,
    }
  );

  return Calendar;
};

export default Calendar;
