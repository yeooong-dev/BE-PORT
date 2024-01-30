import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

interface LeaveAttributes {
  id?: number;
  date: string;
  userId: number;
  status: "APPROVED" | "PENDING" | "DENIED";
}

class Leave extends Model<LeaveAttributes> implements LeaveAttributes {
  public id!: number;
  public date!: string;
  public userId!: number;
  public status!: "APPROVED" | "PENDING" | "DENIED";

  static associate() {
    this.belongsTo(sequelize.model("User"), { foreignKey: "userId" });
  }
}

Leave.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("APPROVED", "PENDING", "DENIED"),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "leaves",
    timestamps: false,
  }
);

Leave.associate();

export default Leave;
