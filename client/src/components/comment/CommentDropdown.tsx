import { Menu, MenuItem, IconButton, Typography, ListItemIcon } from "@mui/material";
import {
  MoreVert as DropdownIcon,
  EditOutlined as EditIcon,
  Reply as ReplyIcon,
  DeleteOutline as DeleteIcon,
  // Block as BlockIcon,
  ReportOutlined as ReportIcon,
} from "@mui/icons-material";
import { UseMutationResult, useQueryClient } from "@tanstack/react-query";
import type { AuthUser, Comment, Post } from "@/types";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { openAlert } from "@/redux/slices/alertSlice";

interface CommentDropdownProps {
  comment: Comment;
  postId: Post["_id"];
  parentId: Comment["_id"] | null;
  setEditAction: (comment: Comment) => void;
  setReplyAction: (comment: Comment) => void;
  deleteCommentMutation: UseMutationResult<
    void,
    Error,
    { commentId: Comment["_id"]; postId: Post["_id"]; parentId: Comment["_id"] | null },
    unknown
  >;
}

export default function CommentDropdown({
  comment,
  postId,
  parentId,
  setEditAction,
  setReplyAction,
  deleteCommentMutation,
}: CommentDropdownProps) {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const dispatch = useDispatch();

  const { mutate: handleDeleteComment, isPending } = deleteCommentMutation;

  function handleOpen(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  return (
    <>
      <IconButton size="small" onClick={handleOpen} disabled={isPending || !!comment.deletedAt}>
        <DropdownIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            setReplyAction(comment);
            handleClose();
          }}
        >
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Reply</Typography>
        </MenuItem>
        {authUser && authUser._id === comment.commentor?._id
          ? [
              <MenuItem
                key="1"
                onClick={() => {
                  handleClose();
                  setEditAction(comment);
                }}
              >
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Edit Comment</Typography>
              </MenuItem>,
              <MenuItem
                key="2"
                onClick={() => {
                  handleClose();
                  dispatch(
                    openAlert({
                      title: "Delete Comment?",
                      message: "Are you sure you want to delete this comment",
                      confirmButtonText: "delete",
                      onConfirm: () => handleDeleteComment({ postId, commentId: comment._id, parentId }),
                    })
                  );
                }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body2" color="error">
                  Delete Comment
                </Typography>
              </MenuItem>,
            ]
          : [
              <MenuItem key="1" onClick={handleClose}>
                <ListItemIcon>
                  <ReportIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body2" color="error">
                  Report User
                </Typography>
              </MenuItem>,
              // <MenuItem key="2" onClick={handleClose}>
              //   <ListItemIcon>
              //     <BlockIcon fontSize="small" color="error" />
              //   </ListItemIcon>
              //   <Typography variant="body2" color="error">
              //     Block User
              //   </Typography>
              // </MenuItem>,
            ]}
      </Menu>
    </>
  );
}
