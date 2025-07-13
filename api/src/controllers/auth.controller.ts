import UserModel from "@/models/user.model.js";
import bcrypt from "bcryptjs";
import generateTokens, { clearAuthCookies } from "@/lib/jwt.js";
import { ApiError, ErrorCode, handleControllerError } from "@/lib/error.js";
import type { NextFunction, Request, Response } from "express";
import type { AuthUser, GoogleUser, Session, User, VerificationToken } from "types";
import axios from "axios";
import { generateRandomPassword, generateUniqueUsername, uploadImageFromUrl } from "@/utils/auth.utils.js";
import crypto from "crypto";
import VerificationTokenModel from "@/models/verificationToken.model.js";
import { logApiError } from "@/loggers/api.logger.js";
import SessionModel from "@/models/session.model.js";
import mongoose from "mongoose";
import { isValidLoginUserFields, isValidReqBody, isValidSignupUserFields } from "@/utils/typeGuard.utils.js";
import {
  sendAccountNotFoundEmail,
  sendLoginAlertEmail,
  sendPasswordChangeAlertEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "@/services/email.service.js";
import { withTransaction } from "@/utils/db.utils.js";
import { BCRYPT_SALT_ROUNDS } from "@/config/constants.js";

export async function getAuthUser(req: Request, res: Response<AuthUser>, next: NextFunction) {
  try {
    const authUser = await UserModel.findById(req.user!._id).lean<AuthUser>();
    if (!authUser) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    }

    res.status(200).json(authUser);
  } catch (error) {
    handleControllerError("getAuthUser", error, next);
  }
}

export async function signup(req: Request, res: Response<Record<string, string>>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["userFields"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const { userFields } = req.body;

    if (!isValidSignupUserFields(userFields)) {
      throw new ApiError(400, { message: "Invalid userFields payload", code: ErrorCode.INVALID_INPUT });
    }

    const email = userFields.email.toLowerCase().replace(/\s+/g, "");
    const username = userFields.username.replace(/\s+/g, "");
    const fullname = userFields.fullname.trim().replace(/\s+/g, " ");
    const password = userFields.password.replace(/\s+/g, "");

    if (!email || !username || !fullname || !password) {
      throw new ApiError(422, { message: "All fields are required", code: ErrorCode.MISSING_REQUIRED_FIELDS });
    } else if (!/.+@.+\..+/.test(email)) {
      throw new ApiError(422, { message: "Invalid email address", code: ErrorCode.INVALID_INPUT });
    } else if (username.length > 20) {
      throw new ApiError(422, { message: "Maximum username length is 20", code: ErrorCode.INVALID_INPUT });
    } else if (password.length < 6) {
      throw new ApiError(422, { message: "Minimun password length is 6", code: ErrorCode.INVALID_INPUT });
    } else if (password.length > 30) {
      throw new ApiError(422, { message: "Maximum password length is 30", code: ErrorCode.INVALID_INPUT });
    } else if (fullname.split(" ").length > 5 || fullname.length > 30) {
      throw new ApiError(422, { message: "Only 5 words and max length 30 is allowed", code: ErrorCode.INVALID_INPUT });
    }

    const [existingEmail, existingUsername] = await Promise.all([UserModel.exists({ email }), UserModel.exists({ username })]);

    if (existingEmail) {
      throw new ApiError(409, { message: "Email already exists", code: ErrorCode.EMAIL_ALREADY_EXISTS });
    } else if (existingUsername) {
      throw new ApiError(409, { message: "Username already exists", code: ErrorCode.USERNAME_ALREADY_EXISTS });
    }

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({ email, username, fullname, password: hashedPassword });

    await generateTokens(req, res, newUser._id);

    sendWelcomeEmail(email, fullname).catch(error => logApiError("Failed to send welcome email:", error));

    res.status(201).end();
  } catch (error) {
    handleControllerError("signup", error, next);
  }
}

