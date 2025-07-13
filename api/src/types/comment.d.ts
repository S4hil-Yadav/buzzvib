import type { User, Reaction, Post } from "types";
import mongoose from "mongoose";

export interface Comment {
  _id: mongoose.Types.ObjectId;
  commentor: User | null;
  // post?: any;
  // parent?: any;
  text: string | null;
  media: { url: string; type: "image" | "video" }[];
  count: {
    reactions: {
      like: number;
      dislike: number;
    };
    replies: number;
  };
  reaction: Reaction["type"];
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date;
  [k: string & {}]: any;
}

export interface CommentPage {
  comments: Comment[];
  nextPageParam: { _id: mongoose.Types.ObjectId; createdAt: Date } | null;
}
