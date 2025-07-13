import { Router } from "express";
import { sendMediaMessage } from "@/controllers/message.controller.js";
import { protectRoute } from "@/middleware/protectRoute.middleware.js";
import upload from "@/lib/multer.js";

const messageRoutes = Router();

messageRoutes.post("/media", protectRoute, upload.array("file"), sendMediaMessage);

export default messageRoutes;