export async function login(req: Request, res: Response<Record<string, string>>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["userFields"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const { userFields } = req.body;

    if (!isValidLoginUserFields(userFields)) {
      throw new ApiError(400, { message: "Invalid payload", code: ErrorCode.INVALID_INPUT });
    }

    const email = userFields.email.replace(/\s+/g, "").toLowerCase();
    const password = userFields.password.replace(/\s+/g, "");

    if (!email || !password) {
      throw new ApiError(400, { message: "All fields are required", code: ErrorCode.MISSING_REQUIRED_FIELDS });
    }

    const user = await UserModel.findOne({ email: email.trim() })
      .select("password")
      .lean<{ _id: AuthUser["_id"]; password: string }>();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new ApiError(401, { message: "Invalid credentials", code: ErrorCode.INVALID_CREDENTIALS });
    }

    await generateTokens(req, res, user._id);

    sendLoginAlertEmail(email, req).catch(error => logApiError("Failed to send login alert email:", error));

    res.status(201).end();
  } catch (error) {
    handleControllerError("login", error, next);
  }
}

export async function googleOAuth(req: Request, res: Response<Record<string, string>>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["access_token"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const { access_token } = req.body;
    if (typeof access_token !== "string") {
      throw new ApiError(400, { message: "Invalid access token", code: ErrorCode.INVALID_ACCESS_TOKEN });
    }

    const { data: googleUser } = await axios.get<GoogleUser>("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { email, name: fullname, picture } = googleUser;

    const existing = await UserModel.findOneAndUpdate({ email }, { $set: { "verified.email": true } })
      .select("_id")
      .lean<Pick<AuthUser, "_id">>();

    const userId =
      existing?._id ??
      (await (async () => {
        const username = await generateUniqueUsername(fullname);
        const hashedPassword = await bcrypt.hash(generateRandomPassword(), await bcrypt.genSalt(BCRYPT_SALT_ROUNDS));
        const newUser = await UserModel.create({ email, fullname, username, password: hashedPassword, "verified.email": true });

        try {
          const uploadRes = await uploadImageFromUrl(picture, {
            folder: `buzzvib/users/${newUser._id}/profile-picture`,
          });
          await newUser.updateOne({ $set: { profilePicture: uploadRes.secure_url } });
        } catch (error) {
          logApiError(`Error uploading image in googleOAuth controller: ${error}`);
        }

        return newUser._id;
      })());

    if (existing) {
      sendLoginAlertEmail(email, req).catch(error => logApiError("Failed to send login alert email:", error));
    } else {
      sendWelcomeEmail(email, fullname).catch(error => logApiError("Failed to send welcome email:", error));
    }

    await generateTokens(req, res, userId);

    res.status(201).end();
  } catch (error) {
    handleControllerError("googleOAuth", error, next);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      clearAuthCookies(res);
      throw new ApiError(401, { message: "No refresh token", code: ErrorCode.MISSING_REFRESH_TOKEN });
    }

    const existingToken = await SessionModel.findOne({ refreshToken })
      .select("_id expiresAt user")
      .lean<{ _id: Session["_id"]; expiresAt: Date; user: User["_id"] }>();

    if (!existingToken) {
      clearAuthCookies(res);
      throw new ApiError(401, { message: "Invalid refresh token", code: ErrorCode.INVALID_REFRESH_TOKEN });
    } else if (existingToken.expiresAt < new Date()) {
      clearAuthCookies(res);
      throw new ApiError(401, { message: "Token expired", code: ErrorCode.REFRESH_TOKEN_EXPIRED });
    }

    await generateTokens(req, res, existingToken.user);

    res.status(204).end();
  } catch (error) {
    handleControllerError("refreshToken", error, next);
  }
}

export async function logout(req: Request, res: Response<void>, next: NextFunction) {
  try {
    clearAuthCookies(res);

    const { sessionId } = req.cookies;

    if (sessionId) {
      await SessionModel.deleteOne({ _id: sessionId });
    }

    res.status(204).end();
  } catch (error) {
    handleControllerError("logout", error, next);
  }
}

export async function requestPasswordReset(req: Request, res: Response<void>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["email"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const { email } = req.body;

    if (typeof email !== "string" || !/.+@.+\..+/.test(email)) {
      throw new ApiError(400, { message: "Invalid email", code: ErrorCode.INVALID_INPUT });
    }

    const user = await UserModel.exists({ email });
    if (user) {
      const resetSecret = crypto.randomBytes(32).toString("hex");
      const hashedSecret = crypto.createHash("sha256").update(resetSecret).digest("hex");

      await VerificationTokenModel.updateOne(
        { identifier: email, type: "passwordReset" },
        {
          $set: { secret: hashedSecret, expiresAt: new Date(Date.now() + 1000 * 60 * 15), used: false },
          $setOnInsert: { identifier: email, type: "passwordReset" },
        },
        { upsert: true }
      );

      await sendPasswordResetEmail(email, resetSecret);
    } else {
      await sendAccountNotFoundEmail(email);
    }

    res.status(201).end();
  } catch (error) {
    handleControllerError("requestPasswordResetEmail", error, next);
  }
}

