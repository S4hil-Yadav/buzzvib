import { User } from "@/types";

export type Chatroom = {
  _id: string;
  lastMessage: Pick<Message, "_id" | "sender" | "text" | "media"> | null;
  lastSeenMessage: Message["_id"];
  archived: boolean;
  muted: boolean;
  createdBy: User["_id"];
  deletedAt: string | null;
  createdAt: string;
} & (
  | { type: "private"; user: User["_id"] }
  | { type: "group"; members: User["_id"][]; group: { name: string; avatar: string; admins: User[]; description: string } }
);

export interface ChatroomPage {
  chatrooms: Chatroom[];
  nextPageParam: { _id: string; createdAt: string } | null;
}

export interface Message {
  _id: string;
  isSystemMessage: boolean;
  sender: User["_id"];
  text: Chatroom["_id"];
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

export interface MessagePage {
  messages: Message[];
  previousPageParam: { _id: string; createdAt: string } | null;
}
