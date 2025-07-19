import mongoose, { type Document } from "mongoose";

interface ITarget extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  type: "Post" | "Comment";
}

export interface IReaction extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  target: ITarget;
  type: "like" | "dislike";
  createdAt: Date;
}

const targetSchema = new mongoose.Schema<ITarget>(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, refPath: "type", required: true },
    type: { type: String, enum: ["Post", "Comment"], required: true },
  },
  { _id: false, versionKey: false }
);

const reactionSchema = new mongoose.Schema<IReaction>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    target: { type: targetSchema, required: true },
    type: { type: String, enum: ["like", "dislike"], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

reactionSchema.index({ user: 1, "target._id": 1 }, { unique: true });
reactionSchema.index({ "target._id": 1, type: 1 });
reactionSchema.index({ user: 1, type: 1, createdAt: -1, _id: -1 });
reactionSchema.index({ "target.type": 1 });
reactionSchema.index({ createdAt: -1 });

const LikeModel = mongoose.model<IReaction>("Reaction", reactionSchema);
export default LikeModel;
