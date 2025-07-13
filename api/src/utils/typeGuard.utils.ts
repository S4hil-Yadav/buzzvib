import type { MessagePayload, PostPayload, UserFields } from "types";

export function isValidReqBody<K extends string>(
  body: unknown,
  keys: readonly K[],
  exact: boolean = true
): body is Record<K, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return false;
  }

  const bodyKeys = Object.keys(body);

  return (!exact || bodyKeys.length === keys.length) && keys.every(key => bodyKeys.includes(key));
}

export function isValidSignupUserFields(data: unknown): data is Pick<UserFields, "email" | "username" | "fullname" | "password"> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const keys = ["email", "username", "fullname", "password"];
  const dataKeys = Object.keys(data);

  return dataKeys.length === keys.length && keys.every(key => dataKeys.includes(key));
}

export function isValidLoginUserFields(data: unknown): data is Pick<UserFields, "email" | "password"> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const keys = ["email", "password"];
  const dataKeys = Object.keys(data);

  return dataKeys.length === keys.length && keys.every(key => dataKeys.includes(key));
}

export function isValidUpdateUserFields(
  data: unknown
): data is Pick<UserFields, "username" | "fullname" | "bio" | "profilePicture"> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const keys = ["username", "fullname", "bio", "profilePicture"];
  const dataKeys = Object.keys(data);

  return dataKeys.length === keys.length && keys.every(key => dataKeys.includes(key));
}

export function isValidMessagePayload(data: unknown): data is MessagePayload {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const keys = ["chatroomId", "text"];
  const dataKeys = Object.keys(data);

  return dataKeys.length === keys.length && keys.every(key => dataKeys.includes(key));
}

export function isValidPostPayload(data: unknown): data is PostPayload {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const keys = ["title", "text"];
  const dataKeys = Object.keys(data);

  return dataKeys.length === keys.length && keys.every(key => dataKeys.includes(key));
}
