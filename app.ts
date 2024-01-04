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
import http from "http";
import sequelize from "./config/database";
import { defineRelations } from "./models/chat/defineRelations";
import { initSocket } from "./socket";
import { Chat } from "./models/chat/chat";
import User from "./models/user";

interface MyJwtPayload {
  id: number;
}

const PORT = Number(process.env.PORT) || 8000;
const app = express();
const server = http.createServer(app);
const io = initSocket(server);
const UserModel = User(sequelize);

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

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
  socket.on("join room", (roomId) => {
    socket.join(roomId.toString());
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("join user room", (userId) => {
    socket.join(userId.toString());
    console.log(`User ${socket.id} joined user room ${userId}`);
  });

  socket.on("chat message in room", async ({ roomId, message, userId }) => {
    try {
      if (!userId || !roomId) {
        console.error("Invalid userId or roomId:", userId, roomId);
        return;
      }

      const chat = await Chat.create({ userId, roomId, message });
      const user = await UserModel.findOne({ where: { id: userId } });

      if (!user) {
        console.error("User not found for id:", userId);
        return;
      }

      const updatedChatList = await getUpdatedChatListForRoom(roomId);
      console.log("Updated Chat List:", updatedChatList);

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

      io.to(roomId.toString()).emit("new message", {
        messageData: newMessageData,
        updatedChatList,
      });
      io.to(roomId.toString()).emit("updated chat list", updatedChatList);
    } catch (error) {
      console.error("Error in chat message in room:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
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

server.listen(PORT, () => {
  console.log(`Server with Socket.io is running on port ${PORT}`);
});
