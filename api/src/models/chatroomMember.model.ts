import mongoose, { type Document, Schema } from "mongoose";

export interface IChatroomMember extends Document {
  _id: mongoose.Types.ObjectId;
  chatroom: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  nickname: string | null;
  lastSeenMessage: mongoose.Types.ObjectId | null;
  muted: boolean;
  archived: boolean;
}

const chatroomMemberSchema = new Schema<IChatroomMember>(
  {
    chatroom: { type: Schema.Types.ObjectId, ref: "Chatroom", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    nickname: { type: String, default: null },
    lastSeenMessage: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    muted: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },
  { _id: false, versionKey: false }
);

chatroomMemberSchema.index({ chatroom: 1, user: 1 }, { unique: true });
chatroomMemberSchema.index({ user: 1 });

const ChatroomMemberModel = mongoose.model<IChatroomMember>("ChatroomMember", chatroomMemberSchema);
export default ChatroomMemberModel;
