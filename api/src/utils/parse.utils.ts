import { ApiError, ErrorCode } from "@/lib/error.js";
import { isValidPostPayload, isValidUpdateUserFields } from "@/utils/typeGuard.utils.js";

export function parseUpdateUserFields(userFields: unknown) {
  if (typeof userFields !== "string") {
    throw new ApiError(400, { message: "Invalid payload type, expected stringified JSON", code: ErrorCode.INVALID_INPUT });
  }

  const parsedUserFields = (() => {
    try {
      return JSON.parse(userFields);
    } catch {
      throw new ApiError(400, { message: "Malformed JSON payload.", code: ErrorCode.INVALID_INPUT });
    }
  })();

  if (!isValidUpdateUserFields(parsedUserFields)) {
    throw new ApiError(400, { message: "Invalid payload structure", code: ErrorCode.INVALID_INPUT });
  }

  return parsedUserFields;
}

export function parsePostPayload(postPayload: unknown) {
  if (typeof postPayload !== "string") {
    throw new ApiError(400, { message: "Invalid payload type, expected stringified JSON", code: ErrorCode.INVALID_INPUT });
  }

  const parsedPostPayload = (() => {
    try {
      return JSON.parse(postPayload);
    } catch {
      throw new ApiError(400, { message: "Malformed JSON payload.", code: ErrorCode.INVALID_INPUT });
    }
  })();

  if (!isValidPostPayload(parsedPostPayload)) {
    throw new ApiError(400, { message: "Invalid payload structure", code: ErrorCode.INVALID_INPUT });
  }

  return parsedPostPayload;
}
