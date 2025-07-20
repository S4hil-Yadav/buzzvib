import { io, Socket } from "socket.io-client";

const socket: Socket = io(import.meta.env.VITE_API_URL, {
  auth: { token: localStorage.getItem("accessToken") },
  transports: ["websocket"],
  autoConnect: true,
});

export default socket;
