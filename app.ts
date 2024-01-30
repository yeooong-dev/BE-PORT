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
import searchRoutes from "./routes/search";
import leaveRoutes from "./routes/leave";
import chartRoutes from "./routes/chart";
import http from "http";
import sequelize from "./config/database";
import { defineRelations } from "./models/chat/defineRelations";
import { initSocket } from "./socket";
import { Chat } from "./models/chat/chat";
import User from "./models/user";
import { RoomParticipant } from "./models/chat/roomParticipant";

interface MyJwtPayload {
  id: number;
}

const PORT = Number(process.env.PORT) || 8000;
const app = express();
const server = http.createServer(app);
const io = initSocket(server);
const UserModel = User(sequelize);

console.log("Socket.io instance initialized:", io);

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
0;

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

async function getUpdatedChatListForRoom(roomId: number) {
  try {
    const chats = await Chat.findAll({
      where: { roomId },
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
    console.error("Error fetching chat list for room:", error);
    return [];
  }
}

io.on("connection", (socket) => {
  socket.on("join room", async (roomId, userId) => {
    console.log(
      `Join room event received for room: ${roomId} and user: ${userId}`
    );
    socket.join(roomId.toString());

    try {
      if (userId) {
        await RoomParticipant.update(
          { isVisible: true },
          { where: { roomId, userId } }
        );
      } else {
        console.error("userId is undefined in join room event");
      }
    } catch (error) {
      console.error("Error updating room participant:", error);
    }
  });

  socket.on("join user room", (userId) => {
    socket.join(userId.toString());
    console.log(`사용자 ${socket.id}가 개인 방 ${userId}에 참여했습니다.`);
  });

  socket.on("leave room", async ({ roomId, userId }) => {
    console.log(`User ${userId} leaving room: ${roomId}`);
    try {
      await RoomParticipant.update(
        { isVisible: false, leftAt: new Date() },
        { where: { roomId, userId } }
      );
      socket.leave(roomId.toString());
      console.log(`User ${userId} left room: ${roomId}`);
    } catch (error) {
      console.error("Error in leave room:", error);
    }
  });

  socket.on("chat message in room", async ({ roomId, message, userId }) => {
    console.log(
      `방 ${roomId}에서 사용자 ${userId}의 채팅 메시지 수신됨: ${message}`
    );

    try {
      if (!userId || !roomId) {
        console.error("잘못된 사용자 ID 또는 방 ID:", userId, roomId);
        return;
      }

      console.log(
        `DB에 채팅 메시지 저장 시도: userId=${userId}, roomId=${roomId}, message=${message}`
      );
      const chat = await Chat.create({ userId, roomId, message });
      console.log(`DB에 저장된 채팅 메시지:`, chat);

      if (!chat) {
        console.error("Failed to create chat message");
        return;
      }

      console.log(`사용자 ID ${userId}에 대한 정보 DB에서 조회 시도`);
      const user = await UserModel.findOne({ where: { id: userId } });
      console.log(`UserModel.findOne 결과:`, user);
      if (!user) {
        console.error("User not found for id:", userId);
        return;
      }

      console.log(`방 ${roomId}의 업데이트된 채팅 목록 DB에서 조회 시도`);
      const updatedChatList = await getUpdatedChatListForRoom(roomId);
      console.log(`getUpdatedChatListForRoom 결과:`, updatedChatList);
      if (!updatedChatList) {
        console.error("Failed to fetch updated chat list");
        return;
      }

      const newMessageData = {
        id: chat.id,
        roomId,
        message: chat.message,
        user: {
          id: userId,
          name: user.name,
          profile_image: user.profile_image,
        },
      };
      console.log("새 메시지 데이터 생성됨:", newMessageData);

      try {
        console.log(`Emitting new message to room: ${roomId}`);
        io.to(roomId.toString()).emit("new message", {
          messageData: newMessageData,
          updatedChatList,
        });
        console.log(`New message event broadcasted to room: ${roomId}`);
      } catch (error) {
        console.error(`Error emitting new message to room: ${roomId}`, error);
      }

      console.log(`방 참가자들에게 업데이트된 채팅 목록 방송`);

      const participants = await RoomParticipant.findAll({
        where: { roomId, isVisible: true },
      });

      participants.forEach((participant) => {
        if (participant.userId !== userId) {
          io.to(participant.userId.toString()).emit("new message", {
            messageData: newMessageData,
            updatedChatList,
          });
        }
      });
      console.log(`방 참가자들에게 업데이트된 채팅 목록 방송됨`);
    } catch (error: any) {
      console.error("Error in chat message in room:", error.message);
      console.error(error.stack);
    }
  });

  socket.on("disconnect", () => {
    console.log(`사용자 연결 해제됨: ${socket.id}`);
  });
});

sequelize
  .sync()
  .then(() => {
    console.log("Database synchronized");
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
app.use("/search", searchRoutes);
app.use("/leave", leaveRoutes);
app.use("/chart", chartRoutes);

server.listen(PORT, () => {
  console.log(`Server with Socket.io is running on port ${PORT}`);
});
