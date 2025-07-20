import mongoose, { type Document } from "mongoose";

export interface IFollow extends Document {
  _id: mongoose.Types.ObjectId;
  follower: mongoose.Types.ObjectId;
  following: mongoose.Types.ObjectId;
  status: "requested" | "accepted" | "blocked";
  seenAt: Date | null;
  createdAt: Date;
}

const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["requested", "accepted", "blocked"], required: true },
    seenAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1, status: 1, createdAt: -1, _id: -1 });
followSchema.index({ follower: 1, status: 1, createdAt: -1, _id: -1 });
followSchema.index({ following: 1, follower: 1, status: 1 });
followSchema.index({ following: 1, status: 1, seenAt: 1 });

followSchema.pre("validate", function (next) {
  if (this.follower.equals(this.following)) {
    next(new Error("Follower and following can't be same"));
    return;
  }
  next();
});

const FollowModel = mongoose.model("Follow", followSchema);
export default FollowModel;
