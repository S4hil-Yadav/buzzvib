import { Box, Typography, List, ListItem } from "@mui/material";
import CommentBody from "./CommentBody";
import { LockOutline as PrivateAccountIcon, SearchOffOutlined as SearchOffIcon } from "@mui/icons-material";
import LoadingOrError from "@/components/elements/LoadingOrError";
import CommentSkeletonList from "./CommentSkeleton";
import React, { useEffect, useRef } from "react";
import type { Comment } from "@/types";
import axios from "axios";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";

interface CommentSectionProps {
  postId: string;
  getCommentIdsQuery: UseInfiniteQueryResult<Comment["_id"][]>;
  setEditAction: (comment: Comment) => void;
  setReplyAction: (comment: Comment) => void;
}

const CommentList = React.memo(({ postId, getCommentIdsQuery, setEditAction, setReplyAction }: CommentSectionProps) => {
  const {
    data: commentIds,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = getCommentIdsQuery;

  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && fetchNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading || isError || !commentIds) {
    const postNotFound =
      axios.isAxiosError(error) && ["INVALID_OBJECT_ID", "POST_NOT_FOUND"].includes(error.response?.data?.code);
    const privateUser = axios.isAxiosError(error) && error.response?.data?.code === "PRIVATE_USER";

    return (
      <LoadingOrError
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError || !commentIds}
        LoadingComponent={<CommentSkeletonList />}
        errorMessage={
          postNotFound ? (
            <Box sx={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 500, color: "text.secondary" }}>Post not found</Typography>
              <SearchOffIcon sx={{ fontSize: 25 }} />
            </Box>
          ) : privateUser ? (
            <Box sx={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 500, color: "text.secondary" }}>Private User</Typography>
              <PrivateAccountIcon sx={{ fontSize: 25 }} />
            </Box>
          ) : (
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 400, color: "text.secondary" }}>
              Failed to fetch this post
            </Typography>
          )
        }
        refetch={postNotFound || privateUser ? undefined : refetch}
      />
    );
  }

  if (commentIds.length === 0) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, py: 2 }}>
        <Typography variant="body1" color="text.secondary" fontWeight={500}>
          No comments yet
        </Typography>
        <SearchOffIcon sx={{ fontSize: 25, color: "text.secondary" }} />
      </Box>
    );
  }

  return (
    <List
      sx={{
        pl: { md: 1, xs: 0 },
        py: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {commentIds.map(commentId => (
        <ListItem key={commentId} disableGutters sx={{ py: 0, flexDirection: "column", alignItems: "stretch" }}>
          <CommentBody
            parentId={null}
            postId={postId}
            commentId={commentId}
            setEditAction={setEditAction}
            setReplyAction={setReplyAction}
          />
        </ListItem>
      ))}
      <Box ref={loaderRef} sx={{ width: "100%" }}>
        {isFetchingNextPage && <CommentSkeletonList />}
      </Box>
    </List>
  );
});

export default CommentList;
