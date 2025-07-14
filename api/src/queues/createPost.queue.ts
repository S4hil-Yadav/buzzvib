import { Queue } from "bullmq";
import { connection } from "@/lib/redis.js";
import type { CreatePostJobPayload } from "types";

export const createPostQueue = new Queue<CreatePostJobPayload>("createPost", {
  connection,
  prefix: process.env.MODE,
});
