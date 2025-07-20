import { User, Reaction } from "@/types";
import type { Crop } from "react-image-crop";

export interface CreateMedia {
  isNew: true;
  id: string;
  file: File;
  url: string;
  originalUrl: string;
  cropData?: Crop;
  trimData?: { start: number; end: number };
  transformations?: { rotateDegrees?: number; filters?: string[] };
}

export interface EditMedia extends Media {
  id: string;
  isNew: false;
}

export interface Media {
  type: "image" | "video";
  originalUrl: string;
  displayUrl: string;
}

export interface Post {
  _id: string;
  author: User | null;
  title: string | null;
  text: string | null;
  media: Media[];
  count: { reactions: { like: number; dislike: number }; comments: number };
  reaction: Reaction["type"];
  createdAt: string;
  status: "processing" | "published" | "failed";
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
