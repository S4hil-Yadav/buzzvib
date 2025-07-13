import express from "express";
import { protectRoute } from "@/middleware/protectRoute.middleware.js";
import {
  editComment,
  deleteComment,
  getCommentReplies,
  submitReply,
  toggleCommentReaction,
  getComment,
} from "@/controllers/comment.controller.js";

const commentRoutes = express.Router();

commentRoutes.post("/:commentId/react", protectRoute, toggleCommentReaction);
commentRoutes.patch("/:commentId", protectRoute, editComment);
commentRoutes.get("/:commentId", getComment);
commentRoutes.delete("/:commentId", protectRoute, deleteComment);
commentRoutes.post("/:commentId/reply", protectRoute, submitReply);
commentRoutes.get("/:commentId/replies", getCommentReplies);

export default commentRoutes;
