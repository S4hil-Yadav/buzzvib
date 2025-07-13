import type { User, Post, Comment } from "types";
import type mongoose from "mongoose";

export interface Notification {
  _id: mongoose.Types.ObjectId;
  sender: User | null;
  seenAt: Date;
  createdAt: Date;
  type:
    | "newPost"
    | "postLike"
    | "postMention"
    | "newComment"
    | "commentLike"
    | "newReply"
    | "commentMention"
    | "newFollower"
    | "followAccepted";
  target: { post: null | Pick<Post, "_id" | "title" | "text">; comment: null | Pick<Comment, "_id" | "text"> };
}

export interface NotificationPage {
  notifications: Notification[];
  nextPageParam: { _id: mongoose.Types.ObjectId; createdAt: Date } | null;
}
