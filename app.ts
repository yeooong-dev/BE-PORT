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
import { RoomParticipant } from "./models/chat/roomParticipant";

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

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on("join room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
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

      const participants = await RoomParticipant.findAll({
        where: { roomId },
        attributes: ["userId"],
      });

      participants.forEach((participant) => {
        console.log(
          `Sending message to user ${participant.userId} in room ${roomId}`
        );
        socket.to(roomId.toString()).emit("chat message", {
          roomId,
          content: message,
          user: {
            id: user.id,
            name: user.name,
            profile_image: user.profile_image,
          },
        });
      });
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
