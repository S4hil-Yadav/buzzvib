import { connectDB } from "@/lib/db.js";
import { getWorkerLogger } from "@/loggers/worker.logger.js";

import "./deleteUserCleanup.worker.js";
import "./deletePostCleanup.worker.js";
import "./notifyFollowers.worker.js";

const { logInfo, logError } = getWorkerLogger("index");

await connectDB({ logInfo, logError });
logInfo("Workers started");
