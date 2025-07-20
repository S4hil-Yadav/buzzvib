import { Worker } from "bullmq";
import { connection } from "@/lib/redis.js";
import { getWorkerLogger } from "@/loggers/worker.logger.js";
import NotificationModel from "@/models/notification.model.js";
import CommentModel from "@/models/comment.model.js";
import type { DeletePostCleanupJobPayload } from "types";
import mongoose from "mongoose";

const { logInfo, logError } = getWorkerLogger("delete-post-cleanup");

const worker = new Worker<DeletePostCleanupJobPayload>(
  "deletePostCleanup",
  async ({ data }) => {
    const { postId: rawPostId } = data;

    const postId = new mongoose.Types.ObjectId(rawPostId);

    logInfo(`Starting cleanup for post ${postId}`);

    try {
      await Promise.all([
        CommentModel.updateMany({ post: postId }, { $set: { deletedAt: new Date() } }),
        NotificationModel.deleteMany({ "target.post": postId }),
      ]);

      logInfo(`Successfully completed cleanup for post ${postId}`);
    } catch (error) {
      logError(`Error during cleanup for post ${postId}:`, error);
      throw error;
    }
  },
  { connection, prefix: process.env.DB_PREFIX }
);

worker.on("completed", job => {
  logInfo(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  logError(`Job ${job?.id} failed:`, error);
});
