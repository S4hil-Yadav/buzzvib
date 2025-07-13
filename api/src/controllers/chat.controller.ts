import { NextFunction, Request, Response } from "express";
import ChatroomModel from "@/models/chatroom.model.js";
import mongoose from "mongoose";
import { ApiError, ErrorCode, handleControllerError } from "@/lib/error.js";
import { enrichRawIds } from "@/utils/enrichRawIds.js";
import type { Chatroom } from "types";
import { buildChatroomEnrichmentStages, buildMessageEnrichmentStages } from "@/utils/aggregate.utils.js";
import ChatroomMemberModel from "@/models/chatroomMember.model.js";
import { isValidReqBody } from "@/utils/typeGuard.utils.js";
import { CHATROOM_MESSAGES_PAGE_SIZE } from "@/config/constants.js";

export async function getChatrooms(req: Request, res: Response, next: NextFunction) {
  try {
    const pageParam = req.query;
    const chatroomMatchConditions: Record<string, any> = { members: req.user!._id, deletedAt: null };

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.updatedAt === "string"
    ) {
      const updatedAtDate = new Date(pageParam.updatedAt);
      if (!isNaN(updatedAtDate.getTime())) {
        chatroomMatchConditions.$or = [
          { updatedAt: { $lt: updatedAtDate } },
          { updatedAt: updatedAtDate, _id: { $lt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const chatrooms = await ChatroomModel.aggregate([
      { $match: chatroomMatchConditions },
      ...buildChatroomEnrichmentStages(req.user),
      { $sort: { updatedAt: -1, _id: -1 } },
      { $limit: CHATROOM_MESSAGES_PAGE_SIZE },
    ]);

    const lastChatroom = chatrooms[chatrooms.length - 1];
    const nextPageParam =
      chatrooms.length === CHATROOM_MESSAGES_PAGE_SIZE && lastChatroom
        ? { _id: lastChatroom._id, updatedAt: lastChatroom.updatedAt }
        : null;

    res.status(200).json({ chatrooms, nextPageParam });
  } catch (error) {
    handleControllerError("getChatrooms", error, next);
  }
}

export async function getChatroom(req: Request<{ chatroomId: string }>, res: Response, next: NextFunction) {
  try {
    const { chatroomId: rawChatroomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawChatroomId)) {
      return next(new ApiError(400, { message: "Invalid chatroom ID", code: ErrorCode.INVALID_OBJECT_ID }));
    }

    const chatroomId = new mongoose.Types.ObjectId(rawChatroomId);

    const [chatroom, member] = await Promise.all([
      ChatroomModel.findById(chatroomId).select("_id type group lastMessage createdBy deletedAt createdAt updatedAt").lean(),
      ChatroomMemberModel.findOne({ chatroom: chatroomId, user: req.user!._id })
        .select("nickname lastSeenMessage muted archived")
        .lean(),
    ]);

    if (!chatroom) {
      return next(new ApiError(404, { message: "Chatroom not found", code: ErrorCode.CHATROOM_NOT_FOUND }));
    } else if (!member) {
      return next(new ApiError(403, { message: "You are not a member of this chatroom", code: ErrorCode.UNAUTHORIZED }));
    }

    const result = { ...chatroom, ...member };

    if (chatroom.type === "group") {
      const members = await ChatroomMemberModel.find({ chatroom: chatroom._id }).select("user").lean();
      Object.assign(result, { members: members.map(m => m.user) });
    } else if (chatroom.type === "private") {
      const other = await ChatroomMemberModel.findOne({
        chatroom: chatroom._id,
        user: { $ne: req.user!._id },
      })
        .select("user")
        .lean();
      if (!other) {
        return next(new ApiError(404, { message: "Chatroom member not found", code: ErrorCode.USER_NOT_FOUND }));
      }
      Object.assign(result, { user: other.user });
    }

    res.status(200).json(result);
  } catch (error) {
    handleControllerError("getAuthUser", error, next);
  }
}

export async function createPrivateChat(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["userId"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const { userId: rawUserId } = req.body;

    if (typeof rawUserId !== "string" || !mongoose.Types.ObjectId.isValid(rawUserId)) {
      return next(new ApiError(400, { message: "Invalid user id", code: ErrorCode.INVALID_OBJECT_ID }));
    }

    const members = enrichRawIds([rawUserId, req.user!._id]);

    const chatroom = await ChatroomModel.findOneAndUpdate(
      { type: "private", members },
      { $setOnInsert: { type: "private", members, createdBy: req.user!._id } },
      { upsert: true, new: true }
    )
      .select("_id")
      .lean<Pick<Chatroom, "_id">>();

    res.status(201).json(chatroom._id);
  } catch (error) {
    handleControllerError("createPrivateChat", error, next);
  }
}

export async function createGroupChat(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["groupName", "rawMemberIds"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const { groupName, rawMemberIds } = req.body;

    if (typeof groupName !== "string" || !Array.isArray(rawMemberIds) || rawMemberIds.some(id => typeof id !== "string")) {
      return next(new ApiError(400, { message: "Invalid input", code: ErrorCode.INVALID_INPUT }));
    }

    const memberIds = enrichRawIds([req.user!._id, ...(rawMemberIds as string[])]);

    if (!memberIds.length) {
      return next(new ApiError(400, { message: "Group can't be empty", code: ErrorCode.MISSING_REQUIRED_FIELDS }));
    }

    const chatroom = await ChatroomModel.create({ group: {}, members: memberIds });

    res.status(201).json(chatroom);
  } catch (error) {
    handleControllerError("createGroupChat", error, next);
  }
}

export async function getChatMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const pageParam = req.query;
    const messageMatchConditions: Record<string, any> = { members: req.user!._id, deletedAt: null };

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.createdAt === "string"
    ) {
      const createdAtDate = new Date(pageParam.createdAt);
      if (!isNaN(createdAtDate.getTime())) {
        messageMatchConditions.$or = [
          { createdAt: { $lt: createdAtDate } },
          { createdAt: createdAtDate, _id: { $lt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const messages = await ChatroomModel.aggregate([
      { $match: messageMatchConditions },
      ...buildMessageEnrichmentStages(req.user),
      { $sort: { createdAt: 1, _id: 1 } },
      { $limit: CHATROOM_MESSAGES_PAGE_SIZE },
    ]);

    const firstMessage = messages[messages.length - 1];
    const nextPageParam =
      messages.length === CHATROOM_MESSAGES_PAGE_SIZE && firstMessage
        ? { _id: firstMessage._id, updatedAt: firstMessage.updatedAt }
        : null;

    res.status(200).json({ messages, nextPageParam });
  } catch (error) {
    handleControllerError("getChatMessages", error, next);
  }
}
