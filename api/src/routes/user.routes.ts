import express from "express";
import { protectRoute } from "@/middleware/protectRoute.middleware.js";
import {
  getUsers,
  updateProfile,
  getDislikedPosts,
  getFollowers,
  getFollowing,
  getLikedPosts,
  getSavedPosts,
  getProfileUser,
  getUserPosts,
  searchUsers,
  updatePrivacySettings,
  changeEmail,
  changePassword,
  verifyEmailOTP,
  requestEmailVerification,
} from "@/controllers/user.controller.js";
import upload from "@/lib/multer.js";

const userRoutes = express.Router();

userRoutes.get("", getUsers);
userRoutes.get("/search", searchUsers);
userRoutes.get("/profile/:username", getProfileUser);
userRoutes.get("/:username/followers", getFollowers);
userRoutes.get("/:username/following", getFollowing);
userRoutes.get("/:username/posts", getUserPosts);
userRoutes.get("/:username/liked-posts", getLikedPosts);
userRoutes.get("/me/disliked-posts", protectRoute, getDislikedPosts);
userRoutes.get("/me/saved-posts", protectRoute, getSavedPosts);
userRoutes.patch("/me/profile", protectRoute, upload.single("profilePicture"), updateProfile);
userRoutes.patch("/me/email", protectRoute, changeEmail);
userRoutes.post("/me/email-verification", protectRoute, requestEmailVerification);
userRoutes.put("/me/email-verification", protectRoute, verifyEmailOTP);
userRoutes.patch("/me/password", protectRoute, changePassword);
userRoutes.patch("/me/privacy-settings", protectRoute, updatePrivacySettings);
// userRoutes.patch("/me/phone", protectRoute, () => {});
// userRoutes.patch("/me/notification-settings", protectRoute, () => {});
// userRoutes.post("/me/deactivate", protectRoute, () => {});

export default userRoutes;
