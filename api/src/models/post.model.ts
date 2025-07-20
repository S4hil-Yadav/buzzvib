import mongoose, { type Document } from "mongoose";

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  title: string | null;
  text: string | null;
  media: [{ type: string; originalUrl: string; displayUrl: string; thumbnailUrl: string }];
  hashtags: string[];
  count: {
    reactions: {
      like: number;
      dislike: number;
    };
    comments: number;
  };
  status: "processing" | "published" | "failed";
  deletedAt: Date | null;
  createdAt: Date;
  editedAt: Date;
}

const postSchema = new mongoose.Schema<IPost>(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, maxlength: 300, default: null },
    text: { type: String, default: null },
    media: [
      {
        type: { type: String, required: true },
        originalUrl: { type: String, required: true },
        displayUrl: { type: String, required: true },
        thumbnailUrl: { type: String, required: true },
      },
    ],
    hashtags: [{ type: String }],
    count: {
      reactions: {
        like: { type: Number, default: 0 },
        dislike: { type: Number, default: 0 },
      },
      comments: { type: Number, default: 0 },
    },
    status: { type: String, enum: ["processing", "published", "failed"], default: "processing" },
    deletedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date, default: null },
  },
  { versionKey: false }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ deletedAt: 1 });
postSchema.index({ "count.reactions.like": -1 });
postSchema.index({ "count.reactions.dislike": -1 });
postSchema.index({ "count.comments": -1 });
postSchema.index({ author: 1, status: 1 });
postSchema.index({ hashtags: 1, deletedAt: 1 });
postSchema.index({ status: 1, deletedAt: 1 });

const PostModel = mongoose.model<IPost>("Post", postSchema);
export default PostModel;
