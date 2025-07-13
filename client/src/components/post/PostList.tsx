import { Typography, Box, List } from "@mui/material";
import PostCard from "./PostCard";
import { SearchOffOutlined as SearchOffIcon } from "@mui/icons-material";
import LoadingOrError from "@/components/elements/LoadingOrError";
import { FetchNextPageOptions, InfiniteQueryObserverResult, QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import PostSkeleton from "./PostSkeleton";
import React, { useEffect, useRef } from "react";
import type { Post } from "@/types";

interface PostListProps {
  postIds: string[] | undefined;
  postCount?: number;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  refetch?: (options?: RefetchOptions) => Promise<QueryObserverResult>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: (options?: FetchNextPageOptions) => Promise<InfiniteQueryObserverResult<Post["_id"][]>>;
}

const PostList = React.memo(function ({
  postIds,
  postCount,
  isLoading = false,
  isFetching = false,
  isError = false,
  refetch,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: PostListProps) {
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && fetchNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (postCount === 0 || postIds?.length === 0) {
    return (
      <Box sx={{ mt: 5, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontSize: "1.25rem", fontWeight: 500, color: "text.secondary" }}>No posts found</Typography>
        <SearchOffIcon sx={{ fontSize: 25 }} />
      </Box>
    );
  }

  if (isLoading || isError || !postIds) {
    return (
      <Box sx={{ mb: 5, mt: { xs: 0, sm: 5 }, width: "100%" }}>
        <LoadingOrError
          isLoading={isLoading}
          isError={isError || !postIds}
          LoadingComponent={<PostSkeleton count={Math.min(3, postCount ?? 3)} />}
          errorMessage="Failed to fetch posts"
          isFetching={isFetching}
          refetch={refetch}
        />
      </Box>
    );
  }

  return (
    <List
      disablePadding
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: { xs: 0, sm: 5 },
        mt: { xs: 0, sm: 5 },
        mb: 5,
      }}
    >
      {postIds.map((postId, i) => (
        <Box key={postId} sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          {i === postIds.length - 2 && <Box ref={loaderRef} />}
          <PostCard postId={postId} />
        </Box>
      ))}
      {isFetchingNextPage && <PostSkeleton />}
    </List>
  );
});

export default PostList;
