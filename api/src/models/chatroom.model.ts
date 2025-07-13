import mongoose, { type Document, Schema } from "mongoose";

export interface IChatroom extends Document {
  _id: mongoose.Types.ObjectId;
  type: "group" | "private";
  group?: {
    name: string;
    avatar: string;
    admins: mongoose.Types.ObjectId[];
    description?: string;
  };
  lastMessage: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  archivedFor: mongoose.Types.ObjectId[];
  mutedBy: mongoose.Types.ObjectId[];
  deletedAt: Date | null;
  createdAt: Date;
}

const chatroomSchema = new Schema<IChatroom>(
  {
    type: { type: String, enum: ["group", "private"], required: true },
    group: {
      type: {
        name: { type: String, required: true },
        avatar: { type: String, default: "" },
        admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
        description: { type: String, default: "" },
      },
    },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
chatroomSchema.index({ members: 1 });

const ChatroomModel = mongoose.model<IChatroom>("Chatroom", chatroomSchema);
export default ChatroomModel;
