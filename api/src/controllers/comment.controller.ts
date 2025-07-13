import { NextFunction, Request, Response } from "express";
import { ApiError, ErrorCode, handleControllerError } from "@/lib/error.js";
import CommentModel from "@/models/comment.model.js";
import mongoose from "mongoose";
import type { CommentPage, Comment, Post, User, Reaction, UserAccountVisibility } from "types";
import NotificationModel from "@/models/notification.model.js";
import ReactionModel from "@/models/reaction.model.js";
import PostModel from "@/models/post.model.js";
import { buildCommentEnrichmentStages, isBlockedByAnyAncestorOrRelatedUser } from "@/utils/aggregate.utils.js";
import FollowModel from "@/models/follow.model.js";
import { withTransaction } from "@/utils/db.utils.js";
import { isValidReqBody } from "@/utils/typeGuard.utils.js";
import { COMMENT_PAGE_SIZE } from "@/config/constants.js";

export async function submitComment(req: Request<{ postId: string }>, res: Response<Pick<Comment, "_id">>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["commentText"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const commentText = String(req.body.commentText).trim();
    const { postId: rawPostId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawPostId)) {
      throw new ApiError(400, { message: "Invalid post id", code: ErrorCode.INVALID_OBJECT_ID });
    } else if (!commentText) {
      throw new ApiError(422, { message: "Comment can't be empty", code: ErrorCode.INVALID_INPUT });
    }

    const postId = new mongoose.Types.ObjectId(rawPostId);

    const post = await PostModel.findOne({ _id: postId, deletedAt: null })
      .select("-_id author")
      .populate({ path: "author", match: { deletedAt: null }, select: "_id privacy.account.visibility" })
      .lean<{ author: UserAccountVisibility | null }>();

    if (!post) {
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

    const newComment = new CommentModel({ post: postId, commentor: req.user!._id, text: commentText });

    const notification =
      post.author && String(post.author._id) !== String(req.user!._id)
        ? new NotificationModel({
            sender: req.user!._id,
            receiver: post.author._id,
            type: "newComment",
            target: { post: postId, comment: newComment._id },
          })
        : null;

    await withTransaction(async session => {
      await Promise.all([
        newComment.save({ session }),
        PostModel.updateOne({ _id: postId }, { $inc: { "count.comments": 1 } }, { session }),
        notification?.save({ session }) ?? Promise.resolve(),
      ]);
    });

    res.status(201).json({ _id: newComment._id });
  } catch (error) {
    handleControllerError("submitComment", error, next);
  }
}

