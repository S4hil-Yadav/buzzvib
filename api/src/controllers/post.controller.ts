import { ApiError, ErrorCode, handleControllerError } from "@/lib/error.js";
import PostModel from "@/models/post.model.js";
import NotificationModel from "@/models/notification.model.js";
import ReactionModel from "@/models/reaction.model.js";
import { NextFunction, Request, Response } from "express";
import type { Post, User, PostPage, Reaction, UserAccountVisibility, Media } from "types";
import SaveModel from "@/models/save.model.js";
import mongoose from "mongoose";
import { buildPostEnrichmentStages, buildSearchPostStage } from "@/utils/aggregate.js";
import UserModel from "@/models/user.model.js";
import { withTransaction } from "@/utils/db.js";
import { parseFileMetaPayload, parsePostPayload } from "@/utils/parse.js";
import { isValidReqBody } from "@/utils/typeGuard.js";
import FollowModel from "@/models/follow.model.js";
import { POST_PAGE_SIZE } from "@/config/constants.js";
import { deletePostCleanupQueue } from "@/queues/deletePostCleanup.queue.js";
import cloudinary from "@/lib/cloudinary.js";
import { notifyFollowersQueue } from "@/queues/notifyFollowers.queue.js";
import { getSocketIOInstance } from "@/sockets/ioInstance.js";
import { hasInvalidFile } from "@/utils/fileValidation.js";

