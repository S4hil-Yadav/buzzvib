import { Queue } from "bullmq";
import { connection } from "@/lib/redis.js";
import type { DeleteUserCleanupJobPayload } from "types";

export const deleteUserCleanupQueue = new Queue<DeleteUserCleanupJobPayload>("deleteUserCleanup", {
  connection,
  prefix: process.env.DB_PREFIX,
});
