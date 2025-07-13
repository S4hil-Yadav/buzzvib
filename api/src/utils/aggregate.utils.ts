import CommentModel from "@/models/comment.model.js";
import type { Comment, User } from "types";
import { type Request } from "express";

export function buildSearchUserStage(query: string) {
  return [
    {
      $search: {
        index: "user_search",
        compound: {
          should: [
            { autocomplete: { path: "username", query, fuzzy: { maxEdits: 2, prefixLength: 1 } } },
            { autocomplete: { path: "fullname", query, fuzzy: { maxEdits: 2, prefixLength: 1 } } },
          ],
        },
      },
    },
  ];
}

export function buildSearchPostStage(query: string) {
  return [
    {
      $search: {
        index: "post_search",
        compound: {
          should: [
            { autocomplete: { path: "title", query, fuzzy: { maxEdits: 1, prefixLength: 1 } } },
            { autocomplete: { path: "hashtags", query, fuzzy: { maxEdits: 1, prefixLength: 1 } } },
            { text: { path: "text", query, fuzzy: { maxEdits: 2, prefixLength: 2 }, score: { boost: { value: 2 } } } },
          ],
        },
      },
    },
  ];
}

export function buildFilterBlockStage(reqUser: Request["user"], userField: string) {
  return [
    ...(reqUser
      ? [
          {
            $lookup: {
              from: "follows",
              let: { userId: `$${userField}` },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$follower", "$$userId"] },
                        { $eq: ["$following", reqUser._id] },
                        { $eq: ["$status", "blocked"] },
                      ],
                    },
                  },
                },
                { $project: { _id: 0 } },
              ],
              as: "blockedByUsersArr",
            },
          },
          {
            $lookup: {
              from: "follows",
              let: { userId: `$${userField}` },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$following", "$$userId"] },
                        { $eq: ["$follower", reqUser._id] },
                        { $eq: ["$status", "blocked"] },
                      ],
                    },
                  },
                },
                { $project: { _id: 0 } },
              ],
              as: "blockedUsersArr",
            },
          },
        ]
      : [{ $addFields: { blockedByUsersArr: [], blockedUsersArr: [] } }]),
    { $match: { $expr: { $and: [{ $eq: [{ $size: "$blockedByUsersArr" }, 0] }, { $eq: [{ $size: "$blockedUsersArr" }, 0] }] } } },
  ];
}

export function buildUserEnrichmentStages(reqUser: Request["user"], options?: { filterPrivateAccounts?: boolean }) {
  const { filterPrivateAccounts = false } = options ?? {};

  return [
    ...(filterPrivateAccounts
      ? reqUser
        ? [
            {
              $lookup: {
                from: "follows",
                let: { targetId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          { $eq: ["$$targetId", reqUser._id] },
                          {
                            $and: [
                              { $eq: ["$following", "$$targetId"] },
                              { $eq: ["$follower", reqUser._id] },
                              { $eq: ["$status", "accepted"] },
                            ],
                          },
                        ],
                      },
                    },
                  },
                  { $project: { _id: 0 } },
                ],
                as: "followArr",
              },
            },
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$privacy.account.visibility", "public"] },
                    { $and: [{ $eq: ["$privacy.account.visibility", "private"] }, { $gt: [{ $size: "$followArr" }, 0] }] },
                  ],
                },
              },
            },
          ]
        : [{ $match: { $expr: { $eq: ["$privacy.account.visibility", "public"] } } }]
      : []),
    {
      $project: { _id: 1, username: 1, fullname: 1, profilePicture: 1, "verified.profile": 1 },
    },
  ];
}

