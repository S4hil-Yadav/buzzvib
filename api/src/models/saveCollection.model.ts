import mongoose from "mongoose";

export interface ISave extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
}

const saveCollectionSchema = new mongoose.Schema<ISave>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

saveCollectionSchema.index({ user: 1, name: 1 }, { unique: true });

const SaveCollectionModel = mongoose.model<ISave>("SaveCollection", saveCollectionSchema);
export default SaveCollectionModel;
