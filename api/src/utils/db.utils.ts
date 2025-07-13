import { ApiError, ErrorCode } from "@/lib/error.js";
import mongoose from "mongoose";

export async function withTransaction<T>(run: (session: mongoose.ClientSession) => Promise<T>, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const result = await run(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      if (isTransientTransactionError(err) && attempt < maxRetries) {
        // console.warn(`Transaction transient error, retrying attempt ${attempt}...`);
        await delay(100 * attempt);
        continue;
      }
      throw err;
    } finally {
      session.endSession();
    }
  }

  throw new ApiError(500, {
    message: "Transaction failed after max retries. Please try again",
    code: ErrorCode.INTERNAL_SERVER_ERROR,
  });
}

function isTransientTransactionError(err: any) {
  return err?.errorLabels?.includes("TransientTransactionError");
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
