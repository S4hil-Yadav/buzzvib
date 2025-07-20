import { Avatar, Typography, Link as MuiLink, Stack, Badge } from "@mui/material";
import { Verified as VerifiedIcon } from "@mui/icons-material";
import { useDeleteCommentMutation } from "@/services/mutations/comment.mutations";
import { Link as RouterLink } from "react-router-dom";
import TextWithExpand from "@/components/elements/TextWithExpand";
import type { Comment } from "@/types";
import LoadingOrError from "@/components/elements/LoadingOrError";
import { useGetCommentQuery } from "@/services/queries/comment.queries";
import CommentDropdown from "./CommentDropdown";
import CommentSkeleton from "./CommentSkeleton";
import CommentFooter from "./CommentFooter";
import dayjs from "@/lib/dayjs";

interface CommentBodyProps {
  postId: string;
  commentId: Comment["_id"];
  parentId: Comment["_id"] | null;
  setEditAction: (comment: Comment) => void;
  setReplyAction: (comment: Comment) => void;
}

export default function CommentBody({ postId, commentId, parentId, setEditAction, setReplyAction }: CommentBodyProps) {
  const deleteCommentMutation = useDeleteCommentMutation();
  const { data: comment, isLoading, isFetching, isError, refetch } = useGetCommentQuery(commentId);

  if (isLoading || isError || !comment) {
    return (
      <LoadingOrError
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError || !comment}
        LoadingComponent={<CommentSkeleton count={3} />}
        errorMessage="Failed to fetch this comment"
        refetch={refetch}
      />
    );
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        width: "100%",
        mt: 2,
        opacity: deleteCommentMutation.isPending ? 0.6 : 1,
      }}
    >
      <MuiLink
        component={RouterLink}
        to={comment.commentor ? `/profile/${comment.commentor.username}` : ""}
        sx={{ display: "inline-block" }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          badgeContent={
            comment.commentor?.verified.profile ? (
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
          <Avatar
            src={comment.commentor?.profilePicture?.displayUrl}
            alt={comment.commentor?.fullname}
            sx={{ width: 45, height: 45 }}
          />
        </Badge>
      </MuiLink>

      <Stack spacing={1} flex={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Stack>
              <MuiLink
                component={RouterLink}
                to={comment.commentor ? `/profile/${comment.commentor.username}` : ""}
                underline="none"
                color="inherit"
              >
                <Typography variant="body2" fontWeight="bold">
                  {comment.commentor ? (
                    <>
                      {comment.commentor.fullname}
                      <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                        @{comment.commentor.username}
                      </Typography>
                    </>
                  ) : (
                    "[deleted]"
                  )}
                </Typography>
              </MuiLink>

              <Typography variant="caption" color="text.secondary">
                {dayjs(comment.createdAt).fromNow()}
                {comment.editedAt && " • edited"}
              </Typography>
            </Stack>
          </Stack>

          <CommentDropdown
            postId={postId}
            comment={comment}
            parentId={parentId}
            deleteCommentMutation={deleteCommentMutation}
            setEditAction={setEditAction}
            setReplyAction={setReplyAction}
          />
        </Stack>

        <TextWithExpand originalText={comment.deletedAt ? "[deleted comment]" : comment.text} minHeight={4.5} />

        <CommentFooter postId={postId} comment={comment} setEditAction={setEditAction} setReplyAction={setReplyAction} />
      </Stack>
    </Stack>
  );
}
