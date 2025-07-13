import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, CircularProgress } from "@mui/material";
import { openAlert } from "@/redux/slices/alertSlice";
import {
  useCreateFollowMutation,
  useRemoveFollowerMutation,
  useRemoveFollowMutation,
} from "@/services/mutations/follow.mutations";
import { useQueryClient } from "@tanstack/react-query";
import { useGetFollowStatusQuery } from "@/services/queries/follow.queries";
import { useCreatePrivateChatMutation } from "@/services/mutations/chat.mutations.ts";
import type { AuthUser, User } from "@/types";

interface HandleFollowButtonProps {
  user: User;
}

export function HandleFollowButton({ user }: HandleFollowButtonProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  const { data: followStatus } = useGetFollowStatusQuery(user.username);

  const { mutate: createFollow, isPending: isPendingCreateFollow } = useCreateFollowMutation();
  const { mutate: removeFollow, isPending: isPendingRemoveFollow } = useRemoveFollowMutation();

  const isPending = isPendingCreateFollow || isPendingRemoveFollow;

  if (!followStatus) return null;

  return (
    <Button
      disabled={user._id === authUser?._id || isPending}
      size="small"
      variant={followStatus.followingStatus ? "outlined" : "contained"}
      sx={{
        color: followStatus.followingStatus ? "primary.main" : "primary.contrastText",
        width: 80,
        height: 35,
        borderRadius: 2,
        textTransform: "capitalize",
        fontWeight: 400,
        fontSize: 15,
      }}
      onClick={() => {
        if (!authUser) {
          dispatch(
            openAlert({
              title: "Signup?",
              message: "You must signup to use this feature",
              confirmButtonText: "signup",
              onConfirm: () => navigate("/signup"),
            })
          );
        } else if (!followStatus.followingStatus) {
          createFollow({ following: user });
        } else if (followStatus.followingStatus === "requested") {
          dispatch(
            openAlert({
              title: "Withdraw Request?",
              message: `Are you sure you want to withdraw your follow request to ${user.fullname}`,
              confirmButtonText: "withdraw",
              onConfirm: () => removeFollow({ following: user, followingStatus: "requested" }),
            })
          );
        } else if (followStatus.followingStatus === "accepted") {
          dispatch(
            openAlert({
              title: "Unfollow?",
              message: `Are you sure you want to unfollow ${user.fullname}?`,
              confirmButtonText: "unfollow",
              onConfirm: () => removeFollow({ following: user, followingStatus: "accepted" }),
            })
          );
        }
      }}
    >
      {isPending ? (
        <CircularProgress size={15} sx={{ my: 0.5 }} />
      ) : user._id === authUser?._id ? (
        "You"
      ) : !followStatus.followingStatus ? (
        "Follow"
      ) : followStatus.followingStatus === "requested" ? (
        "Pending"
      ) : followStatus.followingStatus === "accepted" ? (
        "Following"
      ) : null}
    </Button>
  );
}

interface RemoveFollowerButtonProps {
  follower: User;
}

export function RemoveFollowerButton({ follower }: RemoveFollowerButtonProps) {
  const dispatch = useDispatch();
  const { mutate: removeFollower, isPending } = useRemoveFollowerMutation();

  return (
    <Button
      size="small"
      variant="contained"
      onClick={() => {
        dispatch(
          openAlert({
            title: "Remove Follower?",
            message: `Are you sure you want to remove ${follower.fullname}?`,
            confirmButtonText: "remove",
            onConfirm: () => removeFollower({ follower }),
          })
        );
      }}
      disabled={isPending}
      sx={{
        width: 80,
        height: 35,
        borderRadius: 2,
        textTransform: "capitalize",
        fontWeight: 400,
        fontSize: 15,
        bgcolor: "error.light",
        color: "primary.contrastText",
        "&:hover": {
          bgcolor: "error.main",
        },
      }}
    >
      {isPending ? <CircularProgress size={20} /> : "Remove"}
    </Button>
  );
}

interface MessageButtonProps {
  user: User;
}

export function MessageButton({ user }: MessageButtonProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);
  const { mutate: createPrivateChat, isPending } = useCreatePrivateChatMutation();

  return (
    <Button
      disabled
      // disabled={user._id === authUser?._id || isPending}
      size="small"
      variant="contained"
      sx={{
        color: "primary.contrastText",
        width: 80,
        height: 35,
        borderRadius: 2,
        textTransform: "capitalize",
        fontWeight: 400,
        fontSize: 15,
      }}
      onClick={() => {
        if (!authUser) {
          dispatch(
            openAlert({
              title: "Signup?",
              message: "You must signup to use this feature",
              confirmButtonText: "signup",
              onConfirm: () => navigate("/signup"),
            })
          );
        } else {
          createPrivateChat({ user });
        }
      }}
    >
      {isPending ? <CircularProgress size={15} sx={{ my: 0.5 }} /> : "Message"}
    </Button>
  );
}
