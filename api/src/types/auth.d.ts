import type mongoose from "mongoose";

export interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
  hd?: string;
}

export interface UserFields {
  username: string;
  email: string;
  password: string;
  fullname: string;
  bio: string;
  profilePicture: string;
}

export interface VerificationToken {
  _id: mongoose.Types.ObjectId;
  identifier: string;
  secret: string;
  expiresAt: Date;
  type: "emailVerification" | "phoneVerification" | "passwordReset";
  used: boolean;
}

export interface Session {
  _id: mongoose.Types.ObjectId;
  ip: string | null;
  location: string | null;
  device: string | null;
  lastUsedAt: Date;
}
