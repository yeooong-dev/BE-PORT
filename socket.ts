import { Server as SocketIOServer } from "socket.io";
import http from "http";

let io: SocketIOServer;

export const initSocket = (server: http.Server): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: ["https://port-six-theta.vercel.app"],
      methods: ["GET", "POST"],
    },
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
