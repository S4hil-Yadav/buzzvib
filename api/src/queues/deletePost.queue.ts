import { Queue } from "bullmq";
import { connection } from "@/lib/redis.js";
import type { DeletePostJobPayload } from "types";

export const deletePostQueue = new Queue<DeletePostJobPayload>("deletePost", { connection });
