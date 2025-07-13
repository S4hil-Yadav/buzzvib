import { Avatar, Box, Typography, Link as MuiLink } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useLocation } from "react-router-dom";
import type { AuthUser } from "@/types";

export default function ProfileSection() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"])!;
  const location = useLocation();

  return (
    <MuiLink
      component={RouterLink}
      to="/profile/edit"
      state={{ backgroundLocation: location }}
      underline="none"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: "action.hover",
        color: "text.primary",
        cursor: "pointer",
        transition: theme =>
          theme.transitions.create(["background-color", "opacity"], {
            duration: theme.transitions.duration.short,
          }),
        "&:hover": {
          opacity: 0.9,
        },
      }}
    >
      <Avatar src={authUser.profilePicture} alt={authUser.fullname} sx={{ width: 48, height: 48 }} />
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          {authUser.fullname}
          <Typography component="span" variant="caption" ml={1}>
            @{authUser.username}
          </Typography>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {authUser.bio || <i>Add a bio</i>}
        </Typography>
      </Box>
    </MuiLink>
  );
}
