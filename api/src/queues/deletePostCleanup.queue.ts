import { Queue } from "bullmq";
import { connection } from "@/lib/redis.js";
import type { DeletePostCleanupJobPayload } from "types";

export const deletePostCleanupQueue = new Queue<DeletePostCleanupJobPayload>("deletePostCleanup", {
  connection,
  prefix: process.env.DB_PREFIX,
});
