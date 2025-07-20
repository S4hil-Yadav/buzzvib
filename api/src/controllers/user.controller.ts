import mongoose from "mongoose";
import { ApiError, ErrorCode, handleControllerError } from "@/lib/error.js";
import UserModel from "@/models/user.model.js";
import { NextFunction, Request, Response } from "express";
import FollowModel from "@/models/follow.model.js";
import PostSaveModel from "@/models/save.model.js";
import PostModel from "@/models/post.model.js";
import type {
  UserPage,
  Post,
  PostPage,
  ProfileUser,
  User,
  AuthUser,
  VerificationToken,
  PostReaction,
  PostSave,
  UserAccountVisibility,
} from "types";
import ReactionModel from "@/models/reaction.model.js";
import cloudinary from "@/lib/cloudinary.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import VerificationTokenModel from "@/models/verificationToken.model.js";
import {
  buildFilterBlockStage,
  buildPostFieldEnrichmentStage,
  buildUserFieldEnrichmentStage,
  buildPostEnrichmentStages,
  buildSearchUserStage,
} from "@/utils/aggregate.js";
import { parseUpdateUserFields } from "@/utils/parse.js";
import { isValidReqBody } from "@/utils/typeGuard.js";
import { sendEmailVerificationEmail } from "@/services/email.service.js";
import { withTransaction } from "@/utils/db.js";
import { USER_PAGE_SIZE, POST_PAGE_SIZE } from "@/config/constants.js";
import SessionModel from "@/models/session.model.js";
import { sendAccountDeletionEmail } from "@/services/email.service.js";

export async function getUsers(req: Request, res: Response<User[]>, next: NextFunction) {
  try {
    const rawIds = req.query.userIds;

    if (typeof rawIds !== "string") {
      throw new ApiError(400, { message: "Invalid user ids", code: ErrorCode.INVALID_IDS });
    }

    const userIds = rawIds
      .split(",")
      .filter(userId => mongoose.Types.ObjectId.isValid(userId))
      .map(userId => new mongoose.Types.ObjectId(userId));

    if (userIds.length > 50) {
      throw new ApiError(400, { message: `Can't batch more than ${50} requests`, code: ErrorCode.BATCH_LIMIT_EXCEEDED });
    }

    const users = await UserModel.find({ _id: { $in: userIds }, deletedAt: null })
      .select("_id username fullname profilePicture verified.profile")
      .lean<User[]>();

    res.status(200).json(users);
  } catch (error) {
    handleControllerError("getUsers", error, next);
  }
}

export async function getProfileUser(req: Request, res: Response<ProfileUser>, next: NextFunction) {
  try {
    const username = String(req.params.username);

    const user = await UserModel.findOne({ username, deletedAt: null })
      .select("username fullname profilePicture bio privacy.showLikes privacy.account.visibility verified.profile profile count")
      .lean<ProfileUser>();

    if (!user) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    } else if (
      req.user &&
      (await FollowModel.exists({
        $or: [
          { follower: req.user._id, following: user._id, status: "blocked" },
          { follower: user._id, following: req.user._id, status: "blocked" },
        ],
      }))
    ) {
      throw new ApiError(403, { message: "Request denied due to block relationship", code: ErrorCode.BLOCKED_USER });
    }

    res.status(200).json(user);
  } catch (error) {
    handleControllerError("getProfileUser", error, next);
  }
}

/*
*user_search (Dynamic field mappings)
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "username": {
        "type": "autocomplete"
      },
      "fullname": {
        "type": "autocomplete"
      }
    }
  }
}
 */
export async function searchUsers(req: Request, res: Response<UserPage>, next: NextFunction) {
  try {
    const { searchTerm } = req.query;

    if (!searchTerm || typeof searchTerm !== "string") {
      throw new ApiError(400, { message: "Invalid input", code: ErrorCode.INVALID_INPUT });
    }

    const userMatchConditions: Record<string, any> = {
      _id: { $ne: req.user?._id },
      "privacy.account.searchable": true,
      deletedAt: null,
    };

    const pageParam = { _id: req.query._id, fullname: req.query.fullname };

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.fullname === "string"
    ) {
      userMatchConditions.$or = [
        { fullname: { $gt: pageParam.fullname } },
        { fullname: pageParam.fullname, _id: { $gt: new mongoose.Types.ObjectId(pageParam._id) } },
      ];
    }

    const users = await UserModel.aggregate<User>([
      ...buildSearchUserStage(searchTerm),
      { $match: userMatchConditions },
      ...buildFilterBlockStage(req.user, "_id"),
      { $sort: { fullname: 1, _id: 1 } },
      { $limit: USER_PAGE_SIZE },
      { $project: { _id: 1, username: 1, fullname: 1, profilePicture: 1, count: 1, "verified.profile": 1 } },
    ]);

    const lastUser = users[users.length - 1];

    const nextPageParam = users.length === USER_PAGE_SIZE && lastUser ? { _id: lastUser._id, fullname: lastUser.fullname } : null;

    res.status(200).json({ users, nextPageParam });
  } catch (error) {
    handleControllerError("searchUsers", error, next);
  }
}

