import { Sequelize } from "sequelize";
import * as process from "process";
import * as path from "path";
import { Dialect } from "sequelize/types";

const env: string = process.env.NODE_ENV || "development";
const config = require(path.join(__dirname, "../config/config.json"))[env] as {
    database: string;
    username: string;
    password: string;
    dialect: Dialect;
};

interface Db {
    sequelize: Sequelize;
    Sequelize: typeof Sequelize;
    User?: any;
    Todo?: any;
    Leave?: any;
    FamilyEvents?: any;
    Company?: any;
    Calendar?: any;
}

const db: Db = {} as Db;

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.User = require("./user").default(sequelize);
db.Todo = require("./todo").default(sequelize);
db.Leave = require("./leave").default(sequelize);
db.FamilyEvents = require("./familyEvents").default(sequelize);
db.Company = require("./company").default(sequelize);
db.Calendar = require("./calendar").default(sequelize);
db.User.hasMany(db.Leave, { foreignKey: "userId", as: "leaves" });
db.Leave.belongsTo(db.User, { foreignKey: "userId", as: "user" });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