export function buildUserFieldEnrichmentStage(
  reqUser: Request["user"],
  userField: string,
  resultField: string = userField,
  options?: { filterPrivateAccounts?: boolean; filterReqUser?: boolean; preserveNullUsers?: boolean }
) {
  const { filterPrivateAccounts = false, filterReqUser = false, preserveNullUsers = false } = options ?? {};

  return [
    {
      $lookup: {
        from: "users",
        let: { userId: `$${userField}` },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$userId"] },
                  { $eq: ["$deletedAt", null] },
                  ...(filterReqUser && reqUser ? [{ $ne: ["$_id", reqUser._id] }] : []),
                ],
              },
            },
          },
          ...buildUserEnrichmentStages(reqUser, { filterPrivateAccounts }),
        ],
        as: resultField,
      },
    },
    { $unwind: { path: `$${resultField}`, preserveNullAndEmptyArrays: preserveNullUsers } },
  ];
}

export function buildAddReactionStage(reqUser: Request["user"], postField: string, resultField: string = "reaction") {
  return [
    reqUser
      ? {
          $lookup: {
            from: "reactions",
            let: { targetId: `$${postField}` },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$target._id", "$$targetId"] }, { $eq: ["$user", reqUser._id] }] } } },
              { $project: { type: 1, _id: 0 } },
            ],
            as: "userReactionArr",
          },
        }
      : { $addFields: { userReactionArr: [] } },
    {
      $addFields: {
        [resultField]: {
          $cond: [{ $gt: [{ $size: "$userReactionArr" }, 0] }, { $arrayElemAt: ["$userReactionArr.type", 0] }, null],
        },
      },
    },
  ];
}

export function buildAddPostSaveStatusStage(reqUser: Request["user"], postField: string, resultField: string = "savedAt") {
  return [
    reqUser
      ? {
          $lookup: {
            from: "saves",
            let: { targetId: `$${postField}` },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$target._id", "$$targetId"] },
                      { $eq: ["$user", reqUser._id] },
                      { $eq: ["$saveCollection", null] },
                    ],
                  },
                },
              },
              { $project: { _id: 0 } },
            ],
            as: "savedAtArr",
          },
        }
      : { $addFields: { savedAtArr: [] } },
    { $addFields: { [resultField]: { $arrayElemAt: ["$savedAtArr", 0] } } },
  ];
}

export function buildPostEnrichmentStages(
  reqUser: Request["user"],
  options?: {
    filterBlockStage?: boolean;
    enrichUserStage?: boolean;
    addReactionStage?: boolean;
    addPostSaveStatusStage?: boolean;
    filterPrivateAccounts?: boolean;
    filterReqUser?: boolean;
    preserveNullUsers?: boolean;
  }
) {
  const {
    filterBlockStage = true,
    enrichUserStage = true,
    addReactionStage = true,
    addPostSaveStatusStage = true,
    filterPrivateAccounts = true,
    filterReqUser = false,
    preserveNullUsers = false,
  } = options ?? {};
  return [
    ...(filterBlockStage ? buildFilterBlockStage(reqUser, "author") : []),
    ...(enrichUserStage
      ? buildUserFieldEnrichmentStage(reqUser, "author", "author", { filterPrivateAccounts, preserveNullUsers, filterReqUser })
      : []),
    ...(addReactionStage ? buildAddReactionStage(reqUser, "_id") : []),
    ...(addPostSaveStatusStage ? buildAddPostSaveStatusStage(reqUser, "_id") : []),
    {
      $project: {
        _id: 1,
        title: { $cond: [{ $ifNull: ["$deletedAt", false] }, null, "$title"] },
        text: { $cond: [{ $ifNull: ["$deletedAt", false] }, null, "$text"] },
        hashtags: { $cond: [{ $ifNull: ["$deletedAt", false] }, [], "$hashtags"] },
        media: { $cond: [{ $ifNull: ["$deletedAt", false] }, [], "$media"] },
        author: { $cond: [{ $ifNull: ["$deletedAt", false] }, null, "$author"] },
        count: 1,
        reaction: 1,
        savedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        deletedAt: 1,
      },
    },
  ];
}

