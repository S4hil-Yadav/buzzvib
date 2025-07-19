import { ApiError } from "@/lib/error.js";
import type { NextFunction, Request, Response } from "express";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    const { status, message, code } = error;
    res.status(status).json({ message, code });
  } else if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ message: "Invalid JSON payload" });
  } else {
    const { status, message, code } = new ApiError();
    res.status(status).json({ message, code });
  }
}
