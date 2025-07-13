import mongoose, { Document as MongooseDocument } from "mongoose";
// import validator from "validator";

export interface IUser extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  fullname: string;
  profilePicture: string;
  password: string;
  bio: string;
  count: {
    followers: number;
    following: number;
    posts: number;
  };
  privacy: {
    showLikes: boolean;
    account: {
      visibility: "public" | "private";
      searchable: boolean;
      taggable: boolean;
    };
  };
  profile: {
    location: string;
    website: string;
  };
  preferences: {
    darkMode: boolean;
    language: string;
  };
  moderation: {
    isBanned: boolean;
    banReason: string;
  };
  verified: {
    profile: boolean;
    email: boolean;
  };
  deletedAt: Date | null;
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Invalid email address"],
    },
    username: {
      type: String,
      required: true,
      maxlength: [20, "Username can't exceed 20 characters"],
    },
    fullname: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => value.split(" ").length <= 5 && value.length <= 30,
        message: "Only 5 words and max length 30 is allowed",
      },
    },
    profilePicture: { type: String, default: "" },
    password: { type: String, required: true, select: false },
    bio: { type: String, default: "", maxlength: [255, "Bio can not exceed 255 characters"] },
    count: {
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
      posts: { type: Number, default: 0 },
    },
    privacy: {
      showLikes: { type: Boolean, default: true },
      account: {
        visibility: { type: String, enum: ["public", "private"], default: "public" },
        searchable: { type: Boolean, default: true },
        taggable: { type: Boolean, default: true },
      },
    },
    profile: {
      location: { type: String, default: null },
      website: { type: String, default: null, maxlength: 100 },
    },
    preferences: {
      theme: { type: String, default: false },
      language: { type: String, default: "en" },
    },
    moderation: {
      isBanned: { type: Boolean, default: false, select: false },
      banReason: { type: String, default: null, select: false },
    },
    verified: {
      profile: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
    },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null, select: false },
  },
  { versionKey: false }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ fullname: 1, _id: 1 });
userSchema.index({ deletedAt: 1 });
userSchema.index({ "privacy.account.visibility": 1, deletedAt: 1 });

// userSchema.pre(/^(find|update|countDocuments|aggregate)/, function (this: Query<any, any>, next) {
//   this.where({ deletedAt: null });
//   next();
// });

const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;
