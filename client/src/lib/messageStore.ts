import chatDb from "./chatDb";
import { encryptMessage, decryptMessage } from "./crypto";
import type { Message } from "@/types";

export async function saveMessage(message: Message) {
  const encryptedContent = encryptMessage(message.content ?? "");
  await chatDb.messages.put({ ...message, content: encryptedContent });
}

export async function getMessages(chatroomId: string) {
  const encryptedMessages: Message[] = await chatDb.messages.where("chatroomId").equals(chatroomId).sortBy("createdAt");
  return encryptedMessages.map(msg => ({ ...msg, content: decryptMessage(msg.content ?? "") }));
}
