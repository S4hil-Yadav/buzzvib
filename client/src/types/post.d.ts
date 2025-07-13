import { User, Reaction } from "@/types";

export interface Post {
  _id: string;
  author: User | null;
  title: string | null;
  text: string | null;
  hashtags: string[];
  media: { url: string; type: "image" | "video" }[];
  count: { reactions: { like: number; dislike: number }; comments: number };
  reaction: Reaction["type"];
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  savedAt: string | null;
}

export interface PostIdPage {
  postIds: Post["_id"][];
  nextPageParam: { _id: string; createdAt: string } | null;
}

export interface PostPage {
  posts: Post[];
  nextPageParam: { _id: string; createdAt: string } | null;
}

export interface PostDraft {
  title: string;
  text: string;
}

export interface CreateMedia {
  id: string;
  file: File;
  url: string;
}

export interface Media {
  type: string;
  url: string;
}
