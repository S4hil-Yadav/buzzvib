import { ApiError, ErrorCode } from "@/lib/error.js";
import type { Request, Response, NextFunction } from "express";

export async function protectRoute(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new ApiError(401, { message: "Unauthorized", code: ErrorCode.UNAUTHORIZED }));
  }
  next();
}