export async function editComment(req: Request<{ commentId: string }>, res: Response<void>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["commentText"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const commentText = String(req.body.commentText).trim();
    const { commentId: rawCommentId } = req.params;

    if (!commentText) {
      throw new ApiError(422, { message: "Comment can't be empty", code: ErrorCode.INVALID_INPUT });
    } else if (!mongoose.Types.ObjectId.isValid(rawCommentId)) {
      throw new ApiError(400, { message: "Invalid comment id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const commentId = new mongoose.Types.ObjectId(rawCommentId);

    await withTransaction(async session => {
      const comment = await CommentModel.findOneAndUpdate(
        { _id: commentId, deletedAt: null },
        { $set: { text: commentText } },
        { session }
      )
        .select("-_id commentor")
        .lean<{ commentor: User["_id"] }>();

      if (!comment) {
        throw new ApiError(404, { message: "Comment not found", code: ErrorCode.COMMENT_NOT_FOUND });
      } else if (String(req.user!._id) !== String(comment.commentor)) {
        throw new ApiError(403, { message: "Not allowed to edit other's comment", code: ErrorCode.FORBIDDEN });
      }
    });

    res.status(204).end();
  } catch (error) {
    handleControllerError("editComment", error, next);
  }
}

export async function deleteComment(req: Request<{ commentId: string }>, res: Response<void>, next: NextFunction) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      throw new ApiError(400, { message: "Invalid comment id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const commentId = new mongoose.Types.ObjectId(req.params.commentId);

    await withTransaction(async session => {
      const comment = await CommentModel.findOneAndUpdate(
        { _id: commentId, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { session, new: false }
      )
        .select("-_id post commentor")
        .populate({
          path: "post",
          select: "-_id author",
          match: { deletedAt: null },
        })
        .lean<{ post: { author: User["_id"] } | null; commentor: User["_id"] }>();

      if (!comment || !comment.post) {
        throw new ApiError(404, { message: "Comment not found", code: ErrorCode.COMMENT_NOT_FOUND });
      } else if (String(comment.commentor) !== String(req.user!._id)) {
        throw new ApiError(403, { message: "Unauthorized to delete other user's comment", code: ErrorCode.FORBIDDEN });
      }

      if (String(req.user!._id) !== String(comment.post.author)) {
        await NotificationModel.deleteMany({ "target.comment": commentId });
      }
    });

    res.status(204).end();
  } catch (error) {
    handleControllerError("deleteComment", error, next);
  }
}

export async function toggleCommentReaction(req: Request<{ commentId: string }>, res: Response<void>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["reactionType"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const reactionType = String(req.body.reactionType);

    const { commentId: rawCommentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawCommentId)) {
      throw new ApiError(400, { message: "Invalid comment id", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const commentId = new mongoose.Types.ObjectId(rawCommentId);

    const comment = await CommentModel.findOne({ _id: commentId, deletedAt: null })
      .select("-_id commentor post")
      .populate([
        {
          path: "post",
          select: "_id author",
          match: { deletedAt: null },
          populate: { path: "author", select: "_id privacy.account.visibility", match: { deletedAt: null } },
        },
        { path: "commentor", select: "_id", match: { deletedAt: null } },
      ])
      .lean<{ commentor: Pick<User, "_id"> | null; post: null | { _id: Post["_id"]; author: UserAccountVisibility | null } }>();

    if (!comment || !comment.post) {
      throw new ApiError(404, { message: "Comment not found", code: ErrorCode.COMMENT_NOT_FOUND });
    } else if (
      comment.post.author?.privacy.account.visibility === "private" &&
      String(comment.post.author._id) !== String(req.user!._id) &&
      !(await FollowModel.exists({ follower: req.user!._id, following: comment.post.author._id, status: "accepted" }))
    ) {
      throw new ApiError(403, { message: "Can't react to comments of a private user's post", code: ErrorCode.PRIVATE_USER });
    } else if (
      await isBlockedByAnyAncestorOrRelatedUser(req.user, commentId, comment.post.author ? [comment.post.author._id] : [])
    ) {
      throw new ApiError(403, { message: "Can't react due to a block relationship", code: ErrorCode.BLOCKED_USER });
    }

    const postId = comment.post._id;

    await withTransaction(async session => {
      const isReacting = ["like", "dislike"].includes(reactionType);

      const previousReaction = isReacting
        ? await ReactionModel.findOneAndUpdate(
            { user: req.user!._id, "target._id": commentId },
            {
              $set: { type: reactionType, createdAt: new Date() },
              $setOnInsert: { user: req.user!._id, target: { _id: commentId, type: "Comment" } },
            },
            { upsert: true, new: false, session }
          )
            .select("type")
            .lean<Pick<Reaction, "type">>()
        : await ReactionModel.findOneAndDelete({ user: req.user!._id, "target._id": commentId }, { session })
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
        ops.push(CommentModel.updateOne({ _id: commentId }, { $inc: inc }, { session }));
      }

      if (reactionType === "like" && comment.commentor && String(comment.commentor._id) !== String(req.user!._id)) {
        ops.push(
          NotificationModel.findOneAndUpdate(
            {
              sender: req.user!._id,
              receiver: comment.commentor._id,
              type: "commentLike",
              "target.comment": commentId,
              createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
            },
            {
              $setOnInsert: {
                sender: req.user!._id,
                receiver: comment.commentor._id,
                type: "commentLike",
                target: { post: postId, comment: commentId },
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
    handleControllerError("toggleCommentReaction", error, next);
  }
}

export async function submitReply(req: Request<{ commentId: string }>, res: Response<Pick<Comment, "_id">>, next: NextFunction) {
  try {
    if (!isValidReqBody(req.body, ["replyText"])) {
      throw new ApiError(400, { message: "Invalid request body", code: ErrorCode.INVALID_REQUEST_BODY });
    }

    const replyText = String(req.body.replyText).trim();

    if (!replyText) {
      throw new ApiError(422, { message: "Reply can't be empty", code: ErrorCode.INVALID_INPUT });
    } else if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
      throw new ApiError(400, { message: "Invalid comment id", code: ErrorCode.INVALID_INPUT });
    }

    const commentId = new mongoose.Types.ObjectId(req.params.commentId);

    const comment = await CommentModel.findOne({ _id: commentId })
      .select("-_id post commentor")
      .populate([
        {
          path: "post",
          select: "_id author",
          match: { deletedAt: null },
          populate: {
            path: "author",
            select: "_id privacy.account.visibility",
            match: { deletedAt: null },
          },
        },
        { path: "commentor", select: "_id", match: { deletedAt: null } },
      ])
      .lean<{ commentor: Pick<User, "_id"> | null; post: null | { _id: Post["_id"]; author: UserAccountVisibility | null } }>();

    if (!comment || !comment.post) {
      throw new ApiError(404, { message: "Comment not found", code: ErrorCode.COMMENT_NOT_FOUND });
    } else if (
      comment.post.author?.privacy.account.visibility === "private" &&
      String(comment.post.author._id) !== String(req.user!._id) &&
      !(await FollowModel.exists({ follower: req.user!._id, following: comment.post.author._id, status: "accepted" }))
    ) {
      throw new ApiError(403, { message: "Can't reply to comments on a private post", code: ErrorCode.PRIVATE_USER });
    } else if (
      await isBlockedByAnyAncestorOrRelatedUser(req.user, commentId, comment.post.author ? [comment.post.author._id] : [])
    ) {
      throw new ApiError(403, { message: "Can't reply to due to a block relationship", code: ErrorCode.BLOCKED_USER });
    }

    const newReply = new CommentModel({ post: comment.post._id, parent: commentId, commentor: req.user!._id, text: replyText });

    const notification =
      comment.commentor && String(comment.commentor._id) !== String(req.user!._id)
        ? new NotificationModel({
            sender: req.user!._id,
            receiver: comment.commentor,
            type: "newReply",
            target: { post: comment.post._id, comment: newReply._id },
          })
        : null;

    const newReplyId = await withTransaction(async session => {
      await Promise.all([
        newReply.save({ session }),
        CommentModel.updateOne({ _id: commentId }, { $inc: { "count.replies": 1 } }, { session }),
        notification?.save({ session }) ?? Promise.resolve(),
      ]);

      return newReply._id;
    });

    res.status(201).json({ _id: newReplyId });
  } catch (error) {
    handleControllerError("submitReply", error, next);
  }
}

export async function getCommentReplies(req: Request<{ commentId: string }>, res: Response<CommentPage>, next: NextFunction) {
  try {
    const { commentId: rawCommentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawCommentId)) {
      throw new ApiError(400, { message: "Invalid comment ID", code: ErrorCode.INVALID_INPUT });
    }

    const commentId = new mongoose.Types.ObjectId(rawCommentId);

    const comment = await CommentModel.findOne({ _id: commentId })
      .select("_id post")
      .populate({
        path: "post",
        select: "-_id author",
        match: { deletedAt: null },
        populate: { path: "author", select: "_id privacy.account.visibility", match: { deletedAt: null } },
      })
      .lean<{ commentor: Pick<User, "_id"> | null; post: null | { author: UserAccountVisibility | null } }>();

    if (!comment || !comment.post) {
      throw new ApiError(404, { message: "Comment not found", code: ErrorCode.COMMENT_NOT_FOUND });
    } else if (
      comment.post.author?.privacy.account.visibility === "private" &&
      (!req.user ||
        (String(comment.post.author._id) !== String(req.user._id) &&
          !(await FollowModel.exists({ follower: req.user._id, following: comment.post.author._id, status: "accepted" }))))
    ) {
      throw new ApiError(403, { message: "Unauthorized to view comments of private user's post", code: ErrorCode.PRIVATE_USER });
    } else if (
      await isBlockedByAnyAncestorOrRelatedUser(req.user, commentId, comment.post.author ? [comment.post.author._id] : [])
    ) {
      throw new ApiError(403, { message: "Access denied due to block relationship", code: ErrorCode.BLOCKED_USER });
    }

    const pageParam = req.query;
    const replyMatchConditions: Record<string, any> = { parent: commentId };

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.createdAt === "string"
    ) {
      const createdAtDate = new Date(pageParam.createdAt);
      if (!isNaN(createdAtDate.getTime())) {
        replyMatchConditions.$or = [
          { createdAt: { $lt: createdAtDate } },
          { createdAt: createdAtDate, _id: { $gt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const comments = await CommentModel.aggregate<Comment>([
      { $match: replyMatchConditions },
      ...buildCommentEnrichmentStages(req.user),
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: COMMENT_PAGE_SIZE },
    ]);

    const lastComment = comments[comments.length - 1];
    const nextPageParam =
      comments.length === COMMENT_PAGE_SIZE && lastComment ? { _id: lastComment._id, createdAt: lastComment.createdAt } : null;

    res.status(200).json({ comments, nextPageParam });
  } catch (error) {
    handleControllerError("getReplies", error, next);
  }
}

export async function getPostComments(req: Request<{ postId: string }>, res: Response<CommentPage>, next: NextFunction) {
  try {
    const { postId: rawPostId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawPostId)) {
      throw new ApiError(400, { message: "Invalid post ID", code: ErrorCode.INVALID_OBJECT_ID });
    }

    const postId = new mongoose.Types.ObjectId(rawPostId);

    const post = await PostModel.findOne({ _id: postId, deletedAt: null })
      .select("-_id author")
      .populate({
        path: "author",
        select: "_id privacy.account.visibility",
        match: { deletedAt: null },
      })
      .lean<{ author: UserAccountVisibility }>();

    if (!post) {
      throw new ApiError(404, { message: "Post not found", code: ErrorCode.POST_NOT_FOUND });
    } else if (
      post.author?.privacy.account.visibility === "private" &&
      (!req.user ||
        (String(post.author._id) !== String(req.user._id) &&
          !(await FollowModel.exists({ follower: req.user._id, following: post.author._id, status: "accepted" }))))
    ) {
      throw new ApiError(403, { message: "Unauthorized to view comments of private user's post", code: ErrorCode.PRIVATE_USER });
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

    const pageParam = req.query;
    const commentMatchConditions: Record<string, any> = { post: postId, parent: null };

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.createdAt === "string"
    ) {
      const createdAtDate = new Date(pageParam.createdAt);
      if (!isNaN(createdAtDate.getTime())) {
        commentMatchConditions.$or = [
          { createdAt: { $lt: createdAtDate } },
          { createdAt: createdAtDate, _id: { $lt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const comments = await CommentModel.aggregate<Comment>([
      { $match: commentMatchConditions },
      ...buildCommentEnrichmentStages(req.user),
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: COMMENT_PAGE_SIZE },
    ]);

    const lastComment = comments[comments.length - 1];
    const nextPageParam =
      comments.length === COMMENT_PAGE_SIZE && lastComment ? { _id: lastComment._id, createdAt: lastComment.createdAt } : null;
    res.status(200).json({ comments, nextPageParam });
  } catch (error) {
    handleControllerError("getComments", error, next);
  }
}

export async function getComment(req: Request<{ commentId: string }>, res: Response<Comment>, next: NextFunction) {
  try {
    const { commentId: rawCommentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rawCommentId)) {
      throw new ApiError(400, { message: "Invalid comment ID", code: ErrorCode.INVALID_INPUT });
    }

    const commentId = new mongoose.Types.ObjectId(rawCommentId);

    const comment = await CommentModel.findOne({ _id: commentId })
      .select("_id text media commentor count createdAt updatedAt deletedAt post")
      .populate([
        { path: "commentor", select: "fullname username profilePicture verified.profile", match: { deletedAt: null } },
        {
          path: "post",
          select: "-_id author",
          match: { deletedAt: null },
          populate: {
            path: "author",
            select: "_id privacy.account.visibility",
            match: { deletedAt: null },
          },
        },
      ])
      .lean<Comment>();

    const post = comment?.post;
    delete comment?.post;

    if (!comment || !post) {
      throw new ApiError(404, { message: "Comment not found", code: ErrorCode.COMMENT_NOT_FOUND });
    } else if (
      post.author?.privacy.account.visibility === "private" &&
      (!req.user ||
        (String(post.author._id) !== String(req.user._id) &&
          String(comment.commentor?._id) !== String(req.user._id) &&
          !(await FollowModel.exists({ follower: req.user._id, following: post.author._id, status: "accepted" }))))
    ) {
      throw new ApiError(403, { message: "Unauthorized to view comments of private user's post", code: ErrorCode.PRIVATE_USER });
    } else if (await isBlockedByAnyAncestorOrRelatedUser(req.user, commentId, post.author ? [post.author._id] : [])) {
      throw new ApiError(403, { message: "Access denied due to block relationship", code: ErrorCode.BLOCKED_USER });
    }

    const reactionDoc =
      req.user && !comment.deletedAt
        ? await ReactionModel.findOne({
            "target._id": comment._id,
            user: req.user._id,
          })
            .select("-_id type")
            .lean<Pick<Reaction, "type">>()
        : null;

    comment.reaction = reactionDoc?.type ?? null;

    if (comment.deletedAt) {
      comment.text = null;
      comment.media = [];
      comment.commentor = null;
    }

    res.status(200).json(comment);
  } catch (error) {
    handleControllerError("getComment", error, next);
  }
}
