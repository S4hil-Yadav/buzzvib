import mongoose, { type Document } from "mongoose";

interface ITarget extends Document {
  post: mongoose.Types.ObjectId | null;
  comment: mongoose.Types.ObjectId | null;
}

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  type:
    | "newFollower"
    | "followAccepted"
    | "newPost"
    | "postLike"
    | "newComment"
    | "commentLike"
    | "newReply"
    | "postMention"
    | "commentMention";
  target: ITarget;
  seenAt: Date | null;
  createdAt: Date;
}

const targetSchema = new mongoose.Schema<ITarget>(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
  },
  { _id: false, versionKey: false }
);

const notificationSchema = new mongoose.Schema<INotification>(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "newFollower",
        "followAccepted",
        "newPost",
        "postLike",
        "newComment",
        "commentLike",
        "newReply",
        "postMention",
        "commentMention",
      ],
      required: true,
    },
    target: { type: targetSchema, default: { post: null, comment: null } },
    seenAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// notificationSchema.index({ receiver: 1, sender: 1, "target._id": 1, type: 1, createdAt: -1 });
notificationSchema.index({ "target.post": 1 });
notificationSchema.index({ "target.comment": 1 });
notificationSchema.index({ receiver: 1, seenAt: 1, createdAt: -1 });
notificationSchema.index({ receiver: 1, createdAt: -1, _id: -1 });
notificationSchema.index({ sender: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ receiver: 1, seenAt: 1 });

const NotificationModel = mongoose.model<INotification>("Notification", notificationSchema);
export default NotificationModel;
