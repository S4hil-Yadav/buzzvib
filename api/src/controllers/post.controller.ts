import { ApiError, ErrorCode, handleControllerError } from "@/lib/error.js";
import PostModel from "@/models/post.model.js";
import NotificationModel from "@/models/notification.model.js";
import ReactionModel from "@/models/reaction.model.js";
import { NextFunction, Request, Response } from "express";
import type { Post, User, PostPage, Reaction, UserAccountVisibility } from "types";
import SaveModel from "@/models/save.model.js";
import mongoose from "mongoose";
import { createPostQueue } from "@/queues/createPost.queue.js";
import { buildPostEnrichmentStages, buildSearchPostStage } from "@/utils/aggregate.utils.js";
import UserModel from "@/models/user.model.js";
import { withTransaction } from "@/utils/db.utils.js";
import { parsePostPayload } from "@/utils/parse.utils.js";
import { isValidReqBody } from "@/utils/typeGuard.utils.js";
import FollowModel from "@/models/follow.model.js";
import { POST_PAGE_SIZE } from "@/config/constants.js";
import { deletePostQueue } from "@/queues/deletePost.queue.js";

export async function createPost(req: Request, res: Response<void>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["post"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const post = parsePostPayload(req.body.post);
    const title = post.title.trim() || null;
    const text = post.text.trim() || null;

    const files = req.files;

    if (
      !Array.isArray(files) ||
      files.some(
        f =>
          typeof f !== "object" ||
          typeof f.mimetype !== "string" ||
          !(f.mimetype.startsWith("image/") || f.mimetype.startsWith("video/"))
      )
    ) {
      throw new ApiError(400, { message: "Invalid file payload", code: ErrorCode.INVALID_FILE_PAYLOAD });
    }

    if (!title && !text && !files.length) {
      throw new ApiError(400, { message: "Post can't be empty", code: ErrorCode.INVALID_INPUT });
    }

    await createPostQueue.add(
      "newPost",
      { authorId: req.user!._id.toString(), title, text, files },
      { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: true, removeOnFail: false }
    );

    res.status(201).end();
  } catch (error) {
    handleControllerError("createPost", error, next);
  }
}

/*
*post_search (Dynamic field mappings)
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": {
        "type": "autocomplete"
      },
      "body": {
        "type": "string"
      },
      "hashtags": {
        "type": "autocomplete"
      }
    }
  }
}
*/
export async function searchPosts(req: Request, res: Response<PostPage>, next: NextFunction) {
  try {
    const { searchTerm } = req.query;
    const pageParam = { _id: req.query._id, createdAt: req.query.createdAt };

    if (!searchTerm || typeof searchTerm !== "string") {
      throw new ApiError(400, { message: "Invalid input", code: ErrorCode.INVALID_INPUT });
    }

    const postMatchConditions: Record<string, any> = { deletedAt: null };

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
      ...buildSearchPostStage(searchTerm),
      { $match: postMatchConditions },
      ...buildPostEnrichmentStages(req.user),
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: POST_PAGE_SIZE },
    ]);

    const lastPost = posts[posts.length - 1];

    const nextPageParam =
      posts.length === POST_PAGE_SIZE && lastPost ? { _id: lastPost._id, createdAt: lastPost.createdAt } : null;

    res.status(200).json({ posts, nextPageParam });
  } catch (error) {
    handleControllerError("searchPosts", error, next);
  }
}

export async function getPosts(req: Request, res: Response<PostPage>, next: NextFunction) {
  try {
    const pageParam = req.query;
    const postMatchConditions: Record<string, any> = { ...(req.user ? { author: { $ne: req.user?._id } } : {}), deletedAt: null };

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
      ...buildPostEnrichmentStages(req.user),
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: POST_PAGE_SIZE },
    ]);

    const lastPost = posts[posts.length - 1];
    const nextPageParam =
      posts.length === POST_PAGE_SIZE && lastPost ? { _id: lastPost._id, createdAt: lastPost.createdAt } : null;

    res.status(200).json({ posts, nextPageParam });
  } catch (error) {
    handleControllerError("getPosts", error, next);
  }
}

