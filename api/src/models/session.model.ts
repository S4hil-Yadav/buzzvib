import mongoose, { type Document } from "mongoose";

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  refreshToken: string;
  expiresAt: Date;
  ip: string | null;
  location: string | null;
  device: string | null;
  lastUsedAt: Date;
}

const SessionSchema = new mongoose.Schema<ISession>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    refreshToken: { type: String, required: true, select: false },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    ip: { type: String, default: null },
    location: { type: String, default: null },
    device: { type: String, default: null },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

SessionSchema.index({ user: 1 });
SessionSchema.index({ refreshToken: 1 }, { unique: true });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SessionModel = mongoose.model<ISession>("Session", SessionSchema);
export default SessionModel;
