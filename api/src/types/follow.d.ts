import type { User } from "types";
import mongoose from "mongoose";

export interface FollowRequest {
  _id: mongoose.Types.ObjectId;
  user: User | null;
  seenAt?: Date | null;
  createdAt: Date;
}

export interface FollowRequestPage {
  followRequests: FollowRequest[];
  nextPageParam: { _id: FollowRequest["_id"]; createdAt: FollowRequest["createdAt"] } | null;
}

export interface FollowStatus {
  followerStatus: "requested" | "accepted" | "blocked" | null;
  followingStatus: "requested" | "accepted" | "blocked" | null;
}

export interface FollowStatuses {
  [k: User["username"]]: FollowStatus;
}

export interface Block {
  _id: mongoose.Types.ObjectId;
  user: User | null;
  createdAt: Date;
}

export interface BlockPage {
  blockedUserDocs: Block[];
  nextPageParam: { _id: Block["_id"]; createdAt: Block["createdAt"] } | null;
}
