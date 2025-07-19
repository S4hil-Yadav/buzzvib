import { Box, Card, Avatar, Typography, Link as MuiLink } from "@mui/material";
import type { Notification } from "@/types";
import dayjs from "@/lib/dayjs";
import { useMemo } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";

interface NotificationCardProps {
  notification: Notification;
}

export default function NotificationCard({ notification }: NotificationCardProps) {
  const location = useLocation();

  const msg: [string | null, string | null] = useMemo(() => {
    const formatPostText = (post: Notification["target"]["post"]) => (post ? post.title ?? post.text : "[deleted]");
    const formatcommentText = (comment: Notification["target"]["comment"]) => (comment ? comment.text : "[deleted]");

    return notification.type === "newFollower"
      ? ["followed you", null]
      : notification.type === "followAccepted"
      ? ["accepted your follow request", null]
      : notification.type === "newPost"
      ? ["posted ", formatPostText(notification.target.post)]
      : notification.type === "postLike"
      ? ["liked your post ", formatPostText(notification.target.post)]
      : notification.type === "newComment"
      ? ["commented on your post ", formatcommentText(notification.target.comment)]
      : notification.type === "commentLike"
      ? ["liked your comment ", formatcommentText(notification.target.comment)]
      : notification.type === "newReply"
      ? ["replied to you ", formatcommentText(notification.target.comment)]
      : [null, null];
  }, [notification]);

  const navPath =
    notification.sender && (notification.type === "newFollower" || notification.type === "followAccepted")
      ? "/profile/" + notification.sender._id
      : notification.target.post
      ? `/post/${notification.target.post._id}`
      : "#";
  // : notification.target.comment // TODO handle comment redirect
  // ? `/post/${notification.target.comment._id}`

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
        boxShadow: 2,
        bgcolor: notification.seenAt ? "background.paper" : "background.default",
        "&:hover": {
          bgcolor: "action.hover",
        },
        borderColor: notification.seenAt ? "divider" : "primary.main",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <MuiLink
          component={RouterLink}
          to={notification.sender ? `/profile/${notification.sender.username}` : ""}
          underline="none"
        >
          <Avatar
            src={notification.sender?.profilePicture?.displayUrl}
            alt={notification.sender?.fullname}
            sx={{ width: 50, height: 50, cursor: "pointer" }}
          />
        </MuiLink>

        <Box sx={{ flexGrow: 1 }}>
          <MuiLink
            component={RouterLink}
            to={notification.sender ? `/profile/${notification.sender.username}` : ""}
            underline="none"
          >
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{
                color: "text.primary",
                cursor: "pointer",
              }}
            >
              {notification.sender?.fullname || "[deleted user]"}
            </Typography>
          </MuiLink>

          <MuiLink
            component={RouterLink}
            to={navPath}
            state={navPath && notification.target ? { backgroundLocation: location, tab: "post" } : undefined}
            underline="none"
          >
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.5,
              }}
            >
              {msg[0]}
              <b>{msg[1] && (msg[1].length > 20 ? msg[1].slice(0, 20) + "..." : msg[1])}</b>
            </Typography>
          </MuiLink>
        </Box>
      </Box>

      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          right: 16,
          top: 8,
          color: "text.disabled",
          fontSize: "0.75rem",
        }}
      >
        {dayjs(notification.createdAt).fromNow()}
      </Typography>
    </Card>
  );
}
