import { User } from "@/types";

export interface FollowRequest {
  _id: string;
  user: User;
  seenAt?: string | null;
  createdAt: string;
}

export interface FollowRequestPage {
  followRequests: FollowRequest[];
  nextPageParam: { _id: string; createdAt: string } | null;
}

export interface FollowStatus {
  followerStatus: "requested" | "accepted" | "blocked" | null;
  followingStatus: "requested" | "accepted" | "blocked" | null;
}

export interface FollowStatuses {
  [k: User["username"]]: FollowStatus;
}

export interface Block {
  _id: string;
  user: User;
  createdAt: string;
}

export interface BlockPage {
  blockedUserDocs: Block[];
  nextPageParam: { _id: Block["_id"]; createdAt: Block["createdAt"] } | null;
}
