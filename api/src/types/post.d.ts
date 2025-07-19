import type { User, Reaction } from "types";
import mongoose from "mongoose";

export interface Media {
  type: "image" | "video";
  originalUrl: string;
  displayUrl: string;
}

export interface Post {
  _id: mongoose.Types.ObjectId;
  author: User | null;
  title: string | null;
  text: string | null;
  media: Media[];
  count: {
    reactions: {
      like: number;
      dislike: number;
    };
    comments: number;
  };
  reaction: Reaction["type"];
  createdAt: Date;
  status: "processing" | "published" | "failed";

  editedAt: Date | null;
  deletedAt: Date | null;
  savedAt: Date | null;
}

export interface PostPayload {
  title: string | null;
  text: string | null;
}

export interface PostPage {
  posts: Post[];
  nextPageParam: { _id: mongoose.Types.ObjectId; createdAt: Date } | null;
}
