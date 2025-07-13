import { Box, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  ShareOutlined as LinkIcon,
  Block as BlockIcon,
  ReportOutlined as ReportIcon,
  Edit as EditIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { useLogoutMutation } from "@/services/mutations/auth.mutations";
import { useDispatch } from "react-redux";
import { openAlert } from "@/redux/slices/alertSlice";
import { useQueryClient } from "@tanstack/react-query";
import type { FollowStatus, User, AuthUser } from "@/types";
import { useBlockFollowMutation } from "@/services/mutations/follow.mutations";

interface ProfileDropdownProps {
  user: User;
  followStatus: FollowStatus | undefined;
}

export default function ProfileDropdown({ user, followStatus }: ProfileDropdownProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  const location = useLocation();
  const { mutate: logout, isPending: isPendingLogout } = useLogoutMutation();
  const { mutate: blockFollow, isPending: isPendingBlockFollow } = useBlockFollowMutation();

  function handleBlockFollow() {
    setAnchorEl(null);

    if (!authUser) {
      dispatch(
        openAlert({
          title: "Signup?",
          message: "You must signup to use this feature.",
          confirmButtonText: "signup",
          onConfirm: () => navigate("/signup"),
        })
      );
      return;
    }

    if (!followStatus) return;

    dispatch(
      openAlert({
        title: "Block?",
        message: `Are you sure you want to block ${user.fullname}?`,
        confirmButtonText: "block",
        onConfirm: () => blockFollow({ user, followStatus }),
      })
    );
  }

  const isPending = isPendingLogout || isPendingBlockFollow;

  const open = Boolean(anchorEl);

  return (
    <Box position="absolute" top={16} right={16}>
      <IconButton onClick={e => setAnchorEl(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            navigator.clipboard
              .writeText(window.location.origin + `/profile/${user.username}`)
              .then(() => toast.success("Profile URL copied!"))
              .catch(() => toast.error("Failed to copy!"));
            setAnchorEl(null);
          }}
          disabled={isPending}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <LinkIcon fontSize="small" />
          <Typography variant="body2" fontWeight={500}>
            Share Profile
          </Typography>
        </MenuItem>

        {user.username === authUser?.username
          ? [
              <MenuItem
                key="1"
                component={RouterLink}
                to="/profile/edit"
                state={{ backgroundLocation: location }}
                onClick={() => setAnchorEl(null)}
                disabled={isPending}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <EditIcon fontSize="small" />
                <Typography variant="body2" fontWeight={500}>
                  Edit Profile
                </Typography>
              </MenuItem>,

              <MenuItem
                key="2"
                onClick={() => {
                  setAnchorEl(null);
                  dispatch(
                    openAlert({
                      title: "Logout?",
                      message: "Are you sure you want to logout?",
                      confirmButtonText: "logout",
                      onConfirm: () => logout(),
                    })
                  );
                }}
                disabled={isPending}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <LogoutIcon fontSize="small" sx={{ color: "error.main" }} />
                <Typography variant="body2" fontWeight={500} color="error.main">
                  Logout
                </Typography>
              </MenuItem>,
            ]
          : [
              <MenuItem
                key="1"
                onClick={() => setAnchorEl(null)}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
                disabled={isPending}
              >
                <ReportIcon fontSize="small" sx={{ color: "error.main" }} />
                <Typography variant="body2" fontWeight={500} color="error.main">
                  Report User
                </Typography>
              </MenuItem>,

              <MenuItem
                key="2"
                onClick={handleBlockFollow}
                disabled={isPending}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <BlockIcon fontSize="small" sx={{ color: "error.main" }} />
                <Typography variant="body2" fontWeight={500} color="error.main">
                  Block User
                </Typography>
              </MenuItem>,
            ]}
      </Menu>
    </Box>
  );
}