export async function confirmPasswordReset(req: Request, res: Response<void>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["secret", "newPassword"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const { secret, newPassword } = req.body;

    if (typeof secret !== "string" || typeof newPassword !== "string") {
      throw new ApiError(400, { message: "Invalid input", code: ErrorCode.INVALID_INPUT });
    } else if (newPassword.length < 6 || newPassword.length > 30) {
      throw new ApiError(422, { message: "Password must be 6 to 30 characters long", code: ErrorCode.INVALID_INPUT });
    }

    const hashedSecret = crypto.createHash("sha256").update(secret).digest("hex");

    const token = await VerificationTokenModel.findOne({ secret: hashedSecret, expiresAt: { $gt: new Date() }, used: false })
      .select("identifier")
      .lean<Pick<VerificationToken, "_id" | "identifier">>();

    if (!token) {
      throw new ApiError(400, { message: "Invalid or expired token", code: ErrorCode.INVALID_RESET_TOKEN });
    }

    const hashedPassword = await bcrypt.hash(newPassword, await bcrypt.genSalt(BCRYPT_SALT_ROUNDS));

    await withTransaction(async session => {
      const [userUpdateResult, tokenUpdateResult] = await Promise.all([
        UserModel.updateOne({ email: token.identifier, deletedAt: null }, { $set: { password: hashedPassword } }, { session }),
        VerificationTokenModel.updateOne({ _id: token._id }, { $set: { used: true } }, { session }),
        req.user ? SessionModel.deleteMany({ user: req.user._id }) : Promise.resolve(),
      ]);

      if (!userUpdateResult.matchedCount) {
        throw new ApiError(500, { message: "Failed to reset password: user not found", code: ErrorCode.RESET_PASSWORD_FAILED });
      } else if (!tokenUpdateResult.matchedCount) {
        throw new ApiError(500, { message: "Failed to mark token as used", code: ErrorCode.RESET_PASSWORD_FAILED });
      }
    });

    await sendPasswordChangeAlertEmail(token.identifier, req);

    res.status(204).end();
  } catch (error) {
    handleControllerError("confirmPasswordReset", error, next);
  }
}

export async function getAllSessions(
  req: Request,
  res: Response<{ currentSession: Session | undefined; otherSessions: Session[] }>,
  next: NextFunction
) {
  try {
    const sessions = await SessionModel.find({ user: req.user!._id })
      .select("_id ip location device lastUsedAt")
      .sort({ lastUsedAt: -1 })
      .lean<Session[]>();

    const currentSessionId = req.cookies.sessionId;

    const currentSession = sessions.find(s => String(s._id) === currentSessionId);
    const otherSessions = sessions.filter(s => String(s._id) !== currentSessionId);

    res.status(200).json({ currentSession, otherSessions });
  } catch (error) {
    handleControllerError("getAllSessions", error, next);
  }
}

export async function logoutSession(req: Request<{ sessionId: string }>, res: Response, next: NextFunction) {
  try {
    const { sessionId: rawSessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawSessionId)) {
      throw new ApiError(400, { message: "Invalid session id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const sessionId = new mongoose.Types.ObjectId(rawSessionId);

    const deleteResult = await SessionModel.deleteOne({ _id: sessionId, user: req.user!._id });

    if (!deleteResult.deletedCount) {
      throw new ApiError(404, { message: "Session not found", code: ErrorCode.SESSION_NOT_FOUND });
    }

    res.status(204).end();
  } catch (error) {
    handleControllerError("logoutSession", error, next);
  }
}

export async function logoutAllSessions(req: Request, res: Response, next: NextFunction) {
  try {
    await SessionModel.deleteMany({ user: req.user!._id, refreshToken: { $ne: req.cookies.refreshToken } });

    res.status(204).end();
  } catch (error) {
    handleControllerError("logoutSession", error, next);
  }
}