export async function getFollowers(req: Request, res: Response<UserPage>, next: NextFunction) {
  try {
    const username = String(req.params.username);

    const user = await UserModel.findOne({ username, deletedAt: null })
      .select("_id privacy.account.visibility")
      .lean<UserAccountVisibility>();

    if (!user) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    } else if (
      user.privacy.account.visibility === "private" &&
      (!req.user ||
        (String(user._id) !== String(req.user._id) &&
          !(await FollowModel.exists({ follower: req.user._id, following: user._id, status: "accepted" }))))
    ) {
      throw new ApiError(403, { message: "Can't see followers of private user", code: ErrorCode.PRIVATE_USER });
    } else if (
      req.user &&
      String(req.user._id) !== String(user._id) &&
      (await FollowModel.exists({
        $or: [
          { follower: req.user._id, following: user._id, status: "blocked" },
          { follower: user._id, following: req.user._id, status: "blocked" },
        ],
      }))
    ) {
      throw new ApiError(403, { message: "Access denied due to block relationship", code: ErrorCode.BLOCKED_USER });
    }

    const followerMatchConditions: Record<string, any> = {};

    const pageParam = req.query;

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.fullname === "string"
    ) {
      followerMatchConditions.$or = [
        { "follower.fullname": { $gt: pageParam.fullname } },
        { "follower.fullname": pageParam.fullname, "follower._id": { $gt: new mongoose.Types.ObjectId(pageParam._id) } },
      ];
    }

    const followersAgg = await FollowModel.aggregate<{ follower: User }>([
      { $match: { following: user._id, status: "accepted" } },
      ...buildFilterBlockStage(req.user, "follower"),
      ...buildUserFieldEnrichmentStage(req.user, "follower"),
      { $match: followerMatchConditions },
      { $sort: { "follower.fullname": 1, "follower._id": 1 } },
      { $limit: USER_PAGE_SIZE },
      { $project: { _id: 0, follower: 1 } },
    ]);

    const followers = followersAgg.map(doc => doc.follower);
    const lastFollower = followers[followers.length - 1];

    const nextPageParam =
      followers.length === USER_PAGE_SIZE && lastFollower ? { _id: lastFollower._id, fullname: lastFollower.fullname } : null;

    res.status(200).json({ users: followers, nextPageParam });
  } catch (error) {
    handleControllerError("getFollowers", error, next);
  }
}

export async function getFollowing(req: Request, res: Response<UserPage>, next: NextFunction) {
  try {
    const username = String(req.params.username);

    const user = await UserModel.findOne({ username, deletedAt: null })
      .select("_id privacy.account.visibility")
      .lean<{ _id: User["_id"]; privacy: { account: { visibility: "public" | "private" } } }>();

    if (!user) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    } else if (
      user.privacy.account.visibility === "private" &&
      (!req.user ||
        (String(user._id) !== String(req.user._id) &&
          !(await FollowModel.exists({ follower: req.user._id, following: user._id, status: "accepted" }))))
    ) {
      throw new ApiError(403, { message: "Can't see followers of private user", code: ErrorCode.PRIVATE_USER });
    } else if (
      req.user &&
      String(req.user._id) !== String(user._id) &&
      (await FollowModel.exists({
        $or: [
          { follower: req.user._id, following: user._id, status: "blocked" },
          { follower: user._id, following: req.user._id, status: "blocked" },
        ],
      }))
    ) {
      throw new ApiError(403, { message: "Access denied due to block relationship", code: ErrorCode.BLOCKED_USER });
    }

    const followingMatchConditions: Record<string, any> = {};

    const pageParam = req.query;

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.fullname === "string"
    ) {
      followingMatchConditions.$or = [
        { "following.fullname": { $gt: pageParam.fullname } },
        { "following.fullname": pageParam.fullname, "following._id": { $gt: new mongoose.Types.ObjectId(pageParam._id) } },
      ];
    }

    const followingAgg = await FollowModel.aggregate<{ following: User }>([
      { $match: { follower: user._id, status: "accepted" } },
      ...buildFilterBlockStage(req.user, "following"),
      ...buildUserFieldEnrichmentStage(req.user, "following"),
      { $match: followingMatchConditions },
      { $sort: { "following.fullname": 1, "following._id": 1 } },
      { $limit: USER_PAGE_SIZE },
      { $project: { _id: 0, following: 1 } },
    ]);

    const following = followingAgg.map(doc => doc.following);
    const lastFollower = following[following.length - 1];

    const nextPageParam =
      following.length === USER_PAGE_SIZE && lastFollower ? { _id: lastFollower._id, fullname: lastFollower.fullname } : null;

    res.status(200).json({ users: following, nextPageParam });
  } catch (error) {
    handleControllerError("getFollowing", error, next);
  }
}

