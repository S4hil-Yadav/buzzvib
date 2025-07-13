import { Box, Button, IconButton, Typography } from "@mui/material";
import {
  ThumbUpOffAltOutlined as LikeIcon,
  ThumbUpAlt as UnlikeIcon,
  ThumbDownOffAltOutlined as DislikeIcon,
  ThumbDownAlt as UndislikeIcon,
  ShareOutlined as ShareIcon,
  ChatBubbleOutlineOutlined as CommentIcon,
} from "@mui/icons-material";
import { useTogglePostReactionMutation } from "@/services/mutations/post.mutations";
import { useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { AuthUser, Post } from "@/types";
import { useDispatch } from "react-redux";
import { openAlert } from "@/redux/slices/alertSlice";

interface PostFooterProps {
  post: Post;
  handleToggleTab?: () => void;
}

export default function PostFooter({ post, handleToggleTab }: PostFooterProps) {
  return (
    <Box display="flex" width="100%" justifyContent="space-between" py={3}>
      <Box display="flex" bgcolor="action.selected" borderRadius={2}>
        <LikeButton post={post} />
        <DislikeButton post={post} />
      </Box>
      <CommentButton post={post} handleToggleTab={handleToggleTab} />
      <ShareButton post={post} />
    </Box>
  );
}

function LikeButton({ post }: { post: Post }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);
  const { mutate: togglePostReaction } = useTogglePostReactionMutation();

  function handleTogglePostReaction() {
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

    togglePostReaction({ postId: post._id, reaction: post.reaction === "like" ? null : "like" });
  }

  return (
    <Button
      disabled={!!post.deletedAt}
      onClick={handleTogglePostReaction}
      startIcon={
        post.reaction === "like" ? (
          <UnlikeIcon sx={{ color: "primary.dark" }} fontSize="small" />
        ) : (
          <LikeIcon sx={{ color: "text.secondary" }} fontSize="small" />
        )
      }
      sx={{
        borderRadius: "8px 0 0 8px",
        border: "1px solid",
        borderColor: "divider",
        borderRight: "none",
        px: 2,
        py: 1,
        textTransform: "none",
        minWidth: "64px",
        bgcolor: "background.paper",
        "&:hover": {
          bgcolor: "action.hover",
        },
        opacity: post.deletedAt ? 0.7 : 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ userSelect: "none" }}>
        {post.count.reactions.like}
      </Typography>
    </Button>
  );
}

function DislikeButton({ post }: { post: Post }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);
  const { mutate: togglePostReaction } = useTogglePostReactionMutation();

  function handleTogglePostReaction() {
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

    togglePostReaction({ postId: post._id, reaction: post.reaction === "dislike" ? null : "dislike" });
  }

  return (
    <Button
      disabled={!!post.deletedAt}
      onClick={handleTogglePostReaction}
      startIcon={
        post.reaction === "dislike" ? (
          <UndislikeIcon sx={{ color: "primary.dark" }} fontSize="small" />
        ) : (
          <DislikeIcon sx={{ color: "text.secondary" }} fontSize="small" />
        )
      }
      sx={{
        borderRadius: "0 8px 8px 0",
        border: "1px solid",
        borderColor: "divider",
        px: 2,
        py: 1,
        textTransform: "none",
        minWidth: "64px",
        bgcolor: "background.paper",
        "&:hover": {
          bgcolor: "action.hover",
        },
        opacity: post.deletedAt ? 0.7 : 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ userSelect: "none" }}>
        {post.count.reactions.dislike}
      </Typography>
    </Button>
  );
}

function CommentButton({ post, handleToggleTab }: { post: Post; handleToggleTab?: () => void }) {
  const location = useLocation();

  return (
    <Button
      disabled={!!post.deletedAt}
      component={RouterLink}
      to={`/post/${post._id}`}
      state={{ backgroundLocation: location, noScroll: true }}
      startIcon={<CommentIcon sx={{ color: "text.primary" }} fontSize="small" />}
      onClick={e => {
        if (handleToggleTab) {
          e.preventDefault();
          handleToggleTab();
        }
      }}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        px: 2,
        py: 1,
        borderRadius: 2,
        textTransform: "none",
        minWidth: "64px",
        bgcolor: "background.paper",
        "&:hover": {
          bgcolor: "action.hover",
        },
        opacity: post.deletedAt ? 0.7 : 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {post.count.comments}
      </Typography>
    </Button>
  );
}

function ShareButton({ post }: { post: Post }) {
  return (
    <IconButton
      disabled={!!post.deletedAt}
      onClick={() =>
        navigator.clipboard
          .writeText(`${window.location.origin}/post/${post._id}`)
          .then(() => toast.success("Post url copied to clipboard"))
          .catch(() => toast.error("Failed to copy URL"))
      }
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 1,
        bgcolor: "background.paper",
        "&:hover": {
          bgcolor: "action.hover",
        },
        opacity: post.deletedAt ? 0.7 : 1,
      }}
    >
      <ShareIcon sx={{ color: "text.primary" }} fontSize="small" />
    </IconButton>
  );
}
