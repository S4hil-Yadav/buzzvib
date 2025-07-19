import { Worker } from "bullmq";
import { connection } from "@/lib/redis.js";
import { getWorkerLogger } from "@/loggers/worker.logger.js";
import NotificationModel from "@/models/notification.model.js";
import CommentModel from "@/models/comment.model.js";
import PostModel from "@/models/post.model.js";
import FollowModel from "@/models/follow.model.js";
import ReactionModel from "@/models/reaction.model.js";
import SaveModel from "@/models/save.model.js";
import SaveCollectionModel from "@/models/saveCollection.model.js";
import SessionModel from "@/models/session.model.js";
import VerificationTokenModel from "@/models/verificationToken.model.js";
import UserModel from "@/models/user.model.js";
import type { DeleteUserCleanupJobPayload, User } from "types";
import mongoose from "mongoose";
import { BATCH_SIZE } from "@/config/constants.js";

const { logInfo, logError } = getWorkerLogger("delete-user-cleanup");

async function updateFollowerCounts(userId: mongoose.Types.ObjectId) {
  const followingCursor = FollowModel.find({ follower: userId, status: "accepted" })
    .select("-_id following")
    .populate({
      path: "following",
      select: "_id",
      match: { deletedAt: null },
    })
    .lean<{ following: Pick<User, "_id"> | null }>()
    .cursor();

  const followingBatch: Pick<User, "_id">[] = [];

  async function updateFollowingCounts() {
    const userIds = followingBatch.map(user => user._id);
    await UserModel.updateMany({ _id: { $in: userIds } }, { $inc: { "count.followers": -1 } });
    followingBatch.length = 0;
  }

  for await (const { following } of followingCursor) {
    if (following) {
      followingBatch.push(following);
    }
    if (followingBatch.length === BATCH_SIZE) {
      await updateFollowingCounts();
    }
  }

  if (followingBatch.length) {
    await updateFollowingCounts();
  }

  const followersCursor = FollowModel.find({ following: userId, status: "accepted" })
    .select("-_id follower")
    .populate({
      path: "follower",
      select: "_id",
      match: { deletedAt: null },
    })
    .lean<{ follower: Pick<User, "_id"> | null }>()
    .cursor();

  const followersBatch: Pick<User, "_id">[] = [];

  async function updateFollowersCounts() {
    const userIds = followersBatch.map(user => user._id);
    await UserModel.updateMany({ _id: { $in: userIds } }, { $inc: { "count.following": -1 } });
    followersBatch.length = 0;
  }

  for await (const { follower } of followersCursor) {
    if (follower) {
      followersBatch.push(follower);
    }
    if (followersBatch.length === BATCH_SIZE) {
      await updateFollowersCounts();
    }
  }

  if (followersBatch.length) {
    await updateFollowersCounts();
  }

  logInfo(`Updated follower/following counts for user ${userId} relationships`);
}

const worker = new Worker<DeleteUserCleanupJobPayload>(
  "deleteUserCleanup",
  async ({ data }) => {
    const { userId: rawUserId } = data;

    const userId = new mongoose.Types.ObjectId(rawUserId);
    const now = new Date();

    logInfo(`Starting cleanup for user ${userId}`);

    try {
      await updateFollowerCounts(userId);

      await Promise.all([
        CommentModel.updateMany({ commentor: userId }, { $set: { deletedAt: now } }),
        PostModel.updateMany({ author: userId }, { $set: { deletedAt: now } }),

        NotificationModel.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),

        FollowModel.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),

        ReactionModel.deleteMany({ user: userId }),

        SaveModel.deleteMany({ user: userId }),
        SaveCollectionModel.deleteMany({ user: userId }),

        SessionModel.deleteMany({ user: userId }),

        VerificationTokenModel.deleteMany({ user: userId }),
      ]);

      logInfo(`Successfully completed cleanup for user ${userId}`);
    } catch (error) {
      logError(`Error during cleanup for user ${userId}:`, error);
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
