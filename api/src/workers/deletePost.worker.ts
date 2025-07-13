import { Worker } from "bullmq";
import { connection } from "@/lib/redis.js";
import { connectDB } from "@/lib/db.js";
import { getWorkerLogger } from "@/loggers/worker.logger.js";
import NotificationModel from "@/models/notification.model.js";
import CommentModel from "@/models/comment.model.js";
import type { DeletePostJobPayload } from "types";
import mongoose from "mongoose";

const { logInfo, logError } = getWorkerLogger("delete-post");

await connectDB({ logInfo, logError });

const worker = new Worker<DeletePostJobPayload>(
  "deletePost",
  async ({ data }) => {
    const { postId: rawPostId } = data;

    const postId = new mongoose.Types.ObjectId(rawPostId);

    await CommentModel.updateMany({ post: postId }, { $set: { deletedAt: new Date() } });
    await NotificationModel.deleteMany({ "target.post": postId });
  },
  { connection }
);

worker.on("completed", job => {
  logInfo(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  logError(`Job ${job?.id} failed: ${err.message}`);
});
