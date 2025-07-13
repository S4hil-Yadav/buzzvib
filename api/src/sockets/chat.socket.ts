import type { Server as SocketServer, Socket } from "socket.io";
import { joinChatrooms, sendMessage } from "@/handlers/chat.handler.js";
import { socketAuthMiddleware } from "@/middleware/socketAuth.middleware.js";

export default function chatSocketHandler(io: SocketServer) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: Socket) => {
    socket.on("join-rooms", joinChatrooms(io, socket));

    socket.on("send-message", sendMessage(io, socket));

    socket.on("disconnect", () => socket.disconnect());
  });
}
