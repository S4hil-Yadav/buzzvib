import { User, Reaction } from "@/types";

export interface Comment {
  _id: string;
  commentor: User | null;
  text: string | null;
  media: { url: string; type: "image" | "video" }[];
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  count: { reactions: { like: number; dislike: number }; replies: number };
  reaction: Reaction["reactionType"];
}

export interface CommentIdPage {
  commentIds: Comment["_id"][];
  nextPageParam: { _id: string; createdAt: string } | null;
}

export interface CommentPage {
  comments: Comment[];
  nextPageParam: { _id: string; createdAt: string } | null;
}