export async function getPost(req: Request<{ postId: string }>, res: Response<Post>, next: NextFunction) {
  try {
    const { postId: rawPostId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawPostId)) {
      throw new ApiError(400, { message: "Invalid post id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const postId = new mongoose.Types.ObjectId(rawPostId);

    const post = await PostModel.findOne({ _id: postId })
      .populate({
        path: "author",
        match: { deletedAt: null },
        select: "_id username fullname profilePicture verified.profile privacy.account.visibility",
      })
      .lean<Post>();

    const isPrivate = post?.author?.privacy.account.visibility === "private";
    delete post?.author?.privacy;

    if (!post) {
      throw new ApiError(404, { message: "Post not found", code: ErrorCode.POST_NOT_FOUND });
    } else if (
      post.author &&
      isPrivate &&
      (!req.user ||
        (String(post.author._id) !== String(req.user._id) &&
          !(await FollowModel.exists({
            follower: req.user._id,
            following: post.author._id,
            status: "accepted",
          }))))
    ) {
      throw new ApiError(403, { message: "Unauthorized to view private user's post", code: ErrorCode.PRIVATE_USER });
    } else if (
      req.user &&
      post.author &&
      String(req.user._id) !== String(post.author._id) &&
      (await FollowModel.exists({
        $or: [
          { follower: req.user._id, following: post.author._id, status: "blocked" },
          { follower: post.author._id, following: req.user._id, status: "blocked" },
        ],
      }))
    ) {
      throw new ApiError(403, { message: "Access denied due to block relationship", code: ErrorCode.BLOCKED_USER });
    }

    const [userReaction, saveDoc] =
      req.user && !post.deletedAt
        ? await Promise.all([
            ReactionModel.findOne({ "target._id": postId, user: req.user._id })
              .select("type")
              .lean<{ type: "like" | "dislike" }>(),
            SaveModel.findOne({ post: postId, user: req.user._id, saveCollection: null })
              .select("createdAt")
              .lean<{ createdAt: Date }>(),
          ])
        : [null, null];

    post.reaction = userReaction?.type ?? null;
    post.savedAt = saveDoc?.createdAt ?? null;

    if (post.deletedAt) {
      post.author = null;
      post.title = null;
      post.text = null;
      post.media = [];
      post.count = { reactions: { like: 0, dislike: 0 }, comments: 0 };
    }

    res.status(200).json(post);
  } catch (error) {
    handleControllerError("getPost", error, next);
  }
}

export async function togglePostReaction(req: Request<{ postId: string }>, res: Response<void>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["reactionType"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const { reactionType } = req.body;
    const { postId: rawPostId } = req.params;

    if (typeof reactionType !== "string") {
      throw new ApiError(400, { message: "Invalid reaction type", code: ErrorCode.INVALID_REACTION_TYPE });
    } else if (!mongoose.Types.ObjectId.isValid(rawPostId)) {
      throw new ApiError(400, { message: "Invalid post id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const postId = new mongoose.Types.ObjectId(rawPostId);

    const post = await PostModel.findOne({ _id: postId })
      .select("-_id author")
      .populate({ path: "author", select: "_id privacy.account.visibility", match: { deletedAt: null } })
      .lean<{ author: UserAccountVisibility | null }>();

    if (!post || !post.author) {
      throw new ApiError(404, { message: "Post not found", code: ErrorCode.POST_NOT_FOUND });
    } else if (
      post.author?.privacy.account.visibility === "private" &&
      String(post.author._id) !== String(req.user!._id) &&
      !(await FollowModel.exists({ follower: req.user!._id, following: post.author._id, status: "accepted" }))
    ) {
      throw new ApiError(403, { message: "Can't react to comments of a private user's post", code: ErrorCode.PRIVATE_USER });
    } else if (
      post.author &&
      String(req.user!._id) !== String(post.author._id) &&
      (await FollowModel.exists({
        $or: [
          { follower: req.user!._id, following: post.author._id, status: "blocked" },
          { follower: post.author._id, following: req.user!._id, status: "blocked" },
        ],
      }))
    ) {
      throw new ApiError(403, { message: "Can't react due to a block relationship", code: ErrorCode.BLOCKED_USER });
    }

    const authorId = post.author._id;

    await withTransaction(async session => {
      const isReacting = ["like", "dislike"].includes(reactionType);

      const previousReaction = isReacting
        ? await ReactionModel.findOneAndUpdate(
            { user: req.user!._id, "target._id": postId },
            {
              $set: { type: reactionType, createdAt: new Date() },
              $setOnInsert: { user: req.user!._id, target: { _id: postId, type: "Post" } },
            },
            { upsert: true, new: false, session }
          )
            .select("type")
            .lean<Pick<Reaction, "type">>()
        : await ReactionModel.findOneAndDelete({ user: req.user!._id, "target._id": postId }, { session })
            .select("type")
            .lean<Pick<Reaction, "type">>();

      const inc: Record<string, number> = {};

      if (previousReaction && previousReaction.type !== reactionType) {
        const field = `count.reactions.${previousReaction.type}`;
        inc[field] = (inc[field] ?? 0) - 1;
      }

      if (isReacting && reactionType !== previousReaction?.type) {
        const field = `count.reactions.${reactionType}`;
        inc[field] = (inc[field] ?? 0) + 1;
      }

      const ops: Promise<any>[] = [];

      if (Object.keys(inc).length > 0) {
        ops.push(PostModel.updateOne({ _id: postId }, { $inc: inc }, { session }));
      }

      if (reactionType === "like" && String(authorId) !== String(req.user!._id)) {
        ops.push(
          NotificationModel.findOneAndUpdate(
            {
              sender: req.user!._id,
              receiver: authorId,
              type: "postLike",
              "target.post": postId,
              createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
            },
            {
              $setOnInsert: {
                sender: req.user!._id,
                receiver: authorId,
                type: "postLike",
                target: { post: postId, comment: null },
                createdAt: new Date(),
              },
            },
            { upsert: true, new: false, session }
          )
        );
      }

      await Promise.all(ops);
    });

    res.status(204).end();
  } catch (error) {
    handleControllerError("togglePostReaction", error, next);
  }
}

export async function togglePostSave(req: Request<{ postId: string }>, res: Response<Pick<Post, "savedAt">>, next: NextFunction) {
  try {
    const { postId: rawPostId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawPostId)) {
      throw new ApiError(400, { message: "Invalid post id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const postId = new mongoose.Types.ObjectId(rawPostId);

    const savedAt = await withTransaction(async session => {
      const deleteResult = await SaveModel.deleteOne({ user: req.user!._id, "target._id": postId }).session(session);

      if (deleteResult.deletedCount) {
        return null;
      } else {
        const [postExists, saveDocArr] = await Promise.all([
          PostModel.exists({ _id: postId, deletedAt: null }),
          SaveModel.create([{ user: req.user!._id, target: { _id: postId, type: "Post" } }], { session }),
        ]);

        if (!postExists) {
          throw new ApiError(400, { message: "Post not found", code: ErrorCode.POST_NOT_FOUND });
        }

        return saveDocArr[0].createdAt;
      }
    });

    res.status(200).json({ savedAt });
  } catch (error) {
    handleControllerError("togglePostSave", error, next);
  }
}

export async function deletePost(req: Request<{ postId: string }>, res: Response<void>, next: NextFunction) {
  try {
    const { postId: rawPostId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawPostId)) {
      throw new ApiError(400, { message: "Invalid post id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const postId = new mongoose.Types.ObjectId(rawPostId);

    await withTransaction(async session => {
      const [post, updateResult] = await Promise.all([
        PostModel.findOneAndUpdate({ _id: postId, deletedAt: null }, { $set: { deletedAt: new Date() } }, { session })
          .select("_id author")
          .lean<{ _id: Post["_id"]; author: User["_id"] }>(),
        UserModel.updateOne({ _id: req.user!._id }, { $inc: { "count.posts": -1 } }, { session }),
      ]);

      if (!post) {
        throw new ApiError(404, { message: "Post not found", code: ErrorCode.POST_NOT_FOUND });
      } else if (String(post.author) !== String(req.user!._id)) {
        throw new ApiError(403, { message: "Unauthorized to delete other user's post", code: ErrorCode.FORBIDDEN });
      } else if (!updateResult.matchedCount) {
        throw new ApiError(500, { message: "Failed to change post count", code: ErrorCode.INTERNAL_ERROR });
      }

      await deletePostQueue.add(
        "newPost",
        { postId: postId.toString() },
        { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: true, removeOnFail: false }
      );
    });

    res.status(204).end();
  } catch (error) {
    handleControllerError("deletePost", error, next);
  }
}
