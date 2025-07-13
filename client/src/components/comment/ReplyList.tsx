import { Box, Typography, List, ListItem } from "@mui/material";
import { useGetReplyIdsQuery } from "@/services/queries/comment.queries";
import CommentBody from "./CommentBody";
import CommentSkeletonList from "./CommentSkeleton";
import LoadingOrError from "../elements/LoadingOrError";
import type { Comment } from "@/types";

interface ReplyListProps {
  parent: Comment;
  postId: string;
  setEditAction: (comment: Comment) => void;
  setReplyAction: (comment: Comment) => void;
}

export default function ReplyList({ parent, postId, setEditAction, setReplyAction }: ReplyListProps) {
  const { data: commentIds, isLoading, isError, isFetching, refetch } = useGetReplyIdsQuery(parent._id);

  if (isLoading || isError || !commentIds) {
    return (
      <LoadingOrError
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError || !commentIds}
        LoadingComponent={<CommentSkeletonList count={Math.min(3, parent.count.replies)} isReply />}
        errorMessage="Failed to fetch replies"
        refetch={refetch}
      />
    );
  }

  if (commentIds.length === 0) {
    return (
      <Box sx={{ py: 0.5 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          No replies yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 0 }}>
      <List
        sx={{
          pl: 1,
          ml: -7.5, // aligns reply chain visually
          py: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderLeft: "1px solid",
          borderColor: theme => (theme.palette.mode === "dark" ? theme.palette.secondary.light : theme.palette.secondary.dark),
        }}
      >
        {commentIds.map(commentId => (
          <ListItem
            key={commentId}
            disableGutters
            sx={{
              px: 1,
              py: 0,
              flexDirection: "column",
              alignItems: "stretch",
            }}
          >
            <CommentBody
              postId={postId}
              commentId={commentId}
              parentId={parent._id}
              setEditAction={setEditAction}
              setReplyAction={setReplyAction}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
