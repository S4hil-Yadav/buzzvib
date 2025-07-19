import { NextFunction, Request, Response } from "express";
import MessageModel from "@/models/message.model.js";
import { ApiError, ErrorCode } from "@/lib/error.js";
import { getSocketIOInstance } from "@/sockets/ioInstance.js";
import { isValidReqBody } from "@/utils/typeGuard.js";

export const sendMediaMessage = async (req: Request, res: Response, next: NextFunction) => {
  if (!isValidReqBody(req.body, ["chatroomId", "senderId"])) {
    throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
  }

  const { chatroomId, senderId } = req.body;

  if (typeof chatroomId !== "string" || typeof senderId !== "string") {
    return next(new ApiError(400, { message: "Invalid chatroom or sender id", code: ErrorCode.INVALID_INPUT }));
  }

  const files = req.files;

  if (!Array.isArray(files) || files.some(f => typeof f !== "object" || typeof f.mimetype !== "string")) {
    return next(new ApiError(400, { message: "Group can't be empty", code: ErrorCode.INVALID_FILE_PAYLOAD }));
  }

  // const fileType = req.file.mimetype.startsWith("image") ? "image" : req.file.mimetype.startsWith("video") ? "video" : "file";

  const mediaMessage = await MessageModel.create({
    chatroomId,
    sender: senderId,
    media: {
      // url: `/uploads/messages/${req.file.filename}`,
      // type: fileType,
      // filename: req.file.originalname,
    },
  });

  const io = getSocketIOInstance();
  io.to(chatroomId).emit("receive-message", mediaMessage);

  res.status(201).json(mediaMessage);
};
