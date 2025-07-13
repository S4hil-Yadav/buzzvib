import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import UserModel from "@/models/user.model.js";
import { ApiError, ErrorCode } from "@/lib/error.js";
import { logApiError } from "@/loggers/api.logger.js";
import mongoose from "mongoose";

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const { accessToken, sessionId } = req.cookies;

  try {
    if (!sessionId || req.path === "/api/v1/auth/refresh-token") return next();

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    if (typeof decoded === "string" || typeof decoded.userId !== "string" || !mongoose.Types.ObjectId.isValid(decoded.userId)) {
      throw new jwt.JsonWebTokenError("Invalid access token: invalid decoded");
    }

    const userId = new mongoose.Types.ObjectId(decoded.userId);

    if (!(await UserModel.exists({ _id: userId, deletedAt: null }))) {
      throw new jwt.JsonWebTokenError("Invalid access token: user not found");
    }

    req.user = { _id: userId };
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, { message: "Invalid access token", code: ErrorCode.INVALID_ACCESS_TOKEN }));
    } else {
      logApiError(err);
    }
  }

  next();
}
