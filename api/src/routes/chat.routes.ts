import { Router } from "express";
import { getChatrooms, createPrivateChat, createGroupChat } from "@/controllers/chat.controller.js";
import { protectRoute } from "@/middleware/protectRoute.middleware.js";

const chatRoutes = Router();

chatRoutes.get("", protectRoute, getChatrooms);
chatRoutes.post("/private", protectRoute, createPrivateChat);
chatRoutes.post("/group", protectRoute, createGroupChat);

export default chatRoutes;
