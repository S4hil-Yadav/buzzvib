import { Worker } from "bullmq";
import { connection } from "@/lib/redis.js";
import { connectDB } from "@/lib/db.js";
import type { CreatePostJobPayload, Media } from "types";
import PostModel from "@/models/post.model.js";
import cloudinary from "@/lib/cloudinary.js";
import { notifyFollowersQueue } from "@/queues/notifyFollowers.queue.js";
import UserModel from "@/models/user.model.js";
import { getWorkerLogger } from "@/loggers/worker.logger.js";
import mongoose from "mongoose";

const { logInfo, logError } = getWorkerLogger("create-post");

await connectDB({ logInfo, logError });

const worker = new Worker<CreatePostJobPayload>(
  "createPost",
  async ({ data }) => {
    const { authorId: rawAuthorId, title, text, files } = data;

    const authorId = new mongoose.Types.ObjectId(rawAuthorId);

    const post = new PostModel({ author: authorId, title, text });

    const media: Media[] = [];

    for (const file of files) {
      const resourceType = file.mimetype.startsWith("image/") ? "image" : file.mimetype.startsWith("video/") ? "video" : null;

      if (!resourceType) continue;

      try {
        const cloudinaryRes = await cloudinary.uploader.upload(file.path, {
          resource_type: resourceType,
          folder: `buzzvib/posts/${post._id}`,
        });

        media.push({ type: resourceType, url: cloudinaryRes.secure_url });
      } catch (err) {
        logError(`Failed to upload ${file.originalname}:`, err);
      }
    }

    post.set({ media });

    await Promise.all([post.save(), UserModel.updateOne({ _id: authorId }, { $inc: { "count.posts": 1 } })]);

    try {
      await notifyFollowersQueue.add(
        "newPost",
        { authorId: authorId.toString(), postId: post._id.toString() },
        { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: true, removeOnFail: false }
      );
    } catch (err) {
      logError("Failed to add notifications to notifyFollowersQueue in createPostWorker:", err);
    }
  },
  { connection }
);

worker.on("completed", job => {
  logInfo(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  logError(`Job ${job?.id} failed: ${err.message}`);
});
