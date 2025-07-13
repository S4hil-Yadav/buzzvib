import ChatroomModel from "@/models/chatroom.model.js";
import MessageModel from "@/models/message.model.js";
import { logApiError } from "@/loggers/api.logger.js";
import mongoose from "mongoose";
import type { Server as SocketServer, Socket } from "socket.io";
import ChatroomMemberModel from "@/models/chatroomMember.model.js";
import { isValidMessagePayload } from "@/utils/typeGuard.utils.js";
import type { Chatroom } from "types";

export function joinChatrooms(_io: SocketServer, socket: Socket, userId: string = socket.data.user._id) {
  return async function () {
    const chatrooms = await ChatroomMemberModel.find({ user: userId }).select("chatroom").lean<{ chatroom: Chatroom["_id"] }[]>();

    const chatroomIds = chatrooms.map(m => m.chatroom.toString());

    chatrooms.forEach(chatroom => {
      socket.join(chatroom.toString());
    });

    socket.emit("chatroom:joined:bulk", chatroomIds);
  };
}

export function sendMessage(io: SocketServer, socket: Socket, userId: string = socket.data.user._id) {
  return async function (data: unknown) {
    try {
      if (!isValidMessagePayload(data)) {
        return socket.emit("chatroom:error", "Invalid message payload");
      }

      const { chatroomId, text } = data;

      if (!mongoose.Types.ObjectId.isValid(chatroomId)) {
        return socket.emit("chatroom:error", "Invalid chatroom ID");
      } else if (!text.trim()) {
        return socket.emit("chatroom:error", "Invalid message text");
      }

      const isMember = await ChatroomMemberModel.exists({ chatroom: chatroomId, user: userId });
      if (!isMember) {
        return socket.emit("chatroom:error", "You are not a member of this chatroom");
      }

      if (!socket.rooms.has(chatroomId)) {
        socket.join(chatroomId);
        socket.emit("chatroom:joined", chatroomId);
      }

      const message = await MessageModel.create({
        chatroomId,
        sender: userId,
        text: text.trim(),
      });

      await ChatroomModel.findByIdAndUpdate(chatroomId, {
        $set: { updatedAt: new Date(), lastMessage: message._id },
      });

      io.to(chatroomId).emit("receive-message", message);
    } catch (err) {
      logApiError(`sendMessage error: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
      socket.emit("chatroom:error", "Failed to send message");
    }
  };
}
