import mongoose, { type Document, Schema } from "mongoose";

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  isSystemMessage: boolean;
  sender: mongoose.Types.ObjectId;
  chatroomId: mongoose.Types.ObjectId;
  text: string[] | null;
  media?: {
    url: string;
    type: "image" | "video" | "audio" | "file";
    filename: string;
  };
  reactions: { user: mongoose.Types.ObjectId; reaction: String }[];
  quotedMessage: mongoose.Types.ObjectId | null;
  deliveredTo: { user: mongoose.Types.ObjectId; deliveredAt: Date }[];
  seenBy: { user: mongoose.Types.ObjectId; seenAt: Date }[];
  editedAt: Date | null;
  deletedAt: Date | null;
  forwardedFrom: mongoose.Types.ObjectId | null;
  pinned: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    isSystemMessage: { type: Boolean, default: false },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    chatroomId: { type: Schema.Types.ObjectId, ref: "Chatroom", required: true },
    text: { type: [{ type: String, required: true }], default: null },
    media: {
      type: {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video", "audio", "file"], required: true },
        filename: { type: String, required: true },
      },
    },
    reactions: [
      { user: { type: Schema.Types.ObjectId, ref: "User", required: true }, reaction: { type: String, required: true } },
    ],
    quotedMessage: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    deliveredTo: [
      { user: { type: Schema.Types.ObjectId, ref: "User", required: true }, deliveredAt: { type: Date, required: true } },
    ],
    seenBy: [{ user: { type: Schema.Types.ObjectId, ref: "User", required: true }, seenAt: { type: Date, required: true } }],
    createdAt: { type: Date, default: null },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, select: false },
    forwardedFrom: { type: Schema.Types.ObjectId, ref: "User", default: null },
    pinned: { type: Boolean, default: false },
  },
  { versionKey: false }
);

const MessageModel = mongoose.model<IMessage>("Message", messageSchema);
export default MessageModel;
