import { Server } from "socket.io";
import registerSocketMiddleware from "./middleware.js";
import registerChatSocket from "../chat/chat.socket.js";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5172",
  "http://localhost:3000",
  "https://exam.tawseela-sina.com",
  "https://acdemix.tawseela-sina.com",
];

let io;
export default function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  registerSocketMiddleware(io);
  registerChatSocket(io);
  return io;
}

export { io };
