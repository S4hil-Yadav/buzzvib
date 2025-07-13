import express from "express";
import upload from "@/lib/multer.js";
import { protectRoute } from "@/middleware/protectRoute.middleware.js";
import {
  createPost,
  deletePost,
  getPosts,
  getPost,
  togglePostReaction,
  togglePostSave,
  searchPosts,
} from "@/controllers/post.controller.js";
import { getPostComments, submitComment } from "@/controllers/comment.controller.js";

const postRoutes = express.Router();

postRoutes.post("", protectRoute, upload.array("files"), createPost);
postRoutes.get("", getPosts);
postRoutes.get("/search", searchPosts);
postRoutes.get("/:postId", getPost);
postRoutes.post("/:postId/react", protectRoute, togglePostReaction);
// postRoutes.get("/:postId/likes", getPostLikes);
postRoutes.post("/:postId/save", protectRoute, togglePostSave);
postRoutes.delete("/:postId", protectRoute, deletePost);
postRoutes.post("/:postId/comment", protectRoute, submitComment);
postRoutes.get("/:postId/comments", getPostComments);

export default postRoutes;
