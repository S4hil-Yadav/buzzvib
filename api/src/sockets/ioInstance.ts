import { logApiError } from "@/loggers/api.logger.js";
import { Server as SocketServer } from "socket.io";

let io: SocketServer;

export function setSocketIOInstance(ioInstance: SocketServer) {
  io = ioInstance;
}

export function getSocketIOInstance(): SocketServer {
  if (!io) {
    logApiError("Socket.IO instance requested before initialization");
    throw new Error("Socket.IO instance not initialized");
  }
  return io;
}