export function buildPostFieldEnrichmentStage(
  reqUser: Request["user"],
  postField: string,
  resultField: string = postField,
  options?: {
    enrichUserStage?: boolean;
    filterReqUser?: boolean;
    preserveNullUsers?: boolean;
    filterBlockStage?: boolean;
    addReactionStage?: boolean;
    addPostSaveStatusStage?: boolean;
    filterPrivateAccounts?: boolean;
    preserveDeletedPosts?: boolean;
  }
) {
  const {
    enrichUserStage,
    filterReqUser,
    preserveNullUsers,
    filterBlockStage,
    addReactionStage,
    addPostSaveStatusStage,
    filterPrivateAccounts,
    preserveDeletedPosts = false,
  } = options ?? {};

  return [
    {
      $lookup: {
        from: "posts",
        let: { postId: `$${postField}` },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$_id", "$$postId"] }, { $eq: ["$deletedAt", null] }] } } },
          ...buildPostEnrichmentStages(reqUser, {
            enrichUserStage,
            filterReqUser,
            preserveNullUsers,
            filterBlockStage,
            addReactionStage,
            addPostSaveStatusStage,
            filterPrivateAccounts,
          }),
        ],
        as: resultField,
      },
    },
    { $unwind: { path: `$${resultField}`, preserveNullAndEmptyArrays: preserveDeletedPosts } },
  ];
}

export function buildCommentEnrichmentStages(
  reqUser: Request["user"],
  options?: {
    filterBlockStage?: boolean;
    enrichUserStage?: boolean;
    addReactionStage?: boolean;
    filterPrivateAccounts?: boolean;
    filterReqUser?: boolean;
    preserveNullUsers?: boolean;
    // addCommentSaveStatusStage?: boolean;
  }
) {
  const {
    filterBlockStage = true,
    enrichUserStage = true,
    addReactionStage = true,
    filterPrivateAccounts = false,
    filterReqUser = false,
    preserveNullUsers = true,
  } = options ?? {};

  return [
    ...(filterBlockStage ? buildFilterBlockStage(reqUser, "commentor") : []),
    ...(enrichUserStage
      ? buildUserFieldEnrichmentStage(reqUser, "commentor", "commentor", {
          filterPrivateAccounts,
          filterReqUser,
          preserveNullUsers,
        })
      : []),
    ...(addReactionStage ? buildAddReactionStage(reqUser, "_id") : []),
    {
      $project: {
        _id: 1,
        commentor: { $cond: [{ $ifNull: ["$deletedAt", false] }, null, "$commentor"] },
        text: { $cond: [{ $ifNull: ["$deletedAt", false] }, null, "$text"] },
        media: { $cond: [{ $ifNull: ["$deletedAt", false] }, [], "$media"] },
        count: 1,
        reaction: { $cond: [{ $ifNull: ["$deletedAt", false] }, null, "$reaction"] },
        createdAt: 1,
        updatedAt: 1,
        deletedAt: 1,
      },
    },
  ];
}

export async function isBlockedByAnyAncestorOrRelatedUser(
  reqUser: Request["user"],
  commentId: Comment["_id"],
  relatedUserIds: User["_id"][] = []
) {
  if (!reqUser) return false;

  const result = await CommentModel.aggregate<{ isBlocked: boolean }>([
    { $match: { _id: commentId } },
    {
      $graphLookup: {
        from: "comments",
        startWith: "$parent",
        connectFromField: "parent",
        connectToField: "_id",
        as: "ancestors",
        restrictSearchWithMatch: { deletedAt: null },
      },
    },
    { $unwind: "$ancestors" },
    {
      $lookup: {
        from: "users",
        let: { commentorId: "$ancestors.commentor" },
        pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$commentorId"] }, { $eq: ["$deletedAt", null] }] } } }],
        as: "commentorUser",
      },
    },
    { $unwind: "$commentorUser" },
    { $match: { "commentorUser.deletedAt": null } },
    { $group: { _id: null, allUserIds: { $addToSet: "$commentorUser._id" } } },
    { $project: { allUserIds: { $setUnion: ["$allUserIds", relatedUserIds] } } },
    {
      $lookup: {
        from: "follows",
        let: { userIds: "$allUserIds" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$follower", "$$userIds"] },
                  { $eq: ["$following", reqUser._id] },
                  { $eq: ["$status", "blocked"] },
                ],
              },
            },
          },
        ],
        as: "blockingRelations",
      },
    },
    { $project: { isBlocked: { $gt: [{ $size: "$blockingRelations" }, 0] } } },
  ]);

  return result[0]?.isBlocked ?? false;
}