export async function createPost(req: Request, res: Response<Pick<Post, "_id" | "status">>, next: NextFunction) {
  try {
    const io = getSocketIOInstance();

    if (!isValidReqBody(req.body, ["post"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const postPayload = parsePostPayload(req.body.post);

    const title = postPayload.title?.trim() || null;
    const text = postPayload.text?.trim() || null;
    const hashtags = text?.match(/#\w+/g)?.map(tag => tag.slice(1).toLowerCase()) ?? [];

    const files = req.files;

    if (!Array.isArray(files) || (await hasInvalidFile(files))) {
      throw new ApiError(400, { message: "Invalid file payload", code: ErrorCode.INVALID_FILE_PAYLOAD });
    } else if (!title && !text && !files.length) {
      throw new ApiError(400, { message: "Post can't be empty", code: ErrorCode.INVALID_INPUT });
    }

    const status = files.length ? "processing" : "published";

    const postId = await withTransaction(async session => {
      const [postArr] = await Promise.all([
        PostModel.create([{ author: req.user!._id, title, text, hashtags, status }], {
          session,
        }),
        UserModel.updateOne({ _id: req.user!._id }, { $inc: { "count.posts": 1 } }, { session }),
      ]);

      return postArr[0]._id;
    });

    res.status(201).json({ _id: postId, status });

    notifyFollowersQueue
      .add(
        "newPost",
        { authorId: req.user!._id.toString(), postId: postId.toString() },
        { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: true, removeOnFail: false }
      )
      .catch(error => logApiError("Failed to add to notifyFollowersQueue:", error));

    if (!files.length) return;

    try {
      const media: Media[] = [];

      for (const f of files) {
        const resourceType = f.mimetype.startsWith("image/") ? "image" : "video";

        await cloudinary.uploader
          .upload(f.path, {
            resource_type: resourceType,
            folder: `${process.env.DB_PREFIX}/posts/${postId}`,
            quality: "auto:good",
            fetch_format: "auto",
            flags: f.mimetype === "image/gif" ? "lossy" : "progressive",
            eager: [
              {
                format: f.mimetype === "image/gif" ? "gif" : "jpg",
                quality: "auto:good",
                fetch_format: "auto",
                flags: f.mimetype === "image/gif" ? "lossy" : "progressive",
              },
            ],
          })
          .then(res => {
            media.push({ type: resourceType, originalUrl: res.secure_url, displayUrl: res.eager[0].secure_url });
            io.to(String(req.user!._id)).emit("post-media", { postId: postId, media, status: "processing" });
          })
          .catch(error => {
            io.to(String(req.user!._id)).emit("post-media:error", `Failed to upload file ${f.originalname}`);
            logApiError("Failed to upload file", f, error);
          });
      }

      if (media.length) {
        await PostModel.updateOne({ _id: postId }, { $set: { media, status: "published" } });
      } else {
        throw new Error("Failed to upload any media item");
      }

      io.to(String(req.user!._id)).emit("post-media", { postId: postId, media, status: "published" });
    } catch (error) {
      logApiError("Background processing error in createPost:", error);

      io.to(String(req.user!._id)).emit("post-media", { postId: postId, media: [], status: "failed" });

      Promise.all([PostModel.updateOne({ _id: postId }, { $set: { status: "failed" } })]).catch(error =>
        logApiError("Background processing error handler error in createPost:", error)
      );
    }
  } catch (error) {
    handleControllerError("createPost", error, next);
  }
}

export async function editPost(req: Request<{ postId: string }>, res: Response<Pick<Post, "status">>, next: NextFunction) {
  try {
    const io = getSocketIOInstance();
    const { postId: rawPostId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawPostId)) {
      throw new ApiError(400, { message: "Invalid post id", code: ErrorCode.INVALID_OBJECT_ID });
    } else if (!isValidReqBody(req.body, ["post", "fileMeta"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const postId = new mongoose.Types.ObjectId(rawPostId);
    const postPayload = parsePostPayload(req.body.post);
    const fileMeta = parseFileMetaPayload(req.body.fileMeta);

    const title = postPayload.title?.trim() || null;
    const text = postPayload.text?.trim() || null;
    const hashtags = text?.match(/#\w+/g)?.map(tag => tag.slice(1).toLowerCase()) ?? [];

    const files = req.files;

    if (!Array.isArray(files) || (await hasInvalidFile(files))) {
      throw new ApiError(400, { message: "Invalid file payload", code: ErrorCode.INVALID_FILE_PAYLOAD });
    } else if (!title && !text && !fileMeta.length) {
      throw new ApiError(400, { message: "Post can't be empty", code: ErrorCode.INVALID_INPUT });
    }

    const existingPost = await PostModel.findOne({ _id: postId, deletedAt: null })
      .select("author media status")
      .lean<{ author: User["_id"]; media: Media[]; status: Post["status"] }>();

    if (!existingPost) {
      throw new ApiError(404, { message: "Post not found", code: ErrorCode.POST_NOT_FOUND });
    } else if (String(existingPost.author) !== String(req.user!._id)) {
      throw new ApiError(403, { message: "Unauthorized to edit other user's post", code: ErrorCode.FORBIDDEN });
    } else if (existingPost.status === "processing") {
      throw new ApiError(409, {
        message: "Cannot edit post while media is still processing",
        code: ErrorCode.POST_PROCESSING,
      });
    }

    const status = fileMeta.length ? "processing" : "published";

    await PostModel.updateOne({ _id: postId }, { $set: { title, text, hashtags, editedAt: new Date(), status } });

    res.status(200).json({ status });

    if (!fileMeta.length) return;

    try {
      const uploadedFiles = files;
      const oldMediaMap = Object.fromEntries(existingPost.media.map(item => [item.originalUrl, item]));
      const media: Media[] = [];

      for (let i = 0; i < fileMeta.length; i++) {
        const meta = fileMeta[i];

        if (meta.type === "url") {
          if (oldMediaMap[meta.value]) {
            media.push(oldMediaMap[meta.value]);
            delete oldMediaMap[meta.value];
          }

          io.to(String(req.user!._id)).emit("post-media", { postId, media, status: "processing" });
          continue;
        }

        const file = uploadedFiles.shift();

        if (!file) {
          io.to(String(req.user!._id)).emit("post-media:error", `Missing file for index ${i}`);
          continue;
        }

        const resourceType = file.mimetype.startsWith("image/") ? "image" : "video";

        await cloudinary.uploader
          .upload(file.path, {
            resource_type: resourceType,
            folder: `${process.env.DB_PREFIX}/posts/${postId}`,
            quality: "auto:good",
            fetch_format: "auto",
            flags: file.mimetype === "image/gif" ? "lossy" : "progressive",
            eager: [
              {
                format: file.mimetype === "image/gif" ? "gif" : "jpg",
                quality: "auto:good",
                fetch_format: "auto",
                flags: file.mimetype === "image/gif" ? "lossy" : "progressive",
              },
            ],
          })
          .then(res => {
            media.push({ type: resourceType, originalUrl: res.secure_url, displayUrl: res.eager?.[0].secure_url });
            io.to(String(req.user!._id)).emit("post-media", { postId: postId, media, status: "processing" });
          })
          .catch(error => {
            io.to(String(req.user!._id)).emit("post-media:error", `Failed to upload file ${file.originalname}`);
            logApiError("Failed to upload file", file, error);
          });
      }

      if (media.length) {
        await PostModel.updateOne({ _id: postId }, { $set: { media }, status: "published" });
      } else {
        throw new Error("Failed to upload any media item");
      }

      io.to(String(req.user!._id)).emit("post-media", { postId: postId, media, status: "published" });
    } catch (error) {
      logApiError("Background processing error in editPost:", error);

      io.to(String(req.user!._id)).emit("post-media", { postId: postId, media: existingPost.media, status: "failed" });

      Promise.all([
        PostModel.updateOne({ _id: postId }, { $set: { status: "failed" } }),
        existingPost.status === "published"
          ? UserModel.updateOne({ _id: req.user!._id }, { $inc: { "count.posts": -1 } })
          : Promise.resolve(),
      ]).catch(error => logApiError("Background processing error handler error in editPost:", error));
    }
  } catch (error) {
    handleControllerError("editPost", error, next);
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

    if (post.status === "processing") {
      post.media = [];
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
      const [post] = await Promise.all([
        PostModel.findOneAndUpdate({ _id: postId, deletedAt: null }, { $set: { deletedAt: new Date() } }, { session })
          .select("_id author status")
          .lean<{ _id: Post["_id"]; author: User["_id"]; status: Post["status"] }>(),
        UserModel.updateOne({ _id: req.user!._id }, { $inc: { "count.posts": -1 } }, { session }),
      ]);

      if (!post) {
        throw new ApiError(404, { message: "Post not found", code: ErrorCode.POST_NOT_FOUND });
      } else if (String(post.author) !== String(req.user!._id)) {
        throw new ApiError(403, { message: "Unauthorized to delete other user's post", code: ErrorCode.FORBIDDEN });
      } else if (post.status === "processing") {
        throw new ApiError(409, {
          message: "Cannot delete post while media is still processing",
          code: ErrorCode.POST_PROCESSING,
        });
      }
    });

    deletePostCleanupQueue
      .add(
        "deletePost",
        { postId: postId.toString() },
        { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: true, removeOnFail: false }
      )
      .catch(error => logApiError("Failed to add to deletePostCleanupQueue:", error));

    res.status(204).end();
  } catch (error) {
    handleControllerError("deletePost", error, next);
  }
}
