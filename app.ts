import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import session from "express-session";
import logger from "morgan";
import jwt from "jsonwebtoken";
import fs from "fs";
import http from "http";
import https from "https";
import authRoutes from "./routes/auth";
import todoRoutes from "./routes/todo";
import familyEventsRoutes from "./routes/familyEvents";
import calendarRoutes from "./routes/calendar";
import searchRoutes from "./routes/search";
import leaveRoutes from "./routes/leave";
import chartRoutes from "./routes/chart";
import sequelize from "./config/database";
import User from "./models/user";
import { Op } from "sequelize";

interface MyJwtPayload {
    id: number;
}

const PORT = process.env.PORT || 8000;
const path = require("path");
const app = express();

app.use(
    cors({
        origin: "https://port-six-theta.vercel.app",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    })
);

// const options = {
//     key: fs.readFileSync("/etc/letsencrypt/live/portport.shop/privkey.pem"),
//     cert: fs.readFileSync("/etc/letsencrypt/live/portport.shop/fullchain.pem"),
// };

const server = http.createServer(app);
const UserModel = User(sequelize);

app.use(logger("combined"));
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "FE-PORT", "build")));

app.use(
    session({
        secret: "your-secret-key",
        resave: false,
        saveUninitialized: true,
    })
);

app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
            if (typeof decoded !== "string" && "id" in decoded) {
                req.user = decoded as MyJwtPayload;
            }
        } catch (error) {
            console.error("토큰 검증 실패:", error);
        }
    }
    next();
});

app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        console.log(`Received an OPTIONS request for ${req.path}`);
    }
    next();
});

app.get("/", (req, res) => {
    res.send("Hello, BE-PORT!");
});

app.use("/auth", authRoutes);
app.use("/todo", todoRoutes);
app.use("/familyEvents", familyEventsRoutes);
app.use("/calendar", calendarRoutes);
app.use("/search", searchRoutes);
app.use("/leave", leaveRoutes);
app.use("/chart", chartRoutes);

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "FE-PORT", "build", "index.html"));
});

app.listen(PORT, () => {
    console.log(`${PORT}에서 실행 중입니다.`);
});
