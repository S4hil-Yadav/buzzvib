import type { Server as SocketServer, Socket } from "socket.io";
import { socketAuthMiddleware } from "@/middleware/socketAuth.middleware.js";
import { registerChatHandlers } from "@/sockets/chat.socket.js";

export default function socketHandler(io: SocketServer) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: Socket) => {
    registerChatHandlers(io, socket);

    socket.on("disconnect", () => socket.disconnect());
  });
}
