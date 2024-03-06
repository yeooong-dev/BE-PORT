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
import chatRoutes from "./routes/chat";
import searchRoutes from "./routes/search";
import leaveRoutes from "./routes/leave";
import chartRoutes from "./routes/chart";
import sequelize from "./config/database";
import { defineRelations } from "./models/chat/defineRelations";
import { initSocket } from "./socket";
import { Chat } from "./models/chat/chat";
import User from "./models/user";
import { RoomParticipant } from "./models/chat/roomParticipant";
import { Op } from "sequelize";

interface MyJwtPayload {
  id: number;
}

const PORT = process.env.PORT || 8000;
const path = require("path");
const app = express();

app.use(
  cors({
    // origin: "https://port-six-theta.vercel.app",
    origin: "http://localhost:3000",
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
const io = initSocket(server as any);
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
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret"
      );
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

async function getUpdatedChatListForRoom(roomId: number, userId?: number) {
  console.log(
    `채팅방 ${roomId}과 사용자 ${userId}에 대한 채팅 목록을 가져오는 중`
  );

  try {
    const roomParticipant = userId
      ? await RoomParticipant.findOne({
          where: { roomId, userId },
        })
      : null;
    let whereClause = {
      roomId,
      ...(roomParticipant &&
      roomParticipant.isVisible === false &&
      roomParticipant.leftAt
        ? { createdAt: { [Op.gt]: roomParticipant.leftAt } }
        : {}),
    };

    const chats = await Chat.findAll({
      where: whereClause,
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "name", "profile_image"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    return chats.map((chat) => ({
      id: chat.id,
      message: chat.message,
      user: chat.user,
    }));
  } catch (error) {
    console.error("방에 대한 채팅 목록 가져오기 오류:", error);
    return [];
  }
}

io.on("connection", (socket) => {
  socket.on("join room", async (roomId, userId) => {
    console.log(`[서버] 사용자 참가 (방 ID: ${roomId}, 사용자 ID: ${userId})`);
    socket.join(roomId.toString());

    try {
      const existingParticipant = await RoomParticipant.findOne({
        where: { roomId, userId },
      });

      if (existingParticipant) {
        await RoomParticipant.update(
          { isVisible: true, leftAt: null, joinedAt: new Date() },
          { where: { roomId, userId } }
        );
      } else {
        await RoomParticipant.create({
          roomId,
          userId,
          isVisible: true,
          joinedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("방 참가자 업데이트 오류:", error);
    }
  });

  socket.on("join user room", (userId) => {
    socket.join(userId.toString());
  });

  socket.on("leave room", async ({ roomId, userId }) => {
    console.log(
      `[서버] 사용자 나가기 (방 ID: ${roomId}, 사용자 ID: ${userId})`
    );

    try {
      console.log(
        `[leave room] User ID: ${userId} is leaving Room ID: ${roomId}`
      );
      await RoomParticipant.update(
        { isVisible: false, leftAt: new Date() },
        { where: { roomId, userId } }
      );
      socket.leave(roomId.toString());
      console.log(`User ${userId} left room ${roomId}`);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });

  socket.on("chat message in room", async ({ roomId, message, userId }) => {
    try {
      const chat = await Chat.create({ userId, roomId, message });
      const user = await UserModel.findOne({ where: { id: userId } });

      if (!user) {
        console.error("메시지 보낸 사용자 정보를 찾을 수 없음");
        return;
      }

      const participants = await RoomParticipant.findAll({
        where: { roomId, isVisible: true },
      });

      participants.forEach((participant) => {
        io.to(roomId.toString()).emit("new message", {
          id: chat.id,
          roomId,
          message,
          userId,
          createdAt: chat.createdAt,
          user: {
            id: user.id,
            name: user.name,
            profile_image: user.profile_image,
          },
        });
      });
    } catch (error) {
      console.error("메시지 처리 중 오류 발생", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`사용자 연결 해제됨: ${socket.id}`);
  });
});

sequelize
  .sync()
  .then(() => {
    defineRelations();
  })
  .catch((err) => console.error("데이터베이스를 동기화할 수 없음:", err));

app.get("/", (req, res) => {
  res.send("Hello, BE-PORT!");
});

app.use("/auth", authRoutes);
app.use("/todo", todoRoutes);
app.use("/familyEvents", familyEventsRoutes);
app.use("/calendar", calendarRoutes);
app.use("/chat", chatRoutes);
app.use("/search", searchRoutes);
app.use("/leave", leaveRoutes);
app.use("/chart", chartRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "FE-PORT", "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`${PORT}에서 실행 중입니다.`);
});
