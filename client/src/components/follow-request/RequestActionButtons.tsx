import { CheckCircleOutline as AcceptIcon, CancelOutlined as RejectIcon } from "@mui/icons-material";
import { Box, IconButton, CircularProgress, Button } from "@mui/material";
import {
  useAcceptFollowRequestMutation,
  useRejectFollowRequestMutation,
  useRemoveFollowMutation,
  useUnblockFollowMutation,
} from "@/services/mutations/follow.mutations";
import type { User } from "@/types";
import { openAlert } from "@/redux/slices/alertSlice";
import { useDispatch } from "react-redux";

interface SenderRequestHandleButtonsProps {
  sender: User;
}
export function SenderHandleButtons({ sender }: SenderRequestHandleButtonsProps) {
  const { mutate: acceptFollowRequest, isPending: isAccepting } = useAcceptFollowRequestMutation();
  const { mutate: rejectFollowRequest, isPending: isRejecting } = useRejectFollowRequestMutation();

  return (
    <Box display="flex" gap={1}>
      <IconButton
        size="small"
        onClick={() => rejectFollowRequest({ follower: sender })}
        disabled={isAccepting || isRejecting}
        sx={{ color: "error.main" }}
      >
        {isRejecting ? <CircularProgress size={24} color="error" /> : <RejectIcon sx={{ fontSize: 32 }} />}
      </IconButton>
      <IconButton
        size="small"
        onClick={() => acceptFollowRequest({ follower: { ...sender } })}
        disabled={isAccepting || isRejecting}
        sx={{ color: "success.main" }}
      >
        {isAccepting ? <CircularProgress size={24} color="success" /> : <AcceptIcon sx={{ fontSize: 32 }} />}
      </IconButton>
    </Box>
  );
}

interface WithdrawRequestButtonProps {
  receiver: User;
}
export function WithdrawRequestButton({ receiver }: WithdrawRequestButtonProps) {
  const { mutate: removeFollow, isPending } = useRemoveFollowMutation();

  const dispatch = useDispatch();

  return (
    <Button
      disabled={isPending}
      size="small"
      variant="outlined"
      sx={{
        color: "primary.main",
        width: 80,
        height: 35,
        borderRadius: 2,
        textTransform: "capitalize",
        fontWeight: 400,
        fontSize: 15,
      }}
      onClick={() => {
        dispatch(
          openAlert({
            title: "Withdraw Request?",
            message: `Are you sure you want to withdraw your follow request to ${receiver.fullname}`,
            confirmButtonText: "withdraw",
            onConfirm: () => removeFollow({ following: receiver, followingStatus: "requested" }),
          })
        );
      }}
    >
      {isPending ? <CircularProgress size={15} sx={{ my: 0.5 }} /> : "Pending"}
    </Button>
  );
}

interface UnblockFollowButtonProps {
  user: User;
}
export function UnblockFollowButton({ user }: UnblockFollowButtonProps) {
  const { mutate: unblockFollow, isPending } = useUnblockFollowMutation();

  const dispatch = useDispatch();

  return (
    <Button
      disabled={isPending}
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
        dispatch(
          openAlert({
            title: "Unblock?",
            message: `Are you sure you want to unblock ${user.fullname}`,
            confirmButtonText: "unblock",
            onConfirm: () => unblockFollow({ user }),
          })
        );
      }}
    >
      {isPending ? <CircularProgress size={15} sx={{ my: 0.5 }} /> : "Unblock"}
    </Button>
  );
}
