import { Queue } from "bullmq";
import { connection } from "@/lib/redis.js";
import type { NotifyFollowersJobPayload } from "types";

export const notifyFollowersQueue = new Queue<NotifyFollowersJobPayload>("notifyFollowers", { connection });
