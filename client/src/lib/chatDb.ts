import type { Chatroom, Message, User } from "@/types";
import Dexie, { Table } from "dexie";

export class ChatDb extends Dexie {
  messages!: Table<Message, string>;
  chatrooms!: Table<Chatroom, string>;
  users!: Table<User, string>;

  constructor() {
    super("ChatDb");

    this.version(1).stores({
      messages: "_id, [chatroomId+createdAt]",
      chatrooms: "_id, type, createdAt",
      users: "_id, name",
    });
  }
}

const chatDb = new ChatDb();
export default chatDb;
