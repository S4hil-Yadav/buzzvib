import { Worker } from "bullmq";
import { connection } from "@/lib/redis.js";
import FollowModel from "@/models/follow.model.js";
import NotificationModel from "@/models/notification.model.js";
import { connectDB } from "@/lib/db.js";
import type { NotifyFollowersJobPayload, User } from "types";
import { getWorkerLogger } from "@/loggers/worker.logger.js";
import mongoose from "mongoose";
import { BATCH_SIZE } from "@/config/constants.js";

const { logInfo, logError } = getWorkerLogger("notify-followers");

await connectDB({ logInfo, logError });

const worker = new Worker<NotifyFollowersJobPayload>(
  "notifyFollowers",
  async ({ data }) => {
    const { authorId: rawAuthorId, postId: rawPostId } = data;

    const authorId = new mongoose.Types.ObjectId(rawAuthorId);
    const postId = new mongoose.Types.ObjectId(rawPostId);

    const followersCursor = FollowModel.find({ following: authorId, status: "accepted" })
      .select("-_id follower")
      .populate({
        path: "follower",
        select: "_id",
        match: { deletedAt: null },
      })
      .lean<{ follower: Pick<User, "_id"> | null }>()
      .cursor();

    const batch: Pick<User, "_id">[] = [];

    async function pushNotifications() {
      const notifications = batch.map(follower => ({
        sender: authorId,
        receiver: follower._id,
        type: "newPost",
        target: { post: postId, comment: null },
      }));

      await NotificationModel.insertMany(notifications);
      batch.length = 0;
    }

    for await (const { follower } of followersCursor) {
      if (follower) {
        batch.push(follower);
      }
      if (batch.length === BATCH_SIZE) {
        await pushNotifications();
      }
    }

    if (batch.length) {
      await pushNotifications();
    }
  },
  { connection }
);

worker.on("completed", job => {
  logInfo(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  logError(`Job ${job?.id} failed: ${err}`);
});
