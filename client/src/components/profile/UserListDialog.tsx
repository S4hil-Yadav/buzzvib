import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  Avatar,
  List,
  ListItem,
  Link as MuiLink,
  useMediaQuery,
  useTheme,
  IconButton,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useQueryClient, type UseInfiniteQueryResult } from "@tanstack/react-query";
import { useGetFollowersQuery, useGetFollowingQuery } from "@/services/queries/user.queries";
import UserSkeleton from "./UserSkeleton";
import type { AuthUser, ProfileUser, User } from "@/types";
import { useEffect, useRef, useState } from "react";
import { HandleFollowButton, RemoveFollowerButton } from "./UserActionButtons";
import LoadingOrError from "@/components/elements/LoadingOrError";
import { Close as CloseIcon, LockOutline as PrivateAccountIcon } from "@mui/icons-material";

interface UserListDialogProps {
  profileUser: ProfileUser;
  privateAccount: boolean;
  type: "followers" | "following";
  userCount: ProfileUser["count"]["followers"] | ProfileUser["count"]["following"];
}

export default function UserListDialog({ profileUser, privateAccount, userCount, type }: UserListDialogProps) {
  const [open, setOpen] = useState(false);

  function handleClose() {
    setOpen(false);
  }

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <>
      <Button onClick={() => setOpen(true)} size="small" variant="text" sx={{ flexDirection: "column", p: 1 }}>
        <Typography fontWeight={500} color="text.primary">
          {type === "followers" ? "Followers" : "Following"}
        </Typography>
        <Typography fontWeight={600} color="primary.dark">
          {userCount}
        </Typography>
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            height: 60,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box />
          <Typography sx={{ fontSize: 20, fontWeight: 500 }} textAlign="center">
            {type === "followers" ? "Followers" : "Following"}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, mt: 1 }}>
          {privateAccount ? (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
              <Typography fontWeight={500}>Private account</Typography>
              <PrivateAccountIcon />
            </Box>
          ) : type === "followers" ? (
            <FollowerList profileUser={profileUser} handleClose={handleClose} userCount={userCount} />
          ) : type === "following" ? (
            <FollowingList profileUser={profileUser} handleClose={handleClose} userCount={userCount} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface FollowerListProps {
  userCount: number;
  profileUser: ProfileUser;
  handleClose: () => void;
}
function FollowerList({ profileUser, handleClose, userCount }: FollowerListProps) {
  const getFollowersQuery = useGetFollowersQuery(profileUser);

  return (
    <UserList
      type="followers"
      userCount={userCount}
      profileUser={profileUser}
      handleClose={handleClose}
      getUsersQuery={getFollowersQuery}
    />
  );
}

interface FollowingListProps {
  userCount: UserListDialogProps["userCount"];
  profileUser: UserListDialogProps["profileUser"];
  handleClose: () => void;
}

function FollowingList({ profileUser, handleClose, userCount }: FollowingListProps) {
  const getFollowingQuery = useGetFollowingQuery(profileUser);

  return (
    <UserList
      type="following"
      userCount={userCount}
      profileUser={profileUser}
      handleClose={handleClose}
      getUsersQuery={getFollowingQuery}
    />
  );
}

interface UserListProps {
  type: UserListDialogProps["type"];
  userCount: UserListDialogProps["userCount"];
  profileUser: UserListDialogProps["profileUser"];
  handleClose: () => void;
  getUsersQuery: UseInfiniteQueryResult<User[]>;
}

function UserList({ type, userCount, profileUser, handleClose, getUsersQuery }: UserListProps) {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const { data: users, isLoading, isError, isFetching, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = getUsersQuery;

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
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (!userCount || users?.length === 0) {
    return (
      <Typography textAlign="center" color="text.secondary">
        {profileUser.username === authUser?.username ? `You don't have any ${type}` : `This user doesn't have any ${type}`}
      </Typography>
    );
  }

  if (isLoading || isError || !users) {
    return (
      <LoadingOrError
        isLoading={isLoading}
        isError={isError || !users}
        errorMessage={`Failed to fetch ${type}`}
        LoadingComponent={<UserSkeleton count={Math.min(10, userCount)} />}
        isFetching={isFetching}
        refetch={refetch}
      />
    );
  }

  return (
    <List disablePadding>
      {users!.map((user, i) => (
        <Box key={user._id} sx={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {i === users!.length - 4 && <Box ref={loaderRef} />}
          <ListItem
            disableGutters
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              py: 1.5,
              px: 1,
              borderTop: "1px solid",
              borderColor: "divider",
              ":first-of-type": { borderTop: 0 },
              // ":hover": { bgcolor: "background.default" },
            }}
          >
            <MuiLink
              component={RouterLink}
              onClick={handleClose}
              to={`/profile/${user.username}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flex: 1,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Avatar src={user.profilePicture} alt={user.fullname} sx={{ width: 46, height: 46 }} />
              <Box>
                <Typography fontWeight={600} noWrap>
                  {user.username}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user.fullname}
                </Typography>
              </Box>
            </MuiLink>

            {profileUser.username === authUser?.username && type === "followers" ? (
              <RemoveFollowerButton follower={user} />
            ) : (
              <HandleFollowButton user={user} />
            )}
          </ListItem>
        </Box>
      ))}
      {isFetchingNextPage && <UserSkeleton />}
    </List>
  );
}
