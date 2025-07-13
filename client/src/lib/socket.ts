import { io, Socket } from "socket.io-client";

const socket: Socket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
  withCredentials: true,
  transports: ["websocket"],
  autoConnect: true,
});

export default socket;
