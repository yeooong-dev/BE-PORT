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

interface MyJwtPayload {
  id: number;
}

const PORT = Number(process.env.PORT) || 8000;
const app = express();

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

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.use("/auth", authRoutes);
app.use("/todo", todoRoutes);
app.use("/familyEvents", familyEventsRoutes);
app.use("/calendar", calendarRoutes);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
