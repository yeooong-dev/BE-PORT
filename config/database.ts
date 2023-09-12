import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_DIALECT } = process.env;

if (!DB_NAME || !DB_USER || !DB_PASS || !DB_HOST || !DB_DIALECT) {
  console.error(
    "Database configuration error: Some environment variables are missing."
  );
  process.exit(1);
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: DB_DIALECT as "mysql" | "postgres" | "mariadb" | "sqlite" | "mssql",
  logging: console.log,
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

export default sequelize;
