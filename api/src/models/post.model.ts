import mongoose, { type Document } from "mongoose";

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  title: string | null;
  text: string | null;
  media: [{ type: string; url: string }];
  hashtags: string[];
  count: {
    reactions: {
      like: number;
      dislike: number;
    };
    comments: number;
  };
  deletedAt: Date | null;
  createdAt: Date;
  editedAt: Date;
}

const postSchema = new mongoose.Schema<IPost>(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, maxlength: 300, default: null },
    text: { type: String, default: null },
    media: [{ type: { type: String, required: true }, url: { type: String, required: true } }],
    hashtags: [{ type: String }],
    count: {
      reactions: {
        like: { type: Number, default: 0 },
        dislike: { type: Number, default: 0 },
      },
      comments: { type: Number, default: 0 },
    },
    deletedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date, default: null },
  },
  { versionKey: false }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ deletedAt: 1 });
postSchema.index({ "count.reactions.like": -1 });
postSchema.index({ "count.reactions.dislike": -1 });
postSchema.index({ "count.comments": -1 });
postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ deletedAt: 1, createdAt: -1, _id: -1 });

postSchema.pre("validate", function (next) {
  if (!this.title && !this.text && !this.media.length) {
    return next(new Error("Post can't be empty"));
  }
  next();
});

// postSchema.pre(/^(find|update|countDocuments|aggregate)/, function (this: Query<any, any>, next) {
//   this.where({ deletedAt: null });
//   next();
// });

postSchema.pre("save", function (next) {
  this.hashtags = this.text?.match(/#\w+/g)?.map(tag => tag.slice(1).toLowerCase()) ?? [];
  next();
});

const PostModel = mongoose.model<IPost>("Post", postSchema);
export default PostModel;
