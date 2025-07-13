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
  profilePicture: AuthUser["profilePicture"];
  bio: AuthUser["bio"];
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
