import { User } from "types";
import type mongoose from "mongoose";

export type Chatroom = {
  _id: mongoose.Types.ObjectId;
  members: User[];
  nickname: string | null;
  lastMessage: Message | null;
  createdBy: User | null;
  archivedFor: User["_id"][];
  mutedBy: User["_id"][];
  deletedAt: Date | null;
  createdAt: Date;
} & ({ type: "private" } | { type: "group"; group: { name: string; avatar: string; admins: User[]; description: string } });

export interface ChatroomPage {
  chatrooms: Chatroom[];
  nextPageParam: { _id: string; createdAt: string } | null;
}

export interface Message {
  _id: string;
  isSystemMessage: boolean;
  sender: User["_id"];
  chatroom: Chatroom["_id"];
  content: string | null;
  media?: {
    url: string;
    type: "image" | "video" | "audio" | "file";
    filename: string;
  };
  reactions: { user: User["_id"]; reaction: string }[];
  replyTo: Message["_id"] | null;
  deliveredTo: { user: User["_id"]; deliveredAt: string }[];
  seenBy: { user: User["_id"]; seenAt: string }[];
  editedAt: string | null;
  deletedAt: string | null;
  forwardedFrom: User["_id"] | null;
  pinned: boolean;
  createdAt: string;
}

export interface MessagePayload {
  chatroomId: string;
  text: string;
}
