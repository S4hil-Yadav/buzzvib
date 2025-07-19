import mongoose from "mongoose";

export interface IVerificationToken extends Document {
  _id: mongoose.Types.ObjectId;
  identifier: string;
  user: mongoose.Types.ObjectId | null;
  secret: string;
  expiresAt: Date;
  type: "emailVerification" | "phoneVerification" | "passwordReset";
  used: boolean;
}

const VerificationTokenSchema = new mongoose.Schema<IVerificationToken>(
  {
    identifier: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    secret: { type: String, required: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 1000 * 60 * 15) },
    type: { type: String, enum: ["emailVerification", "phoneVerification", "passwordReset"], required: true },
    used: { type: Boolean, default: false },
  },
  { versionKey: false }
);

VerificationTokenSchema.index({ identifier: 1, type: 1 });
VerificationTokenSchema.index({ secret: 1, expiresAt: 1, used: 1 });
VerificationTokenSchema.index({ user: 1, type: 1 });

const VerificationTokenModel = mongoose.model<IVerificationToken>("VerificationToken", VerificationTokenSchema);
export default VerificationTokenModel;
