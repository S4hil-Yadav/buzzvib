import { useEffect } from "react";
import { SocketContext } from "./SocketContext";
import socket from "@/lib/socket";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!socket.connected) socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
