import { handleControllerError } from "@/lib/error.js";
import type { Notification, NotificationPage } from "types";
import { buildUserFieldEnrichmentStage } from "@/utils/aggregate.utils.js";
import NotificationModel from "@/models/notification.model.js";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { NOTIFICATION_PAGE_SIZE } from "@/config/constants.js";

export async function getNotifications(req: Request, res: Response<NotificationPage>, next: NextFunction) {
  try {
    const pageParam = req.query;

    const notificationMatchConditions: Record<string, any> = { receiver: req.user!._id };

    if (
      typeof pageParam._id === "string" &&
      mongoose.Types.ObjectId.isValid(pageParam._id) &&
      typeof pageParam.createdAt === "string"
    ) {
      const createdAtDate = new Date(pageParam.createdAt);
      if (!isNaN(createdAtDate.getTime())) {
        notificationMatchConditions.$or = [
          { createdAt: { $lt: createdAtDate } },
          { createdAt: createdAtDate, _id: { $lt: new mongoose.Types.ObjectId(pageParam._id) } },
        ];
      }
    }

    const notifications = await NotificationModel.aggregate<Notification>([
      { $match: notificationMatchConditions },
      ...buildUserFieldEnrichmentStage(req.user, "sender"),
      {
        $lookup: {
          from: "posts",
          let: { targetId: "$target.post" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$_id", "$$targetId"] }, { $eq: ["$deletedAt", null] }],
                },
              },
            },
            { $project: { _id: 1, title: 1, text: 1 } },
          ],
          as: "postArr",
        },
      },
      {
        $lookup: {
          from: "comments",
          let: { targetId: "$target.comment" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$_id", "$$targetId"] }, { $eq: ["$deletedAt", null] }],
                },
              },
            },
            { $project: { _id: 1, text: 1, post: 1, parent: 1 } },
          ],
          as: "commentArr",
        },
      },
      {
        $addFields: {
          "target.post": {
            $cond: [{ $gt: [{ $size: "$postArr" }, 0] }, { $first: "$postArr" }, null],
          },
          "target.comment": {
            $cond: [{ $gt: [{ $size: "$commentArr" }, 0] }, { $first: "$commentArr" }, null],
          },
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: NOTIFICATION_PAGE_SIZE },
      {
        $project: {
          sender: 1,
          type: 1,
          seenAt: 1,
          createdAt: 1,
          target: 1,
        },
      },
    ]);

    const lastNotification = notifications[notifications.length - 1];
    const nextPageParam =
      notifications.length === NOTIFICATION_PAGE_SIZE && lastNotification
        ? { _id: lastNotification._id, createdAt: lastNotification.createdAt }
        : null;

    res.status(200).json({ notifications, nextPageParam });
  } catch (error) {
    handleControllerError("getNotifications", error, next);
  }
}

export async function seeAllNotifications(req: Request, res: Response<void>, next: NextFunction) {
  try {
    await NotificationModel.updateMany({ receiver: req.user!._id, seenAt: null }, { $set: { seenAt: new Date() } });
    res.status(204).end();
  } catch (error) {
    handleControllerError("seeAllNotifications", error, next);
  }
}
