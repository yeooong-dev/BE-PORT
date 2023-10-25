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
import { Chat } from "./models/chat/chat";

interface MyJwtPayload {
  id: number;
}

const PORT = Number(process.env.PORT) || 8000;
const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

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
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in .env file");
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (typeof decoded !== "string" && "id" in decoded) {
        req.user = decoded as MyJwtPayload;
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ error: "Invalid token" });
      return;
    }
  }
  next();
});

// socket
io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  socket.on("join room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("leave room", (roomId) => {
    socket.leave(roomId);
  });

  socket.on("chat message", async (data) => {
    console.log(
      `Received message from user ${data.userId} in room ${data.roomId}:`,
      data.msg
    );
    io.to(data.roomId).emit("chat message", data.msg);
    console.log(`Sent message to room ${data.roomId}:`, data.msg);

    try {
      await Chat.create({
        userId: data.userId,
        roomId: data.roomId,
        message: data.msg,
      });
    } catch (error) {
      console.error("Error saving chat message to database:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

sequelize
  .sync()
  .then(() => {
    console.log("database synchronized");
    defineRelations();
  })
  .catch((err) => console.error("Unable to synchronize the database:", err));

app.get("/", (req, res) => {
  res.send("Hello, BE-PORT!");
});

app.use("/auth", authRoutes);
app.use("/todo", todoRoutes);
app.use("/familyEvents", familyEventsRoutes);
app.use("/calendar", calendarRoutes);
app.use("/chat", chatRoutes);

server.listen(PORT, () => {
  console.log(`Server with Socket.io is running on port ${PORT}`);
});
