import { AuthUser } from "@/types";

export interface AuthFields {
  email: AuthUser["email"];
  username: AuthUser["username"];
  fullname: AuthUser["fullname"];
  password: string;
}

export interface UpdateUserFields {
  username: AuthUser["username"];
  fullname: AuthUser["fullname"];
  bio: AuthUser["bio"];
  removeProfilePicture: boolean;
}

export interface Session {
  _id: string;
  ip: string | null;
  location: string | null;
  device: string | null;
  lastUsedAt: string;
}

export interface SessionData {
  currentSession: Session | undefined;
  otherSessions: Session[];
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}
