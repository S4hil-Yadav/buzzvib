import { Paper, Box } from "@mui/material";
import CommentInput from "@/components/post/CommentInput";
import CommentList from "./CommentList";
import type { Comment } from "@/types";
import { useCallback, useRef, useState } from "react";
import { useGetCommentIdsQuery } from "@/services/queries/post.queries";
import axios from "axios";

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [action, setAction] = useState<"reply" | "edit" | null>(null);
  const [actionTarget, setActionTarget] = useState<Comment | null>(null);
  const [commentText, setCommentText] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getCommentIdsQuery = useGetCommentIdsQuery(postId);

  const setEditAction = useCallback((comment: Comment) => {
    setAction("edit");
    setActionTarget(comment);
    requestAnimationFrame(() => {
      setCommentText(comment.text ?? "");
      inputRef.current?.focus();
    });
  }, []);

  const setReplyAction = useCallback((comment: Comment) => {
    setAction("reply");
    setActionTarget(comment);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const resetAction = useCallback(() => {
    setAction(null);
    setActionTarget(null);
  }, []);

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        mt: { xs: 0, lg: 2 },
        py: { xs: 1, lg: 2 },
        borderRadius: { xs: 0, lg: 2 },
        maxHeight: { xs: "100%", lg: "88vh" },
        bgcolor: theme => (theme.palette.mode === "dark" ? theme.palette.background.default : theme.palette.background.paper),
      }}
    >
      <Box
        sx={{
          px: 2,
          mr: 1,
          height: "100vh",
          flexGrow: 1,
          overflowY: "auto",
          textAlign: "justify",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: "3px",
          },
        }}
      >
        <CommentList
          postId={postId}
          getCommentIdsQuery={getCommentIdsQuery}
          setEditAction={setEditAction}
          setReplyAction={setReplyAction}
        />
      </Box>

      <Box sx={{ mt: 1, px: 2 }}>
        <CommentInput
          inputRef={inputRef}
          commentText={commentText}
          setCommentText={setCommentText}
          postId={postId}
          action={action}
          actionTarget={actionTarget}
          resetAction={resetAction}
          disabled={
            axios.isAxiosError(getCommentIdsQuery.error) &&
            ["PRIVATE_USER", "POST_NOT_FOUND"].includes(getCommentIdsQuery.error.response?.data?.code)
          }
        />
      </Box>
    </Paper>
  );
}
