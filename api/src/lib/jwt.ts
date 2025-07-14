import { MAX_SESSIONS } from "@/config/constants.js";
import SessionModel from "@/models/session.model.js";
import type { Session, User } from "types";
import getRequestMeta from "@/utils/requestMeta.utils.js";
import type { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";

export default async function generateTokens(req: Request, _res: Response, userId: User["_id"]) {
  const payload = { userId, jti: crypto.randomUUID(), iat: Date.now() };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: "7d" });

  const { ip, location, device } = await getRequestMeta(req);

  const existingSessions = await SessionModel.find({ user: userId, expiresAt: { $gt: new Date() } })
    .sort({ lastUsedAt: 1 })
    .select("_id ip device")
    .lean<Pick<Session, "_id" | "ip" | "device">[]>();

  const matchedSession = existingSessions.find(s => ip && device && s.ip === ip && s.device === device);

  const sessionsToRemove =
    existingSessions.length >= MAX_SESSIONS
      ? existingSessions
          .filter(s => !matchedSession || String(s._id) !== String(matchedSession._id))
          .slice(0, existingSessions.length - MAX_SESSIONS + 1)
          .map(s => s._id)
      : null;

  const [session] = await Promise.all([
    matchedSession
      ? SessionModel.findOneAndUpdate(
          { _id: matchedSession._id },
          {
            $set: {
              user: userId,
              refreshToken,
              device,
              lastUsedAt: new Date(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            $setOnInsert: { ip, location },
          },
          { upsert: true, new: true }
        )
          .select("_id")
          .lean<Pick<Session, "_id">>()
      : SessionModel.create({ user: userId, refreshToken, ip, location, device }),

    sessionsToRemove?.length ? SessionModel.deleteMany({ _id: { $in: sessionsToRemove } }) : Promise.resolve(),
  ]);

  return { accessToken, refreshToken, sessionId: String(session._id) };
}

//   res.cookie("accessToken", accessToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV !== "development",
//     sameSite: process.env.MODE === "production" ? "none" : "strict",
//     maxAge: 15 * 60 * 1000, // 15 minutes
//   });

//   res.cookie("refreshToken", refreshToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV !== "development",
//     sameSite: process.env.MODE === "production" ? "none" : "strict",
//     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     path: "/auth/refresh-token",
//   });

//   res.cookie("sessionId", session._id, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV !== "development",
//     sameSite: process.env.MODE === "production" ? "none" : "strict",
//     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//   });

// export function clearAuthCookies(res: Response) {
//   const commonOptions: CookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV !== "development",
//     sameSite: process.env.MODE === "production" ? "none" : "strict",
//   };

//   res.clearCookie("accessToken", commonOptions);
//   res.clearCookie("refreshToken", { ...commonOptions, path: "/auth/refresh-token" });
//   res.clearCookie("sessionId", commonOptions);
// }
