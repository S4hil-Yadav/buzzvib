import { Box, Stack, Button, Typography } from "@mui/material";
import ReplyList from "./ReplyList";
import {
  ThumbUpOffAltOutlined as LikeIcon,
  ThumbUpAlt as UnlikeIcon,
  ThumbDownOffAltOutlined as DislikeIcon,
  ThumbDownAlt as UndislikeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import type { AuthUser, Comment, Post } from "@/types";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { useToggleCommentReactionMutation } from "@/services/mutations/comment.mutations";
import { openAlert } from "@/redux/slices/alertSlice";

interface CommentFooterProps {
  postId: Post["_id"];
  comment: Comment;
  setEditAction: (comment: Comment) => void;
  setReplyAction: (comment: Comment) => void;
}

export default function CommentFooter({ postId, comment, setEditAction, setReplyAction }: CommentFooterProps) {
  const [showReplies, setShowReplies] = useState(false);

  useEffect(() => {
    if (!comment.count.replies) {
      setShowReplies(false);
    }
  }, [comment.count.replies]);

  return (
    <>
      <Stack direction="row" spacing={2}>
        <Box display="flex">
          <LikeButton comment={comment} />
          <DislikeButton comment={comment} />
        </Box>
        {!!comment.count.replies && (
          <Button
            onClick={() => setShowReplies(prev => !prev)}
            endIcon={showReplies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ justifyContent: "flex-start", color: "text.primary" }}
          >
            <Typography variant="caption" justifySelf="start">
              {showReplies
                ? "Hide Replies"
                : `Show ${comment.count.replies}\xa0${comment.count.replies > 1 ? "replies" : "reply"}`}
            </Typography>
          </Button>
        )}
      </Stack>
      {showReplies && (
        <Box sx={{ pl: 1 }}>
          <ReplyList postId={postId} parent={comment} setEditAction={setEditAction} setReplyAction={setReplyAction} />
        </Box>
      )}
    </>
  );
}

interface LikeButtonProps {
  comment: Comment;
}

function LikeButton({ comment }: LikeButtonProps) {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  const { mutate: toggleLike } = useToggleCommentReactionMutation();

  return (
    <Button
      disabled={!!comment.deletedAt}
      onClick={() => {
        if (!authUser) {
          dispatch(
            openAlert({
              title: "Signup?",
              message: "You must signup to use this feature.",
              confirmButtonText: "signup",
              onConfirm: () => navigate("/signup"),
            })
          );
          return;
        }
        toggleLike({ commentId: comment._id, reaction: comment.reaction === "like" ? null : "like" });
      }}
      startIcon={
        comment.reaction === "like" ? (
          <UnlikeIcon sx={{ color: "primary.dark" }} fontSize="small" />
        ) : (
          <LikeIcon sx={{ color: "text.secondary" }} fontSize="small" />
        )
      }
      sx={{
        borderRight: "none",
        textTransform: "none",
        minWidth: "64px",
        opacity: comment.deletedAt ? 0.7 : 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ userSelect: "none" }}>
        {comment.count.reactions.like}
      </Typography>
    </Button>
  );
}

interface DislikeButtonProps {
  comment: Comment;
}

function DislikeButton({ comment }: DislikeButtonProps) {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  const { mutate: toggleDislike } = useToggleCommentReactionMutation();

  return (
    <Button
      disabled={!!comment.deletedAt}
      onClick={() => {
        if (!authUser) {
          dispatch(
            openAlert({
              title: "Signup?",
              message: "You must signup to use this feature.",
              confirmButtonText: "signup",
              onConfirm: () => navigate("/signup"),
            })
          );
        } else {
          toggleDislike({ commentId: comment._id, reaction: comment.reaction === "dislike" ? null : "dislike" });
        }
      }}
      startIcon={
        comment.reaction === "dislike" ? (
          <UndislikeIcon sx={{ color: "primary.dark" }} fontSize="small" />
        ) : (
          <DislikeIcon sx={{ color: "text.secondary" }} fontSize="small" />
        )
      }
      sx={{
        textTransform: "none",
        minWidth: "64px",
        opacity: comment.deletedAt ? 0.7 : 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ userSelect: "none" }}>
        {comment.count.reactions.dislike}
      </Typography>
    </Button>
  );
}
