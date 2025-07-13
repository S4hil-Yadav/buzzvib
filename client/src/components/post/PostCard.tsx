import { useGetPostQuery } from "@/services/queries/post.queries";
import PostSkeleton from "./PostSkeleton";
import PostHeader from "./PostHeader";
import PostBody from "./PostBody";
import PostFooter from "./PostFooter";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { LockOutline as PrivateAccountIcon, SearchOffOutlined as SearchOffIcon } from "@mui/icons-material";
import LoadingOrError from "@/components/elements/LoadingOrError";
import type { Post } from "@/types";
import axios from "axios";
import { useDeletePostMutation } from "@/services/mutations/post.mutations";

interface PostProps {
  postId: Post["_id"];
  isDialog?: boolean;
  handleToggleTab?: () => void;
}

export default function PostCard({ postId, isDialog = false, handleToggleTab }: PostProps) {
  const { data: post, isLoading, isFetching, isError, error, refetch } = useGetPostQuery(postId);

  const deletePostMutation = useDeletePostMutation();

  if (post?.deletedAt && !isDialog) {
    return null;
  }

  if (isFetching || isError || !post) {
    const postNotFound =
      axios.isAxiosError(error) && ["INVALID_OBJECT_ID", "POST_NOT_FOUND"].includes(error.response?.data?.code);
    const privateUser = axios.isAxiosError(error) && error.response?.data?.code === "PRIVATE_USER";

    return (
      <LoadingOrError
        isLoading={isDialog ? isFetching : isLoading}
        isError={isError || !post}
        LoadingComponent={<PostSkeleton count={1} stretch={isDialog} />}
        errorMessage={
          postNotFound ? (
            <Box sx={{ mt: 2, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 500, color: "text.secondary" }}>Post not found</Typography>
              <SearchOffIcon sx={{ fontSize: 25 }} />
            </Box>
          ) : privateUser ? (
            <Box sx={{ mt: 2, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 500, color: "text.secondary" }}>Private User</Typography>
              <PrivateAccountIcon sx={{ fontSize: 25 }} />
            </Box>
          ) : (
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 400, color: "text.secondary" }}>
              Failed to fetch this post
            </Typography>
          )
        }
        isFetching={isFetching}
        refetch={postNotFound || privateUser ? undefined : refetch}
      />
    );
  }

  return (
    <Card
      component={isDialog ? Card : "li"}
      sx={{
        width: "100%",
        maxWidth: isDialog ? "100%" : "40rem",
        boxShadow: 3,
        borderRadius: { xs: 0, lg: 3 },
        p: 3,
        pb: 0,
        mb: { xs: 0.2, sm: 5 },
        opacity: deletePostMutation.isPending ? 0.7 : 1,
        bgcolor: theme => (theme.palette.mode === "dark" ? theme.palette.background.default : theme.palette.background.paper),
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <PostHeader post={post} deletePostMutation={deletePostMutation} />
        <PostBody post={post} />
        <PostFooter post={post} handleToggleTab={handleToggleTab} />
        {/* {!isDialog && <CommentInput postId={postId} />} */}
      </CardContent>
    </Card>
  );
}
