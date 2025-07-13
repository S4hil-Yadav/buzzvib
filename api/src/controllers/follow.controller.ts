import UserModel from "@/models/user.model.js";
import { ApiError, ErrorCode, handleControllerError } from "@/lib/error.js";
import NotificationModel from "@/models/notification.model.js";
import FollowModel, { type IFollow } from "@/models/follow.model.js";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import type { FollowRequestPage, FollowStatus, User, FollowStatuses, Block, BlockPage, FollowRequest } from "types";
import { buildUserFieldEnrichmentStage } from "@/utils/aggregate.utils.js";
import { withTransaction } from "@/utils/db.utils.js";
import { FOLLOW_REQUEST_PAGE_SIZE, FOLLOW_STATUS_PAGE_SIZE } from "@/config/constants.js";

export async function createFollow(
  req: Request<{ followingId: string }>,
  res: Response<{ _id: FollowRequest["_id"]; followingStatus: "requested" | "accepted" }>,
  next: NextFunction
) {
  try {
    const { followingId: rawFollowingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawFollowingId)) {
      throw new ApiError(404, { message: "Invalid user id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const followingId = new mongoose.Types.ObjectId(rawFollowingId);

    const following = await UserModel.findOne({ _id: followingId, deletedAt: null })
      .select("_id privacy.account.visibility")
      .lean<{ _id: User["_id"]; privacy: { account: { visibility: "public" | "private" } } }>();

    if (!following) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    }

    const follow = await FollowModel.findOne({ follower: req.user!._id, following: followingId })
      .select("-_id status")
      .lean<{ status: "requested" | "accepted" | "blocked" }>();

    if (follow?.status === "blocked") {
      throw new ApiError(400, { message: "You have been blocked by this user", code: ErrorCode.BLOCKED_USER });
    } else if (follow?.status === "requested") {
      throw new ApiError(400, { message: "Request already pending", code: ErrorCode.REQUEST_ALREADY_PENDING });
    } else if (follow?.status === "accepted") {
      throw new ApiError(400, { message: "Already following", code: ErrorCode.ALREADY_FOLLOWING });
    }

    const isPublic = following.privacy.account.visibility === "public";

    const followId = await withTransaction(async session => {
      const followDoc = new FollowModel({
        follower: req.user!._id,
        following: followingId,
        status: isPublic ? "accepted" : "requested",
      });

      const ops: Promise<any>[] = [followDoc.save({ session })];

      if (isPublic) {
        ops.push(
          UserModel.updateOne({ _id: followingId }, { $inc: { "count.followers": 1 } }, { session }),
          UserModel.updateOne({ _id: req.user!._id }, { $inc: { "count.following": 1 } }, { session }),
          NotificationModel.create([{ sender: req.user!._id, receiver: followingId, type: "newFollower" }], { session })
        );
      }

      await Promise.all(ops);
      return followDoc._id;
    });

    res.status(200).json({ _id: followId, followingStatus: isPublic ? "accepted" : "requested" });
  } catch (error) {
    handleControllerError("createFollow", error, next);
  }
}

export async function removeFollow(req: Request<{ followingId: string }>, res: Response<void>, next: NextFunction) {
  try {
    const { followingId: rawFollowingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawFollowingId)) {
      throw new ApiError(404, { message: "Invalid user id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const followingId = new mongoose.Types.ObjectId(rawFollowingId);

    await withTransaction(async session => {
      const follow = await FollowModel.findOneAndDelete(
        {
          follower: req.user!._id,
          following: followingId,
          status: { $in: ["requested", "accepted"] },
        },
        { session, new: false }
      )
        .select("_id status")
        .lean<Pick<IFollow, "_id" | "status">>();

      if (!follow) {
        throw new ApiError(404, { message: "Follow instance not found", code: ErrorCode.FOLLOW_INSTANCE_NOT_FOUND });
      }

      if (follow.status === "accepted") {
        await Promise.all([
          UserModel.updateOne({ _id: followingId }, { $inc: { "count.followers": -1 } }, { session }),
          UserModel.updateOne({ _id: req.user!._id }, { $inc: { "count.following": -1 } }, { session }),
          NotificationModel.deleteOne(
            {
              receiver: followingId,
              sender: req.user!._id,
              type: "newFollower",
              createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
              seenAt: null,
            },
            { session }
          ),
        ]);
      }
    });

    res.status(204).end();
  } catch (error) {
    handleControllerError("removeFollow", error, next);
  }
}

export async function blockFollow(req: Request<{ followingId: string }>, res: Response<Pick<Block, "_id">>, next: NextFunction) {
  try {
    const { followingId: rawFollowingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawFollowingId)) {
      throw new ApiError(404, { message: "Invalid user id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const followingId = new mongoose.Types.ObjectId(rawFollowingId);

    const blockDocId = await withTransaction(async session => {
      const [userExists, oldFollowingDoc, oldFollowerDoc] = await Promise.all([
        UserModel.exists({ _id: followingId, deletedAt: null }),
        FollowModel.findOne({ follower: req.user!._id, following: followingId })
          .session(session)
          .select("-_id status")
          .lean<{ status: "requested" | "accepted" | "blocked" }>(),
        FollowModel.findOneAndDelete({ follower: followingId, following: req.user!._id, status: { $ne: "blocked" } }, { session })
          .select("-_id status")
          .lean<{ status: "requested" | "accepted" | "blocked" }>(),
      ]);

      if (!userExists) {
        throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
      } else if (oldFollowingDoc?.status === "blocked") {
        throw new ApiError(400, { message: "Already blocked", code: ErrorCode.ALREADY_BLOCKED });
      }

      const op: Promise<any>[] = [
        FollowModel.findOneAndUpdate(
          { follower: req.user!._id, following: followingId },
          {
            $set: { status: "blocked", createdAt: new Date() },
            $setOnInsert: { follower: req.user!._id, following: followingId },
          },
          { upsert: true, new: true, session }
        ),
      ];

      if (oldFollowingDoc?.status === "accepted" || oldFollowerDoc?.status === "accepted") {
        op.push(
          UserModel.updateOne(
            { _id: followingId },
            {
              $inc: {
                "count.followers": oldFollowingDoc?.status === "accepted" ? -1 : 0,
                "count.following": oldFollowerDoc?.status === "accepted" ? -1 : 0,
              },
            },
            { session }
          ),
          UserModel.updateOne(
            { _id: req.user!._id },
            {
              $inc: {
                "count.followers": oldFollowerDoc?.status === "accepted" ? -1 : 0,
                "count.following": oldFollowingDoc?.status === "accepted" ? -1 : 0,
              },
            },
            { session }
          )
        );
      }

      const [newBlockedDoc] = await Promise.all(op);
      return newBlockedDoc._id;
    });

    res.status(200).json({ _id: blockDocId });
  } catch (error) {
    handleControllerError("blockFollow", error, next);
  }
}

export async function unblockFollow(req: Request<{ followingId: string }>, res: Response<void>, next: NextFunction) {
  try {
    const { followingId: rawFollowingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawFollowingId)) {
      throw new ApiError(404, { message: "Invalid user id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const followingId = new mongoose.Types.ObjectId(rawFollowingId);

    await withTransaction(async session => {
      const [userExists] = await Promise.all([
        UserModel.exists({ _id: followingId, deletedAt: null }).session(session),
        FollowModel.deleteOne({ follower: req.user!._id, following: followingId, status: "blocked" }, { session }),
      ]);

      if (!userExists) {
        throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
      }
    });

    res.status(204).end();
  } catch (error) {
    handleControllerError("unblockFollow", error, next);
  }
}

export async function removeFollower(req: Request<{ followerId: string }>, res: Response<void>, next: NextFunction) {
  try {
    const { followerId: rawFollowerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawFollowerId)) {
      throw new ApiError(404, { message: "Invalid user id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const followerId = new mongoose.Types.ObjectId(rawFollowerId);

    await withTransaction(async session => {
      const [deleteResult] = await Promise.all([
        FollowModel.deleteOne({ follower: followerId, following: req.user!._id, status: "accepted" }, { session }),
        UserModel.updateOne({ _id: req.user!._id }, { $inc: { "count.followers": -1 } }, { session }),
        UserModel.updateOne({ _id: followerId }, { $inc: { "count.following": -1 } }, { session }),
      ]);

      if (!deleteResult.deletedCount) {
        throw new ApiError(404, { message: "Follow instance not found", code: ErrorCode.FOLLOW_INSTANCE_NOT_FOUND });
      }
    });

    res.status(204).end();
  } catch (error) {
    handleControllerError("removeFollower", error, next);
  }
}

export async function acceptFollowRequest(req: Request<{ followerId: string }>, res: Response<void>, next: NextFunction) {
  try {
    const { followerId: rawFollowerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawFollowerId)) {
      throw new ApiError(404, { message: "Invalid user id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const followerId = new mongoose.Types.ObjectId(rawFollowerId);

    await withTransaction(async session => {
      const [updateResult, senderExists] = await Promise.all([
        FollowModel.updateOne(
          { follower: followerId, following: req.user!._id, status: "requested" },
          { $set: { status: "accepted", createdAt: new Date() } },
          { session }
        ),
        UserModel.exists({ _id: followerId, deletedAt: null }).session(session),
      ]);

      if (!updateResult.matchedCount) {
        throw new ApiError(404, { message: "Request not found", code: ErrorCode.FOLLOW_INSTANCE_NOT_FOUND });
      } else if (!senderExists) {
        throw new ApiError(404, { message: "Sender not found", code: ErrorCode.USER_NOT_FOUND });
      }

      await Promise.all([
        NotificationModel.create([{ sender: req.user!._id, receiver: followerId, type: "followAccepted" }], { session }),
        UserModel.updateOne({ _id: req.user!._id }, { $inc: { "count.followers": 1 } }, { session }),
        UserModel.updateOne({ _id: followerId }, { $inc: { "count.following": 1 } }, { session }),
      ]);
    });

    res.status(204).end();
  } catch (error) {
    handleControllerError("acceptFollowRequest", error, next);
  }
}

export async function rejectFollowRequest(req: Request<{ followerId: string }>, res: Response<void>, next: NextFunction) {
  try {
    const { followerId: rawFollowerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawFollowerId)) {
      throw new ApiError(404, { message: "Invalid user id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const followerId = new mongoose.Types.ObjectId(rawFollowerId);

    const deleteResult = await FollowModel.deleteOne({ follower: followerId, following: req.user!._id, status: "requested" });

    if (!deleteResult.deletedCount) {
      throw new ApiError(404, { message: "Request not found", code: ErrorCode.FOLLOW_INSTANCE_NOT_FOUND });
    }

    res.status(204).end();
  } catch (error) {
    handleControllerError("rejectFollowRequest", error, next);
  }
}

export async function getFollowerRequests(req: Request, res: Response<FollowRequestPage>, next: NextFunction) {
  try {
    const followRequestMatchConditions: Record<string, any> = { following: req.user!._id, status: "requested" };

    const pageParam = req.query;

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.createdAt === "string"
    ) {
      const createdAtDate = new Date(pageParam.createdAt);
      if (!isNaN(createdAtDate.getTime())) {
        followRequestMatchConditions.$or = [
          { createdAt: { $lt: createdAtDate } },
          { createdAt: createdAtDate, _id: { $lt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const followerRequests = await FollowModel.aggregate<Block>([
      { $match: followRequestMatchConditions },
      ...buildUserFieldEnrichmentStage(req.user, "follower", "user"),
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: FOLLOW_REQUEST_PAGE_SIZE },
      { $project: { _id: 1, seenAt: 1, createdAt: 1, user: 1 } },
    ]);

    const lastRequest = followerRequests[followerRequests.length - 1];

    const nextPageParam =
      followerRequests.length === FOLLOW_REQUEST_PAGE_SIZE && lastRequest
        ? {
            _id: lastRequest._id,
            createdAt: lastRequest.createdAt,
          }
        : null;

    res.status(200).json({ followRequests: followerRequests, nextPageParam });
  } catch (error) {
    handleControllerError("getFollowerRequests", error, next);
  }
}

export async function getFollowingRequests(req: Request, res: Response<FollowRequestPage>, next: NextFunction) {
  try {
    const followingRequestMatchConditions: Record<string, any> = { follower: req.user!._id, status: "requested" };

    const pageParam = req.query;

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.createdAt === "string"
    ) {
      const createdAtDate = new Date(pageParam.createdAt);
      if (!isNaN(createdAtDate.getTime())) {
        followingRequestMatchConditions.$or = [
          { createdAt: { $lt: createdAtDate } },
          { createdAt: createdAtDate, _id: { $lt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const followingRequests = await FollowModel.aggregate<Block>([
      { $match: followingRequestMatchConditions },
      ...buildUserFieldEnrichmentStage(req.user, "following", "user"),
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: FOLLOW_REQUEST_PAGE_SIZE },
      { $project: { _id: 1, createdAt: 1, user: 1 } },
    ]);

    const lastRequest = followingRequests[followingRequests.length - 1];
    const nextPageParam =
      followingRequests.length === FOLLOW_REQUEST_PAGE_SIZE && lastRequest
        ? {
            _id: lastRequest._id,
            createdAt: lastRequest.createdAt,
          }
        : null;

    res.status(200).json({ followRequests: followingRequests, nextPageParam });
  } catch (error) {
    handleControllerError("getFollowingRequests", error, next);
  }
}

export async function getBlockedUserDocs(req: Request, res: Response<BlockPage>, next: NextFunction) {
  try {
    const blockedMatchConditions: Record<string, any> = { follower: req.user!._id, status: "blocked" };

    const pageParam = req.query;

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.createdAt === "string"
    ) {
      const createdAtDate = new Date(pageParam.createdAt);
      if (!isNaN(createdAtDate.getTime())) {
        blockedMatchConditions.$or = [
          { createdAt: { $lt: createdAtDate } },
          { createdAt: createdAtDate, _id: { $lt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const blockedUserDocs = await FollowModel.aggregate<Block>([
      { $match: blockedMatchConditions },
      ...buildUserFieldEnrichmentStage(req.user, "following", "user"),
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: FOLLOW_REQUEST_PAGE_SIZE },
      { $project: { _id: 1, createdAt: 1, user: 1 } },
    ]);

    const lastRequest = blockedUserDocs[blockedUserDocs.length - 1];
    const nextPageParam =
      blockedUserDocs.length === FOLLOW_REQUEST_PAGE_SIZE && lastRequest
        ? { _id: lastRequest._id, createdAt: lastRequest.createdAt }
        : null;

    res.status(200).json({ blockedUserDocs, nextPageParam });
  } catch (error) {
    handleControllerError("getBlockedUserDocs", error, next);
  }
}

export async function getFollowStatus(req: Request, res: Response<FollowStatus>, next: NextFunction) {
  try {
    const username = String(req.query.username);

    const user = await UserModel.findOne({ username, deletedAt: null }).select("_id").lean<Pick<User, "_id">>();

    if (!user) {
      throw new ApiError(404, { message: "User not found", code: ErrorCode.USER_NOT_FOUND });
    }

    const [followerStatus, followingStatus] = await Promise.all([
      FollowModel.findOne({ follower: user._id, following: req.user!._id })
        .select("-_id status")
        .lean<{ status: "requested" | "accepted" | "blocked" }>(),
      FollowModel.findOne({ follower: req.user!._id, following: user._id })
        .select("_id status")
        .lean<{ status: "requested" | "accepted" | "blocked" }>(),
    ]);

    const followStatus: FollowStatus = {
      followerStatus: followerStatus?.status ?? null,
      followingStatus: followingStatus?.status ?? null,
    };

    res.status(200).json(followStatus);
  } catch (error) {
    handleControllerError("getFollowStatus", error, next);
  }
}

export async function getFollowStatuses(req: Request, res: Response<FollowStatuses>, next: NextFunction) {
  try {
    const rawIds = req.query.userIds;

    if (typeof rawIds !== "string") {
      throw new ApiError(400, { message: "Invalid user ids", code: ErrorCode.INVALID_IDS });
    }

    const userIds = rawIds
      .split(",")
      .filter(userId => mongoose.Types.ObjectId.isValid(userId))
      .map(userId => new mongoose.Types.ObjectId(userId));

    if (userIds.length > FOLLOW_STATUS_PAGE_SIZE) {
      throw new ApiError(400, {
        message: `Can't batch more than ${FOLLOW_STATUS_PAGE_SIZE} requests`,
        code: ErrorCode.BATCH_LIMIT_EXCEEDED,
      });
    }

    const followAgg = await FollowModel.aggregate<{
      username: User["username"];
      followerStatus: "accepted" | "requested";
      followingStatus: "accepted" | "requested";
    }>([
      {
        $facet: {
          followerStatuses: [
            { $match: { follower: { $in: userIds }, following: req.user!._id } },
            {
              $lookup: {
                from: "users",
                let: { userId: "$follower" },
                pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ["$_id", "$$userId"] }, { $eq: ["$deletedAt", null] }] } } },
                  { $project: { _id: 0, username: 1 } },
                ],
                as: "user",
              },
            },
            { $unwind: "$user" },
            { $project: { _id: 0, username: "$user.username", followerStatusArr: "$status" } },
          ],
          followingStatuses: [
            { $match: { follower: req.user!._id, following: { $in: userIds } } },
            {
              $lookup: {
                from: "users",
                let: { userId: "$following" },
                pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ["$_id", "$$userId"] }, { $eq: ["$deletedAt", null] }] } } },
                  { $project: { _id: 0, username: 1 } },
                ],
                as: "user",
              },
            },
            { $unwind: "$user" },
            { $project: { _id: 0, username: "$user.username", followingStatusArr: "$status" } },
          ],
        },
      },
      { $project: { merged: { $concatArrays: ["$followerStatuses", "$followingStatuses"] } } },
      { $unwind: "$merged" },
      {
        $group: {
          _id: "$merged.username",
          followerStatusArrs: { $push: "$merged.followerStatusArr" },
          followingStatusArrs: { $push: "$merged.followingStatusArr" },
        },
      },
      {
        $project: {
          _id: 0,
          username: "$_id",
          followerStatus: {
            $first: {
              $filter: {
                input: "$followerStatusArrs",
                cond: { $ne: ["$$this", null] },
              },
            },
          },
          followingStatus: {
            $first: {
              $filter: {
                input: "$followingStatusArrs",
                cond: { $ne: ["$$this", null] },
              },
            },
          },
        },
      },
    ]);

    const followStatuses: FollowStatuses = Object.fromEntries(
      followAgg.map(({ username, followerStatus, followingStatus }) => [username, { followerStatus, followingStatus }])
    );

    res.status(200).json(followStatuses);
  } catch (error) {
    handleControllerError("getFollowStatuses", error, next);
  }
}

export async function seeAllFollowerRequests(req: Request, res: Response<void>, next: NextFunction) {
  try {
    await FollowModel.updateMany(
      { following: req.user!._id, status: "requested", seenAt: null },
      { $set: { seenAt: new Date() } }
    );

    res.status(204).end();
  } catch (error) {
    handleControllerError("seeAllFollowerRequests", error, next);
  }
}
