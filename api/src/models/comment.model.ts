import mongoose, { type Document } from "mongoose";

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  commentor: mongoose.Types.ObjectId;
  text: string;
  post: mongoose.Types.ObjectId;
  media: [{ type: string; url: string }];
  parent: mongoose.Types.ObjectId | null;
  count: {
    reactions: {
      like: number;
      dislike: number;
    };
    replies: number;
  };
  deletedAt: Date | null;
  createdAt: Date;
  editedAt: Date;
}

const commentSchema = new mongoose.Schema<IComment>(
  {
    commentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    media: [{ type: { type: String, required: true }, url: { type: String, required: true } }],
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    count: {
      reactions: {
        like: { type: Number, default: 0 },
        dislike: { type: Number, default: 0 },
      },
      replies: { type: Number, default: 0 },
    },
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { versionKey: false }
);

commentSchema.index({ commentor: 1, createdAt: -1 });
commentSchema.index({ post: 1, parent: 1, createdAt: -1 });
commentSchema.index({ deletedAt: 1 });
commentSchema.index({ "count.reactions.like": -1 });
commentSchema.index({ "count.reactions.dislike": -1 });
commentSchema.index({ "count.replies": -1 });

// commentSchema.pre(/^(find|update|countDocuments|aggregate)/, function (this: Query<any, any>, next) {
//   this.where({ deletedAt: null });
//   next();
// });

const CommentModel = mongoose.model<IComment>("Comment", commentSchema);
export default CommentModel;