export function buildChatroomEnrichmentStages(reqUser: Request["user"]) {
  return [
    {
      $lookup: {
        from: "chatroommembers",
        let: { chatroomId: "$_id" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$chatroomId", "$$chatroomId"] }, { $eq: ["$userId", reqUser!._id] }] } } },
          { $project: { nickname: 1, lastSeenMessage: 1, muted: 1, archived: 1 } },
        ],
        as: "userStateArr",
      },
    },
    { $addFields: { userState: { $arrayElemAt: ["$userStateArr", 0] } } },
    {
      $lookup: {
        from: "chatroommembers",
        let: { chatroomId: "$_id" },
        pipeline: [{ $match: { $expr: { $eq: ["$chatroomId", "$$chatroomId"] } } }, { $project: { _id: 0, userId: 1 } }],
        as: "allMembers",
      },
    },
    {
      $addFields: {
        otherUserId: {
          $cond: {
            if: { $eq: ["$type", "private"] },
            then: { $first: { $filter: { input: "$allMembers", as: "m", cond: { $ne: ["$$m.userId", reqUser!._id] } } } },
            else: null,
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        type: 1,
        group: 1,
        lastMessage: 1,
        createdBy: 1,
        deletedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        nickname: "$userState.nickname",
        lastSeenMessage: "$userState.lastSeenMessage",
        muted: "$userState.muted",
        archived: "$userState.archived",
        user: { $cond: [{ $eq: ["$type", "private"] }, "$otherUserId.userId", "$$REMOVE"] },
        members: { $cond: [{ $eq: ["$type", "group"] }, "$allMembers.userId", "$$REMOVE"] },
      },
    },
  ];
}

export function buildMessageEnrichmentStages(reqUser: Request["user"]) {
  return [
    {
      $lookup: {
        from: "chatroommembers",
        let: { chatroomId: "$_id" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$chatroomId", "$$chatroomId"] }, { $eq: ["$userId", reqUser!._id] }] } } },
          { $project: { nickname: 1, lastSeenMessage: 1, muted: 1, archived: 1 } },
        ],
        as: "userStateArr",
      },
    },
    { $addFields: { userState: { $arrayElemAt: ["$userStateArr", 0] } } },
    {
      $lookup: {
        from: "chatroommembers",
        let: { chatroomId: "$_id" },
        pipeline: [{ $match: { $expr: { $eq: ["$chatroomId", "$$chatroomId"] } } }, { $project: { _id: 0, userId: 1 } }],
        as: "allMembers",
      },
    },
    {
      $addFields: {
        otherUserId: {
          $cond: {
            if: { $eq: ["$type", "private"] },
            then: { $first: { $filter: { input: "$allMembers", as: "m", cond: { $ne: ["$$m.userId", reqUser!._id] } } } },
            else: null,
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        type: 1,
        group: 1,
        lastMessage: 1,
        createdBy: 1,
        deletedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        nickname: "$userState.nickname",
        lastSeenMessage: "$userState.lastSeenMessage",
        muted: "$userState.muted",
        archived: "$userState.archived",
        user: { $cond: [{ $eq: ["$type", "private"] }, "$otherUserId.userId", "$$REMOVE"] },
        members: { $cond: [{ $eq: ["$type", "group"] }, "$allMembers.userId", "$$REMOVE"] },
      },
    },
  ];
}
