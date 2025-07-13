import { Comment, User, Post } from "@/types";

export interface Notification {
  _id: string;
  sender: User | null;
  seenAt: string;
  createdAt: string;
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
  nextPageParam: { _id: string; createdAt: string } | null;
}
