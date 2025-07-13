import express from "express";
import {
  acceptFollowRequest,
  createFollow,
  getFollowerRequests,
  getFollowingRequests,
  rejectFollowRequest,
  removeFollow,
  removeFollower,
  getFollowStatuses,
  seeAllFollowerRequests,
  getFollowStatus,
  blockFollow,
  unblockFollow,
  getBlockedUserDocs,
} from "@/controllers/follow.controller.js";
import { protectRoute } from "@/middleware/protectRoute.middleware.js";

const followRoutes = express.Router();

followRoutes.post("/:followingId", protectRoute, createFollow);
followRoutes.delete("/:followingId", protectRoute, removeFollow);
followRoutes.patch("/:followingId/block", protectRoute, blockFollow);
followRoutes.patch("/:followingId/unblock", protectRoute, unblockFollow);
followRoutes.delete("/follower/:followerId", protectRoute, removeFollower);
followRoutes.patch("/:followerId/accept", protectRoute, acceptFollowRequest);
followRoutes.patch("/:followerId/reject", protectRoute, rejectFollowRequest);
followRoutes.get("/me/follower-requests", protectRoute, getFollowerRequests);
followRoutes.get("/me/following-requests", protectRoute, getFollowingRequests);
followRoutes.get("/me/blocked-user-docs", protectRoute, getBlockedUserDocs);
followRoutes.get("/status", protectRoute, getFollowStatus);
followRoutes.get("/statuses", protectRoute, getFollowStatuses);
followRoutes.patch("/follower-requests/see-all", protectRoute, seeAllFollowerRequests);

export default followRoutes;
