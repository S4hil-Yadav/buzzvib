import { type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import UserModel from "@/models/user.model.js";

export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const { auth } = socket.handshake;

    if (typeof auth !== "object" || auth === null || Array.isArray(auth) || typeof auth.token !== "string") {
      return next(new Error("Invalid auth payload"));
    }

    const decoded = jwt.verify(auth.token, process.env.JWT_SECRET);

    if (typeof decoded === "string" || typeof decoded.userId !== "string") {
      return next(new Error("Invalid token payload"));
    }

    const user = await UserModel.exists({ _id: decoded.userId });
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.data.user = { _id: decoded.userId };
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
}
