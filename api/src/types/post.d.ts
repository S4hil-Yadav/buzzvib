import type { User, Reaction } from "types";
import mongoose from "mongoose";

export interface Post {
  _id: mongoose.Types.ObjectId;
  author: User | null;
  title: string | null;
  text: string | null;
  hashtags: string[];
  media: { url: string; type: "image" | "video" }[];
  count: {
    reactions: {
      like: number;
      dislike: number;
    };
    comments: number;
  };
  reaction: Reaction["type"];
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  savedAt: Date | null;
}

export interface PostPayload {
  title: string;
  text: string;
}
export interface PostPage {
  posts: Post[];
  nextPageParam: { _id: mongoose.Types.ObjectId; createdAt: Date } | null;
}

export interface Media {
  type: string;
  url: string;
}
