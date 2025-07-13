import express from "express";
import http from "http";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import authRoutes from "@/routes/auth.routes.js";
import userRoutes from "@/routes/user.routes.js";
import postRoutes from "@/routes/post.routes.js";
import followRoutes from "@/routes/follow.routes.js";
import commentRoutes from "@/routes/comment.routes.js";
import chatRoutes from "@/routes/chat.routes.js";
import notificationRoutes from "@/routes/notification.routes.js";
import { connectDB } from "@/lib/db.js";
import { attachUser } from "@/middleware/attachUser.middleware.js";
import { logApiError, logApiInfo } from "@/loggers/api.logger.js";
import messageRoutes from "@/routes/message.routes.js";
import { Server as SocketServer } from "socket.io";
import { setSocketIOInstance } from "@/sockets/ioInstance.js";
import chatSocketHandler from "@/sockets/chat.socket.js";
import { corsConfig } from "@/config/cors.config.js";
import { errorHandler } from "@/middleware/errorHandler.middleware.js";

dotenv.config();

const app = express();

app.use(cookieParser());

app.use(express.urlencoded({ extended: true, parameterLimit: 100000, limit: "25mb" }));
app.use(cors(corsConfig));

app.use(express.json({ limit: "5mb" }));

app.use(attachUser);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/follows", followRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use(errorHandler);

// if (process.env.NODE_ENV === "production") {
//   const __dirname = path.resolve();
//   app.use(express.static(path.join(__dirname, "../client/dist")));
//   app.get("*", (_req, res) => res.sendFile(path.resolve(__dirname, "../client", "dist", "index.html")));
// }

const server = http.createServer(app);
const io = new SocketServer(server, { cors: corsConfig });
setSocketIOInstance(io);

const PORT = parseInt(process.env.PORT);

connectDB({ logInfo: logApiInfo, logError: logApiError }).then(() => {
  chatSocketHandler(io);

  server.listen(PORT, () => {
    logApiInfo(`Server is running on port ${PORT}`);
  });
});
