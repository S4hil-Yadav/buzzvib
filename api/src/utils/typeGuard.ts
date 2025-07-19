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
  const dataKeySet = new Set(Object.keys(data));
  const dataValues = Object.values(data);

  return (
    dataKeySet.size === keys.length &&
    keys.every(key => dataKeySet.has(key)) &&
    dataValues.every(value => typeof value === "string")
  );
}

export function isValidLoginUserFields(data: unknown): data is Pick<UserFields, "email" | "password"> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const keys = ["email", "password"];
  const dataKeySet = new Set(Object.keys(data));
  const dataValues = Object.values(data);

  return (
    dataKeySet.size === keys.length &&
    keys.every(key => dataKeySet.has(key)) &&
    dataValues.every(value => typeof value === "string")
  );
}

export function isValidUpdateUserFields(
  data: unknown
): data is Pick<UserFields, "username" | "fullname" | "bio" | "removeProfilePicture"> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const keys = ["username", "fullname", "bio", "removeProfilePicture"];
  const dataKeySet = new Set(Object.keys(data));

  const record = data as Record<string, unknown>;

  return (
    dataKeySet.size === keys.length &&
    keys.every(key => dataKeySet.has(key)) &&
    typeof record.username === "string" &&
    typeof record.fullname === "string" &&
    (typeof record.bio === "string" || record.bio === null) &&
    typeof record.removeProfilePicture === "boolean"
  );
}

export function isValidMessagePayload(data: unknown): data is MessagePayload {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const keys = ["chatroomId", "text"];
  const dataKeySet = new Set(Object.keys(data));
  const dataValues = Object.values(data);

  return (
    dataKeySet.size === keys.length &&
    keys.every(key => dataKeySet.has(key)) &&
    dataValues.every(value => typeof value === "string")
  );
}

export function isValidPostPayload(data: unknown): data is PostPayload {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const keys = ["title", "text"];
  const dataKeySet = new Set(Object.keys(data));
  const dataValues = Object.values(data);

  return (
    dataKeySet.size === keys.length &&
    keys.every(key => dataKeySet.has(key)) &&
    dataValues.every(value => typeof value === "string" || value === null)
  );
}

export function isValidFileMetaPayload(data: unknown): data is { type: "file" | "url"; value: string }[] {
  if (!Array.isArray(data)) return false;

  return data.every((item: unknown) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return false;
    }

    const keys = Object.keys(item);
    const hasOnlyValidKeys = keys.length === 2 && keys.includes("type") && keys.includes("value");

    const record = item as Record<string, unknown>;

    const type = record.type;
    const value = record.value;

    return hasOnlyValidKeys && typeof type === "string" && (type === "file" || type === "url") && typeof value === "string";
  });
}
