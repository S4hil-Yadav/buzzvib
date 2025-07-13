import mongoose, { type Document } from "mongoose";

interface ITarget extends Document {
  _id: mongoose.Types.ObjectId;
  type: "Post" | "Comment";
}

export interface ISave extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  target: ITarget;
  saveCollection: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const targetSchema = new mongoose.Schema<ITarget>(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, refPath: "type", required: true },
    type: { type: String, enum: ["Post", "Comment"], required: true },
  },
  { _id: false, versionKey: false }
);

const saveSchema = new mongoose.Schema<ISave>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    target: { type: targetSchema, required: true },
    saveCollection: { type: mongoose.Schema.Types.ObjectId, ref: "SaveCollection", default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

saveSchema.index({ user: 1, "target._id": 1, saveCollection: 1 }, { unique: true });
saveSchema.index({ user: 1, saveCollection: 1, createdAt: -1, _id: -1 });
saveSchema.index({ user: 1, "target._id": 1 });

const saveModel = mongoose.model<ISave>("Save", saveSchema);
export default saveModel;
