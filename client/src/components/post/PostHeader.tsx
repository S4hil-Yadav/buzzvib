import {
  Avatar,
  Stack,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Link as MuiLink,
  ListItemIcon,
  Badge,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  BookmarkBorderOutlined as SaveIcon,
  BookmarkOutlined as UnsaveIcon,
  DeleteOutlineOutlined as DeleteIcon,
  ReportGmailerrorredOutlined as ReportIcon,
  // BlockOutlined as BlockIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import dayjs from "@/lib/dayjs";
import { useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { useTogglePostSaveMutation } from "@/services/mutations/post.mutations";
import type { AuthUser, Post } from "@/types";
import { useDispatch } from "react-redux";
import { openAlert } from "@/redux/slices/alertSlice";

interface PostHeaderProps {
  post: Post;
  deletePostMutation: UseMutationResult<void, Error, { post: Post }, unknown>;
}

export default function PostHeader({ post, deletePostMutation }: PostHeaderProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  const { mutate: togglePostSave, isPending: isPendingToggleSave } = useTogglePostSaveMutation();
  const { mutate: deletePost, isPending: isPendingDeletePost } = deletePostMutation;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  function handleMenuClose() {
    setAnchorEl(null);
  }

  function handleTogglePostSave(post: Post) {
    handleMenuClose();
    if (!authUser) {
      dispatch(
        openAlert({
          title: "Signup Required",
          message: "Please signup to save posts.",
          confirmButtonText: "signup",
          onConfirm: () => navigate("/auth"),
        })
      );
      return;
    }
    togglePostSave({ post });
  }

  function handleDeletePost(post: Post) {
    handleMenuClose();
    dispatch(
      openAlert({
        title: "Delete Post?",
        message: "Are you sure you want to delete this post?",
        confirmButtonText: "delete",
        onConfirm: () => deletePost({ post }),
      })
    );
  }

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      pb={2}
      mb={2}
      borderBottom="1px solid"
      borderColor="divider"
    >
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <MuiLink component={RouterLink} to={post.author ? `/profile/${post.author.username}` : ""}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            badgeContent={
              post.author?.verified.profile ? (
                <VerifiedIcon
                  sx={{
                    color: theme => theme.palette.primary.main,
                    bgcolor: "background.paper",
                    borderRadius: "50%",
                    fontSize: 22,
                    p: 0.3,
                  }}
                />
              ) : null
            }
          >
            <Avatar src={post.author?.profilePicture} alt={post.author?.fullname} sx={{ width: 45, height: 45 }} />
          </Badge>
        </MuiLink>
        <Stack>
          <MuiLink
            component={RouterLink}
            to={post.author ? `/profile/${post.author.username}` : ""}
            underline="none"
            color="inherit"
          >
            <Typography variant="body2" fontWeight="bold">
              {post.author ? (
                <>
                  {post.author.fullname}
                  <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                    @{post.author.username}
                  </Typography>
                </>
              ) : (
                "[deleted]"
              )}
            </Typography>
          </MuiLink>
          <Typography variant="caption" color="text.secondary">
            {dayjs(post.createdAt).fromNow()}
          </Typography>
        </Stack>
      </Stack>

      <IconButton onClick={e => setAnchorEl(e.currentTarget)} disabled={!!post.deletedAt}>
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem onClick={() => handleTogglePostSave(post)} disabled={isPendingToggleSave || isPendingDeletePost}>
          <ListItemIcon>
            {isPendingToggleSave ? (
              <CircularProgress size={18} color="inherit" />
            ) : post.savedAt ? (
              <UnsaveIcon fontSize="small" />
            ) : (
              <SaveIcon fontSize="small" />
            )}
          </ListItemIcon>
          <Typography variant="body2" fontWeight={500}>
            {post.savedAt ? "Unsave Post" : "Save Post"}
          </Typography>
        </MenuItem>

        {post.author && authUser && post.author._id === authUser._id
          ? [
              <MenuItem key="1" onClick={() => handleDeletePost(post)} disabled={isPendingDeletePost}>
                <ListItemIcon>
                  {isPendingDeletePost ? (
                    <CircularProgress size={18} color="error" />
                  ) : (
                    <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
                  )}
                </ListItemIcon>
                <Typography variant="body2" fontWeight={500} color="error">
                  Delete Post
                </Typography>
              </MenuItem>,
            ]
          : [
              <MenuItem key="1" onClick={handleMenuClose}>
                <ListItemIcon>
                  <ReportIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body2" fontWeight={500}>
                  Report User
                </Typography>
              </MenuItem>,
              // <MenuItem onClick={handleMenuClose}>
              //   <ListItemIcon>
              //     <BlockIcon fontSize="small" color="error" />
              //   </ListItemIcon>
              //   <Typography variant="body2" fontWeight={500}>
              //     Block User
              //   </Typography>
              // </MenuItem>,
            ]}
      </Menu>
    </Stack>
  );
}
