import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import session from "express-session";
import logger from "morgan";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth";
import todoRoutes from "./routes/todo";
import familyEventsRoutes from "./routes/familyEvents";
import calendarRoutes from "./routes/calendar";
import chatRoutes from "./routes/chat";
import http from "http";
import { Server } from "socket.io";
import sequelize from "./config/database";
import { defineRelations } from "./models/chat/defineRelations";

interface MyJwtPayload {
  id: number;
}

const PORT = Number(process.env.PORT) || 8000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret"
      );
      if (typeof decoded !== "string" && "id" in decoded) {
        req.user = decoded as MyJwtPayload;
      }
    } catch (error) {
      console.error("Token verification failed:", error);
    }
  }
  next();
});

io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });
});

sequelize
  .sync()
  .then(() => {
    console.log("database synchronized");
    defineRelations();
  })
  .catch((err) => console.error("Unable to synchronize the database:", err));

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.get("/", (req, res) => {
  res.send("Hello, BE-PORT!");
});

app.use("/auth", authRoutes);
app.use("/todo", todoRoutes);
app.use("/familyEvents", familyEventsRoutes);
app.use("/calendar", calendarRoutes);
app.use("/chat", chatRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
