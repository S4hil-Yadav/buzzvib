import { Box, Typography, Avatar, Card, Tabs, Tab, Badge } from "@mui/material";
import {
  LockOutline as PrivateAccountIcon,
  SearchOffOutlined as SearchOffIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useGetLikedPostIdsQuery, useGetUserPostIdsQuery, useGetProfileUserQuery } from "@/services/queries/user.queries";
import PostList from "@/components/post/PostList";
import type { FollowStatus, User, AuthUser } from "@/types";
import { HandleFollowButton, MessageButton } from "@/components/profile/UserActionButtons";
import LoadingOrError from "@/components/elements/LoadingOrError";
import ProfileUserSkeleton from "@/components/profile/ProfileUserSkeleton";
import UserListDialog from "@/components/profile/UserListDialog";
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import React, { useState } from "react";
import axios from "axios";

type Tab = "posts" | "likes";
const tabs: Tab[] = ["posts", "likes"];

export default function ProfilePage() {
  const { username = "" } = useParams();

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);
  const [tab, setTab] = useState<Tab>("posts");

  const { data: user, isLoading, isError, isFetching, error, refetch } = useGetProfileUserQuery(username);

  const followStatus = queryClient.getQueryData<FollowStatus>(["followStatus", username]);

  const userIsBlocked = followStatus?.followingStatus === "blocked";
  const userhasBlocked = followStatus?.followerStatus === "blocked";

  if (isLoading || isError || !user) {
    const userNotFound = axios.isAxiosError(error) && error.response?.data?.code === "USER_NOT_FOUND";
    return (
      <LoadingOrError
        isLoading={isLoading}
        isError={isError || !user}
        errorMessage={
          userIsBlocked ? (
            "You have blocked this user"
          ) : userhasBlocked ? (
            "You have been blocked by this user"
          ) : userNotFound ? (
            <Box sx={{ mt: 2, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 500, color: theme => theme.palette.text.secondary }}>
                User not found
              </Typography>
              <SearchOffIcon sx={{ fontSize: 25 }} />
            </Box>
          ) : (
            "Failed to fetch this user"
          )
        }
        LoadingComponent={<ProfileUserSkeleton />}
        isFetching={isFetching}
        refetch={userIsBlocked || userhasBlocked || userNotFound ? undefined : refetch}
      />
    );
  }

  const userBase: User = {
    _id: user._id,
    username: user.username,
    fullname: user.fullname,
    profilePicture: user.profilePicture,
    verified: { profile: user.verified.profile },
  };

  const privateAccount =
    user.privacy.account.visibility === "private" &&
    user.username !== authUser?.username &&
    followStatus?.followingStatus !== "accepted";

  return (
    <Box display="flex" flexDirection={{ xs: "column", lg: "row-reverse" }} minHeight="100vh" width="100%">
      {/* Sidebar */}
      <Box
        sx={{
          width: { xs: "100%", lg: 340 },
          height: { xs: "auto", lg: "100vh" },
          bgcolor: "background.paper",
          borderLeft: { lg: "1px solid" },
          borderBottom: { xs: "1px solid", lg: 0 },
          borderColor: theme => ({ xs: theme.palette.divider, lg: theme.palette.divider }),
          display: "flex",
          flexDirection: "column",
          gap: 3,
          px: 3.5,
          pt: 2,
          pb: { xs: 4 },
          position: { lg: "fixed" },
          right: 0,
          top: 0,
          zIndex: 10,
          overflow: "auto",
        }}
      >
        <ProfileDropdown user={userBase} followStatus={followStatus} />
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} pt={3}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            badgeContent={
              user.verified.profile ? (
                <VerifiedIcon
                  sx={{
                    color: theme => theme.palette.primary.main,
                    bgcolor: "background.paper",
                    borderRadius: "50%",
                    fontSize: 35,
                    p: 0.3,
                  }}
                />
              ) : null
            }
          >
            <Avatar
              src={user.profilePicture?.originalUrl}
              sx={{
                width: 120,
                height: 120,
                border: theme => `4px double ${theme.palette.primary.light}`,
              }}
            />
          </Badge>

          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold">
              {user.fullname}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{user.username}
            </Typography>
          </Box>
          {user.username !== authUser?.username && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <HandleFollowButton user={userBase} />
              <MessageButton user={user} />
            </Box>
          )}
        </Box>

        {/* Stats */}
        <Card variant="outlined" sx={{ mt: 1, flexShrink: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-around", py: 1 }}>
            <Box textAlign="center" p={1}>
              <Typography fontWeight={500}>Posts</Typography>
              <Typography fontWeight={600} color="primary.dark">
                {user.count.posts}
              </Typography>
            </Box>
            <UserListDialog
              type="followers"
              privateAccount={privateAccount}
              profileUser={user}
              userCount={user.count.followers}
            />
            <UserListDialog
              type="following"
              privateAccount={privateAccount}
              profileUser={user}
              userCount={user.count.following}
            />
          </Box>
        </Card>

        <Card
          variant="outlined"
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 3,
            bgcolor: "background.paper",
            boxShadow: 2,
            borderColor: "primary.light",
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" fontWeight="bold" mb={1}>
            About
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            whiteSpace="pre-wrap"
            sx={{
              lineHeight: 1.6,
              textAlign: "justify",
              px: 1,
              wordBreak: "break-word",
            }}
          >
            {user.bio || <i>Bio not added yet.</i>}
          </Typography>
        </Card>
      </Box>

      {/* Posts Section */}
      <Box sx={{ width: "100%", pr: { lg: "360px" } }}>
        {privateAccount ? (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 4 }}>
            <Typography fontWeight={500}>Private account</Typography>
            <PrivateAccountIcon />
          </Box>
        ) : (
          <>
            <Tabs
              value={tab}
              onChange={(_, newValue) => setTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mt: 2,
                ".MuiTabs-flexContainer": { justifyContent: "center" },
                ".MuiTab-root": {
                  fontWeight: 500,
                  fontSize: 15,
                  textTransform: "none",
                  color: "text.primary",
                  px: 1,
                  "&.Mui-selected": { color: "primary.dark" },
                  "&:hover": { color: "primary.main" },
                },
                ".MuiTabs-indicator": {
                  height: 3,
                  borderRadius: 2,
                  bgcolor: "primary.dark",
                },
              }}
            >
              {tabs.map(t => (
                <Tab
                  key={t}
                  value={t}
                  label={t === "posts" ? "Posts" : "Likes"}
                  sx={{
                    bgcolor: "background.paper",
                    border: theme => `1px solid ${theme.palette.divider}`,
                    ...(t === "posts" ? { borderRight: "none" } : {}),
                  }}
                />
              ))}
            </Tabs>

            <Box sx={{ mb: 5 }} />

            {tab === "posts" ? (
              <UserPostList postCount={user.count.posts} />
            ) : tab === "likes" ? (
              user.privacy.showLikes || user.username === authUser?.username ? (
                <LikedPostList />
              ) : (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Typography>{user.fullname} doesn't allow viewing their likes</Typography>
                </Box>
              )
            ) : null}
          </>
        )}
      </Box>
    </Box>
  );
}

const UserPostList = React.memo(({ postCount }: { postCount: number }) => {
  const { username = "" } = useParams();
  const {
    data: postIds,
    isLoading,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetUserPostIdsQuery(username);

  return (
    <PostList
      postIds={postIds}
      postCount={postCount}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      refetch={refetch}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
});

const LikedPostList = React.memo(() => {
  const { username = "" } = useParams();
  const {
    data: postIds,
    isLoading,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetLikedPostIdsQuery(username);

  return (
    <PostList
      postIds={postIds}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      refetch={refetch}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
});
