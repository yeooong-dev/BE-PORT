import { Sequelize, DataTypes, Model } from "sequelize";

export interface CalendarAttributes {
  id?: number;
  user_id?: number;
  date: Date;
  time: string;
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
      date: {
        type: DataTypes.DATEONLY, // DATEONLY는 시간을 제외한 날짜만 저장
        allowNull: false,
      },
      time: {
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