export async function getUserPosts(req: Request, res: Response<PostPage>, next: NextFunction) {
  try {
    const username = String(req.params.username);

    const user = await UserModel.findOne({ username, deletedAt: null })
      .select("_id privacy.account.visibility")
      .lean<UserAccountVisibility>();

    if (!user) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    } else if (
      user.privacy.account.visibility === "private" &&
      (!req.user ||
        (String(user._id) !== String(req.user._id) &&
          !(await FollowModel.exists({ follower: req.user._id, following: user._id, status: "accepted" }))))
    ) {
      throw new ApiError(403, { message: "Can't see followers of private user", code: ErrorCode.PRIVATE_USER });
    } else if (
      req.user &&
      String(req.user._id) !== String(user._id) &&
      (await FollowModel.exists({
        $or: [
          { follower: req.user._id, following: user._id, status: "blocked" },
          { follower: user._id, following: req.user._id, status: "blocked" },
        ],
      }))
    ) {
      throw new ApiError(403, { message: "Access denied due to block relationship", code: ErrorCode.BLOCKED_USER });
    }

    const blockFollowDoc = req.user
      ? await FollowModel.exists({
          $or: [
            { follower: req.user._id, following: user._id, status: "blocked" },
            { follower: user._id, following: req.user._id, status: "blocked" },
          ],
        })
      : null;

    if (blockFollowDoc) {
      throw new ApiError(403, { message: "Request denied due to block relationship", code: ErrorCode.PRIVATE_USER });
    }

    const postMatchConditions: Record<string, any> = { author: user._id, deletedAt: null };

    const pageParam = req.query;
    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.createdAt === "string"
    ) {
      const createdAtDate = new Date(pageParam.createdAt);
      if (!isNaN(createdAtDate.getTime())) {
        postMatchConditions.$or = [
          { createdAt: { $lt: createdAtDate } },
          { createdAt: createdAtDate, _id: { $lt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const posts = await PostModel.aggregate<Post>([
      { $match: postMatchConditions },
      ...buildPostEnrichmentStages(req.user, { filterBlockStage: false, filterPrivateAccounts: false }),
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: POST_PAGE_SIZE },
    ]);

    const lastPost = posts[posts.length - 1];
    const nextPageParam =
      posts.length === POST_PAGE_SIZE && lastPost ? { _id: lastPost._id, createdAt: lastPost.createdAt } : null;

    res.status(200).json({ posts, nextPageParam });
  } catch (error) {
    handleControllerError("getUserPosts", error, next);
  }
}

export async function getLikedPosts(req: Request, res: Response<PostPage>, next: NextFunction) {
  try {
    const username = String(req.params.username);

    const user = await UserModel.findOne({ username, deletedAt: null })
      .select("_id privacy.showLikes privacy.account.visibility")
      .lean<UserAccountVisibility & { privacy: { showLikes: boolean } }>();

    if (!user) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    } else if (!user.privacy.showLikes && (!req.user || String(req.user._id) !== String(user._id))) {
      throw new ApiError(403, { message: "This user doesn't allow viewing liked posts", code: ErrorCode.LIKES_HIDDEN });
    } else if (
      user.privacy.account.visibility === "private" &&
      (!req.user ||
        (String(req.user._id) !== String(user._id) &&
          !(await FollowModel.exists({ follower: req.user._id, following: user._id, status: "following" }))))
    ) {
      throw new ApiError(403, { message: "Can't see liked posts of private user", code: ErrorCode.PRIVATE_USER });
    } else if (
      req.user &&
      (await FollowModel.exists({
        $or: [
          { follower: req.user._id, following: user._id, status: "blocked" },
          { follower: user._id, following: req.user._id, status: "blocked" },
        ],
      }))
    ) {
      throw new ApiError(403, { message: "Request denied due to block relationship", code: ErrorCode.BLOCKED_USER });
    }

    const reactionMatchConditions: Record<string, any> = { user: user._id, "target.type": "Post", type: "like" };

    const pageParam = req.query;

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.createdAt === "string"
    ) {
      const createdAtDate = new Date(pageParam.createdAt);
      if (!isNaN(createdAtDate.getTime())) {
        reactionMatchConditions.$or = [
          { createdAt: { $lt: createdAtDate } },
          { createdAt: createdAtDate, _id: { $lt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const likeAgg = await ReactionModel.aggregate<PostReaction>([
      { $match: reactionMatchConditions },
      ...buildPostFieldEnrichmentStage(req.user, "target._id", "post"),
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: POST_PAGE_SIZE },
      { $project: { _id: 1, createdAt: 1, post: 1 } },
    ]);

    const lastLike = likeAgg[likeAgg.length - 1];
    const nextPageParam =
      likeAgg.length === POST_PAGE_SIZE && lastLike ? { _id: lastLike._id, createdAt: lastLike.createdAt } : null;

    res.status(200).json({ posts: likeAgg.map(like => like.post), nextPageParam });
  } catch (error) {
    handleControllerError("getLikedPosts", error, next);
  }
}

export async function getDislikedPosts(req: Request, res: Response<PostPage>, next: NextFunction) {
  try {
    const reactionMatchConditions: Record<string, any> = { user: req.user!._id, "target.type": "Post", type: "dislike" };

    const pageParam = req.query;

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.createdAt === "string"
    ) {
      const createdAtDate = new Date(pageParam.createdAt);
      if (!isNaN(createdAtDate.getTime())) {
        reactionMatchConditions.$or = [
          { createdAt: { $lt: createdAtDate } },
          { createdAt: createdAtDate, _id: { $lt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const dislikeAgg = await ReactionModel.aggregate<PostReaction>([
      { $match: reactionMatchConditions },
      ...buildPostFieldEnrichmentStage(req.user, "target._id", "post"),
      { $project: { _id: 1, createdAt: 1, post: 1 } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: POST_PAGE_SIZE },
    ]);

    const lastDislike = dislikeAgg[dislikeAgg.length - 1];
    const nextPageParam =
      dislikeAgg.length === POST_PAGE_SIZE && lastDislike ? { _id: lastDislike._id, createdAt: lastDislike.createdAt } : null;

    res.status(200).json({ posts: dislikeAgg.map(dislike => dislike.post), nextPageParam });
  } catch (error) {
    handleControllerError("getDislikedPosts", error, next);
  }
}

export async function getSavedPosts(req: Request, res: Response<PostPage>, next: NextFunction) {
  try {
    const savedMatchConditions: Record<string, any> = { user: req.user!._id, postCollection: null };

    const pageParam = req.query;

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.createdAt === "string"
    ) {
      const createdAtDate = new Date(pageParam.createdAt);
      if (!isNaN(createdAtDate.getTime())) {
        savedMatchConditions.$or = [
          { createdAt: { $lt: createdAtDate } },
          { createdAt: createdAtDate, _id: { $lt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const savedAgg = await PostSaveModel.aggregate<PostSave>([
      { $match: savedMatchConditions },
      ...buildPostFieldEnrichmentStage(req.user, "target._id", "post"),
      { $project: { _id: 1, createdAt: 1, post: 1 } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: POST_PAGE_SIZE },
    ]);

    const lastSaved = savedAgg[savedAgg.length - 1];

    const nextPageParam =
      savedAgg.length === POST_PAGE_SIZE && lastSaved ? { _id: lastSaved._id, createdAt: lastSaved.createdAt } : null;

    res.status(200).json({ posts: savedAgg.map(save => save.post), nextPageParam });
  } catch (error) {
    handleControllerError("getSavedPosts", error, next);
  }
}

export async function updateProfile(req: Request, res: Response<AuthUser>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["userFields"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const userFields = parseUpdateUserFields(req.body.userFields);

    const username = userFields.username.replace(/\s+/g, "");
    const fullname = userFields.fullname.trim();
    const bio = userFields.bio?.trim() ?? null;

    const newProfilePicture = req.file?.path;

    if (!username) {
      throw new ApiError(422, { message: "Username is required", code: ErrorCode.INVALID_INPUT });
    } else if (!fullname) {
      throw new ApiError(422, { message: "Full name is required", code: ErrorCode.INVALID_INPUT });
    } else if (await UserModel.exists({ username, _id: { $ne: req.user!._id } })) {
      throw new ApiError(409, { message: "Username already exists", code: ErrorCode.USERNAME_ALREADY_EXISTS });
    }

    const user = await UserModel.findOne({ _id: req.user!._id, deletedAt: null })
      .select("-_id profilePicture verified.profile")
      .lean<{ profilePicture: AuthUser["profilePicture"]; verified: { profile: boolean } }>();

    if (!user) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    }

    const prevProfilePicture = user.profilePicture?.originalUrl ?? null;

    const uploadRes = newProfilePicture
      ? await cloudinary.uploader.upload(newProfilePicture, {
          resource_type: "image",
          folder: `${process.env.DB_PREFIX}/users/${req.user!._id}/profile-picture`,
          quality: "auto:good",
          ...(user.verified.profile ? { width: 1200, height: 1200 } : { format: "jpg", width: 800, height: 800 }),
          crop: "fill",
          eager: {
            crop: "fill",
            gravity: "face",
            quality: "auto:good",
            ...(user.verified.profile ? { width: 300, height: 300 } : { format: "jpg", width: 150, height: 150 }),
          },
        })
      : null;

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: req.user!._id, deletedAt: null },
      {
        $set: {
          username,
          fullname,
          bio,
          profilePicture: userFields.removeProfilePicture
            ? null
            : uploadRes
            ? { originalUrl: uploadRes.secure_url, displayUrl: uploadRes.eager[0].secure_url }
            : prevProfilePicture,
        },
      },
      { new: true }
    ).lean<AuthUser>();

    if (!updatedUser) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    handleControllerError("updateProfile", error, next);
  }
}

export async function changeEmail(req: Request, res: Response<void>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["email"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const email = String(req.body.email).replace(/\s+/g, "");

    if (!/.+@.+\..+/.test(email)) {
      throw new ApiError(422, { message: "Invalid email", code: ErrorCode.INVALID_INPUT });
    } else if (await UserModel.exists({ email, _id: { $ne: req.user!._id } })) {
      throw new ApiError(409, { message: "Email already exists", code: ErrorCode.EMAIL_ALREADY_EXISTS });
    }

    const updateResult = await UserModel.updateOne(
      { _id: req.user!._id, deletedAt: null },
      { $set: { email, "verified.email": false } }
    );

    if (!updateResult.matchedCount) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    }

    res.status(204).end();
  } catch (error) {
    handleControllerError("changeEmail", error, next);
  }
}

export async function requestEmailVerification(req: Request, res: Response<void>, next: NextFunction) {
  try {
    const user = await UserModel.findOne({ _id: req.user!._id, deletedAt: null })
      .select("-_id email")
      .lean<Pick<AuthUser, "email">>();

    if (!user) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const result = await VerificationTokenModel.updateOne(
      { identifier: user.email, user: req.user!._id, type: "emailVerification" },
      {
        $set: { secret: hashedOtp, expiresAt: new Date(Date.now() + 1000 * 60 * 5), used: false },
        $setOnInsert: { identifier: user.email, user: req.user!._id, type: "emailVerification" },
      },
      { upsert: true }
    );

    if (!result.matchedCount && !result.upsertedCount) {
      throw new ApiError(500, { message: "Failed to send otp", code: ErrorCode.OTP_SEND_FAILED });
    }

    await sendEmailVerificationEmail(user.email, otp);

    res.status(204).end();
  } catch (error) {
    handleControllerError("requestEmailVerification", error, next);
  }
}

export async function verifyEmailOTP(req: Request, res: Response<void>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["otp"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const otp = String(req.body.otp).replace(/\s+/g, "");

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const token = await VerificationTokenModel.findOne({
      user: req.user!._id,
      secret: hashedOTP,
      expiresAt: { $gt: new Date() },
      used: false,
    })
      .select("identifier")
      .lean<Pick<VerificationToken, "_id" | "identifier">>();

    if (!token) {
      throw new ApiError(400, { message: "Invalid or expired OTP", code: ErrorCode.OTP_INVALID_OR_EXPIRED });
    }

    const [updateResult] = await Promise.all([
      UserModel.updateOne({ _id: req.user!._id, email: token.identifier, deletedAt: null }, { $set: { "verified.email": true } }),
      VerificationTokenModel.updateOne({ _id: token._id }, { $set: { used: true } }),
    ]);

    if (!updateResult.matchedCount) {
      throw new ApiError(500, { message: "Failed to verify email", code: ErrorCode.EMAIL_VERIFICATION_FAILED });
    }

    res.status(204).end();
  } catch (error) {
    handleControllerError("verifyEmailOTP", error, next);
  }
}

export async function changePassword(req: Request, res: Response<void>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["oldPassword", "newPassword"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const oldPassword = String(req.body.oldPassword).replace(/\s+/g, "");
    const newPassword = String(req.body.newPassword).replace(/\s+/g, "");

    if (newPassword.length < 6 || newPassword.length > 30) {
      throw new ApiError(422, { message: "Password must be 6 to 30 characters long", code: ErrorCode.INVALID_INPUT });
    }

    await withTransaction(async session => {
      const hashedPassword = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));

      const user = await UserModel.findOneAndUpdate(
        { _id: req.user!._id, deletedAt: null },
        { $set: { password: hashedPassword } },
        { session }
      )
        .select("-_id password")
        .lean<{ password: string }>();

      if (!user) {
        throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
      } else if (!(await bcrypt.compare(oldPassword, user.password))) {
        throw new ApiError(403, { message: "Incorrect old password", code: ErrorCode.INCORRECT_PASSWORD });
      }
    });

    const currentSessionId = req.headers["x-session-id"];
    await SessionModel.deleteMany({ user: req.user!._id, _id: { $ne: currentSessionId } });

    res.status(204).end();
  } catch (error) {
    handleControllerError("changePassword", error, next);
  }
}

export async function updatePrivacySettings(req: Request, res: Response<void>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["visibility", "showLikes", "taggable", "searchable"], false)) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const { visibility, showLikes, taggable, searchable } = req.body;

    const allowedUpdates: Record<string, any> = {};

    if (visibility === "public" || visibility === "private") {
      allowedUpdates["privacy.account.visibility"] = visibility;
    }
    if (typeof showLikes === "boolean") {
      allowedUpdates["privacy.showLikes"] = showLikes;
    }
    if (typeof taggable === "boolean") {
      allowedUpdates["privacy.account.taggable"] = taggable;
    }
    if (typeof searchable === "boolean") {
      allowedUpdates["privacy.account.searchable"] = searchable;
    }

    if (Object.keys(allowedUpdates).length) {
      await UserModel.updateOne({ _id: req.user!._id, deletedAt: null }, { $set: allowedUpdates });
    } else {
      throw new Error();
    }

    res.status(204).end();
  } catch (error) {
    handleControllerError("updatePrivacySettings", error, next);
  }
}

export async function deleteAccount(req: Request, res: Response<void>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["password"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const password = String(req.body.password).replace(/\s+/g, "");

    if (!password) {
      throw new ApiError(422, { message: "Password is required", code: ErrorCode.INVALID_INPUT });
    }

    const user = await UserModel.findOne({ _id: req.user!._id, deletedAt: null })
      .select("password email fullname")
      .lean<{ password: string; email: string; fullname: string }>();

    if (!user) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(403, { message: "Incorrect password", code: ErrorCode.INCORRECT_PASSWORD });
    }

    await UserModel.updateOne({ _id: req.user!._id, deletedAt: null }, { $set: { deletedAt: new Date() } });

    const { deleteUserCleanupQueue } = await import("@/queues/deleteUserCleanup.queue.js");
    await deleteUserCleanupQueue.add("deleteUserCleanup", { userId: String(req.user!._id) });

    await SessionModel.deleteMany({ user: req.user!._id });

    res.status(204).end();

    sendAccountDeletionEmail(user.email, user.fullname).catch(error =>
      logApiError("Failed to send account deletion email:", error)
    );
  } catch (error) {
    handleControllerError("deleteUser", error, next);
  }
}
