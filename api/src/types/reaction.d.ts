import type { Post } from "types";
import mongoose from "mongoose";

export interface Reaction {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  type: "like" | "dislike" | null;
}

export interface PostReaction {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  post: Post;
}
