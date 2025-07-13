import { Box, Avatar, Typography, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useRef, useEffect } from "react";
import LoadingOrError from "@/components/elements/LoadingOrError";
import FollowRequestSkeleton from "@/components/follow-request/FollowRequestSkeleton";
import type { FollowRequest } from "@/types";
import {
  type FetchNextPageOptions,
  type InfiniteQueryObserverResult,
  type QueryObserverResult,
  type RefetchOptions,
} from "@tanstack/react-query";
import { SenderHandleButtons, UnblockFollowButton, WithdrawRequestButton } from "./RequestActionButtons";

interface RequestListProps {
  requestType: "follower" | "following" | "blocked";
  closeDialog: () => void;
  followRequests: FollowRequest[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<FollowRequest[]>>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: (options?: FetchNextPageOptions) => Promise<InfiniteQueryObserverResult<FollowRequest[]>>;
}

export default function RequestList({
  requestType,
  closeDialog,
  followRequests,
  isLoading,
  isError,
  isFetching,
  refetch,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: RequestListProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
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

  if (isLoading || isError || !followRequests) {
    return (
      <LoadingOrError
        isLoading={isLoading}
        isError={isError || !followRequests}
        errorMessage="Failed to fetch requests"
        LoadingComponent={<FollowRequestSkeleton />}
        isFetching={isFetching}
        refetch={refetch}
      />
    );
  }

  return (
    <Box component="ul" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {followRequests.map(req => (
        <Box
          component="li"
          key={req.user._id}
          sx={{
            p: 2,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "background.paper",
            border: requestType !== "follower" || req.seenAt ? "1px solid" : "2px solid",
            borderColor: requestType !== "follower" || req.seenAt ? "divider" : "primary.dark",
            transition: "background-color 0.2s ease",
          }}
        >
          <MuiLink
            component={RouterLink}
            to={`/profile/${req.user.username}`}
            onClick={closeDialog}
            sx={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
              flex: 1,
            }}
          >
            <Avatar src={req.user.profilePicture} alt={req.user.fullname} sx={{ width: 50, height: 50 }} />
            <Box ml={2}>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                {req.user.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {req.user.fullname}
              </Typography>
            </Box>
          </MuiLink>

          {requestType === "follower" ? (
            <SenderHandleButtons sender={req.user} />
          ) : requestType === "following" ? (
            <WithdrawRequestButton receiver={req.user} />
          ) : requestType === "blocked" ? (
            <UnblockFollowButton user={req.user} />
          ) : null}
        </Box>
      ))}

      <Box ref={loaderRef}>{isFetchingNextPage && <FollowRequestSkeleton />}</Box>
    </Box>
  );
}
