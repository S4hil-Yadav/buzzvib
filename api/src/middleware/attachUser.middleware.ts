import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import UserModel from "@/models/user.model.js";
import { ApiError, ErrorCode } from "@/lib/error.js";
import mongoose from "mongoose";
import SessionModel from "@/models/session.model.js";

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const sessionId = req.headers["x-session-id"];

  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

  try {
    if (!sessionId || req.path === "/api/v1/auth/refresh-token") return next();

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    if (typeof decoded === "string" || typeof decoded.userId !== "string" || !mongoose.Types.ObjectId.isValid(decoded.userId)) {
      throw new jwt.JsonWebTokenError("Invalid access token: invalid decoded");
    }

    const userId = new mongoose.Types.ObjectId(decoded.userId);
    const [sessionExists, userExists] = await Promise.all([
      SessionModel.exists({ _id: sessionId }),
      UserModel.exists({ _id: userId, deletedAt: null }),
    ]);

    if (!sessionExists) {
      throw new jwt.JsonWebTokenError("Invalid session id: session not found");
    } else if (!userExists) {
      throw new jwt.JsonWebTokenError("Invalid access token: user not found");
    }

    req.user = { _id: userId };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, { message: "Invalid access token", code: ErrorCode.INVALID_ACCESS_TOKEN }));
    } else {
      logApiError(error);
    }
  }

  next();
}
