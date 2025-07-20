import mongoose from "mongoose";

export interface User {
  _id: mongoose.Types.ObjectId;
  username: string;
  fullname: string;
  profilePicture: {
    originalUrl: string;
    displayUrl: string;
  } | null;
  verified: { profile: boolean };
  [k: string & {}]: any;
}

export interface ProfileUser extends User {
  bio: string | null;
  privacy: {
    showLikes: boolean;
    account: { visibility: "public" | "private" };
  };
  profile: {
    location: string;
    website: string;
  };
}

export interface AuthUser extends ProfileUser {
  email: string;
  privacy: {
    showLikes: boolean;
    account: { visibility: "public" | "private"; searchable: boolean; taggable: boolean };
  };
  preferences: {
    darkMode: boolean;
    language: string;
  };
  verified: { profile: boolean; email: boolean };
  createdAt: Date;
}

export interface UserPage {
  users: User[];
  nextPageParam: { _id: mongoose.Types.ObjectId; fullname: User["fullname"] } | null;
}

export interface UserAccountVisibility {
  _id: User["_id"];
  privacy: { account: { visibility: "public" | "private" } };
}
