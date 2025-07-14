import { useSubmitCommentMutation } from "@/services/mutations/post.mutations";
import { useQueryClient } from "@tanstack/react-query";
import { Box, IconButton, TextareaAutosize, Typography } from "@mui/material";
import { SendOutlined as SendIcon, Close as CloseIcon } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { openAlert } from "@/redux/slices/alertSlice";
import { useNavigate } from "react-router-dom";
import type { Comment } from "@/types";
import { useEditCommentMutation, useSubmitReplyMutation } from "@/services/mutations/comment.mutations";
import React, { useState } from "react";

interface CommentInputProps {
  postId: string;
  action: "reply" | "edit" | null;
  actionTarget: Comment | null;
  resetAction: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  commentText: string;
  setCommentText: React.Dispatch<React.SetStateAction<string>>;
  disabled: boolean;
}

const CommentInput = React.memo(
  ({ postId, action, actionTarget, resetAction, inputRef, commentText, setCommentText, disabled }: CommentInputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const queryClient = useQueryClient();
    const authUser = queryClient.getQueryData(["authUser"]);

    const { mutateAsync: submitComment, isPending: isPendingSubmitComment } = useSubmitCommentMutation();
    const { mutateAsync: editComment, isPending: isPendingEditComment } = useEditCommentMutation();
    const { mutateAsync: submitReply, isPending: isPendingSubmitReply } = useSubmitReplyMutation();
    const isPending = isPendingEditComment || isPendingSubmitComment || isPendingSubmitReply;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const borderColor = disabled
      ? "background.paper"
      : isFocused
      ? "primary.dark"
      : isHovered
      ? "primary.main"
      : "background.paper";

    async function handleSubmit() {
      try {
        if (action === "reply") {
          await submitReply({ postId, commentId: actionTarget!._id, replyText: commentText });
        } else if (action === "edit") {
          await editComment({ commentId: actionTarget!._id, commentText });
        } else {
          await submitComment({ commentText, postId });
        }
        setCommentText("");
        resetAction();
      } catch {}
    }

    return (
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          width: "100%",
          borderRadius: 2,
          border: "1px solid",
          borderColor,
          bgcolor: theme => (theme.palette.mode === "light" ? "grey.200" : "background.paper"),
        }}
      >
        {action && (
          <Box
            sx={{
              pl: 1.5,
              pr: 1,
              py: 0.5,
              color: "text.primary",
              fontSize: "0.75rem",
              fontWeight: 500,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid",
              borderBottomColor: borderColor,
            }}
          >
            <Typography noWrap variant="caption">
              {action === "edit"
                ? `Editing comment: ${actionTarget!.text}`
                : action === "reply"
                ? `Replying to @${actionTarget!.commentor?.username} ?? [deleted]`
                : ""}
            </Typography>
            <IconButton size="small" onClick={resetAction}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Box
          component="form"
          onClick={() => inputRef.current?.focus()}
          onSubmit={e => {
            e.preventDefault();
            if (authUser) {
              handleSubmit();
            } else {
              dispatch(
                openAlert({
                  title: "Signup?",
                  message: "You must signup to use this feature.",
                  confirmButtonText: "signup",
                  onConfirm: () => navigate("/auth"),
                })
              );
            }
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 1,
          }}
        >
          <TextareaAutosize
            ref={inputRef}
            value={commentText}
            placeholder="Write a comment..."
            required={!!authUser}
            onChange={e => setCommentText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxRows={6}
            disabled={disabled || isPending}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: "1rem",
              padding: "0px 8px",
              fontWeight: 500,
              color: "inherit",
              fontFamily: "inherit",
            }}
          />
          <IconButton
            type="submit"
            disabled={disabled || isPending}
            sx={{
              bgcolor: "primary.dark",
              color: "white",
              "&:hover": {
                bgcolor: "primary.main",
              },
              opacity: isPending ? 0.6 : 1,
              cursor: isPending ? "progress" : "pointer",
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  }
);

export default CommentInput;
