import express from "express";
import { protectRoute } from "@/middleware/protectRoute.middleware.js";
import { getNotifications, seeAllNotifications } from "@/controllers/notification.controller.js";

const notificationRoutes = express.Router();

notificationRoutes.get("", protectRoute, getNotifications);
notificationRoutes.patch("/see-all", protectRoute, seeAllNotifications);

export default notificationRoutes;
