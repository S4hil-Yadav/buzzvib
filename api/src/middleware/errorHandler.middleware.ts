import { ApiError } from "@/lib/error.js";
import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    const { status, message, code } = err;
    res.status(status).json({ message, code });
  } else if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ message: "Invalid JSON payload" });
  } else {
    const { status, message, code } = new ApiError();
    res.status(status).json({ message, code });
  }
}
