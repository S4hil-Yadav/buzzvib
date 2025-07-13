import express from "express";
import {
  signup,
  login,
  googleOAuth,
  logout,
  getAuthUser,
  requestPasswordReset,
  confirmPasswordReset,
  refreshToken,
  getAllSessions,
  logoutSession,
  logoutAllSessions,
} from "@/controllers/auth.controller.js";
import { protectRoute } from "@/middleware/protectRoute.middleware.js";

const authRoutes = express.Router();

authRoutes.get("", protectRoute, getAuthUser);
authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/google", googleOAuth);
authRoutes.post("/logout", logout);
authRoutes.post("/refresh-token", refreshToken);
authRoutes.post("/request-password-reset", requestPasswordReset);
authRoutes.post("/confirm-password-reset", confirmPasswordReset);
authRoutes.get("/sessions", protectRoute, getAllSessions);
authRoutes.delete("/sessions", protectRoute, logoutAllSessions);
authRoutes.delete("/sessions/:sessionId", protectRoute, logoutSession);

export default authRoutes;
