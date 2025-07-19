import type { Server as SocketServer, Socket } from "socket.io";
import { joinChatrooms, sendMessage } from "@/handlers/chat.handler.js";

export function registerChatHandlers(io: SocketServer, socket: Socket) {
  socket.on("join-rooms", joinChatrooms(io, socket));
  socket.on("send-message", sendMessage(io, socket));
}
