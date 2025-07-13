import { createContext } from "react";
import type { Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import socket from "@/lib/socket";

export const SocketContext = createContext<Socket<DefaultEventsMap, DefaultEventsMap>>(socket);
