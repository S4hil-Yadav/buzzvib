import type { Post } from "types";
import type mongoose from "mongoose";
export interface PostSave {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  post: Post;
}
