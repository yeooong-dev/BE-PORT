import { Sequelize, DataTypes, Model } from "sequelize";

export interface TodoAttributes {
  todo_id?: number;
  user_id: number;
  text: string;
  completed: boolean;
}
export interface TodoInstance extends Model<TodoAttributes>, TodoAttributes {}

const Todo = (sequelize: Sequelize) => {
  const Todo = sequelize.define<TodoInstance>(
    "Todo",
    {
      todo_id: {
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
      text: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "todos",
      timestamps: true,
    }
  );
  return Todo;
};

export default Todo;
