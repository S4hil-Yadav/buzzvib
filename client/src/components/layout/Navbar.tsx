import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { AuthUser } from "@/types";
import { Box, Button, Drawer, SvgIconTypeMap, Typography, useMediaQuery, useTheme } from "@mui/material";
import {
  HomeOutlined as HomeIcon,
  SearchOutlined as SearchIcon,
  CreateOutlined as CreateIcon,
  NotificationsNoneOutlined as NotificationsIcon,
  AccountCircleOutlined as AccountIcon,
  SettingsOutlined as SettingsIcon,
  // ForumOutlined as ChatIcon,
} from "@mui/icons-material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { NavLink } from "react-router-dom";
import { useGetNotificationsQuery } from "@/services/queries/notification.queries";
import { useGetFollowerRequestsQuery } from "@/services/queries/follow.queries";

interface NavbarProps {
  navWidth: string;
}
export default function Navbar({ navWidth }: NavbarProps) {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Drawer
      variant="permanent"
      anchor={isMobile ? "bottom" : "left"}
      sx={{
        width: navWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: navWidth,
          height: isMobile ? 56 : "100vh",
          position: "fixed",
          bottom: isMobile ? 0 : "auto",
          left: isMobile ? "auto" : 0,
          right: isMobile ? "auto" : "unset",
          boxSizing: "border-box",
          zIndex: theme.zIndex.appBar,
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          alignItems: "center",
          justifyContent: isMobile ? "center" : "space-between",
          width: "100%",
          height: "100%",
          overflowX: "auto",
          overflowY: "clip",
          pl: isMobile ? 1 : 4,
          pr: isMobile ? 1 : 2,
          py: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            alignItems: isMobile ? "center" : "flex-start",
            gap: 1,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <LinkButton linkTo="/home" Icon={HomeIcon} />
          <LinkButton linkTo="/search" Icon={SearchIcon} />
          <LinkButton linkTo="/create" Icon={CreateIcon} />
          <LinkButton linkTo="/notifications" Icon={NotificationsIcon} />
          {/* {!isMobile && <LinkButton linkTo="/chat" Icon={ChatIcon} />} */}
          {isMobile && <LinkButton linkTo={`profile/${authUser?.username || ""}`} Icon={AccountIcon} />}
        </Box>

        {/* Bottom profile button */}
        {!isMobile && (
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "row" : "column",
              alignItems: isMobile ? "center" : "flex-start",
              gap: 1,
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <LinkButton linkTo="/settings" Icon={SettingsIcon} />
            <LinkButton linkTo={`/profile/${authUser?.username || ""}`} Icon={AccountIcon} />
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
interface LinkButtonProps {
  linkTo: string;
  Icon: OverridableComponent<SvgIconTypeMap<unknown, "svg">>;
}

function LinkButton({ linkTo, Icon }: LinkButtonProps) {
  const theme = useTheme();
  const isBelowTablet = useMediaQuery(theme.breakpoints.down("md"));

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return (
    <NavLink
      to={linkTo}
      style={({ isActive }) => ({
        textDecoration: "none",
        color: isActive ? theme.palette.primary.dark : theme.palette.text.secondary,
        fontWeight: isActive ? 700 : 600,
        backgroundColor: isActive ? theme.palette.action.selected : "transparent",
        borderRadius: "12px",
        display: "block",
        width: "100%",
      })}
    >
      <Button
        fullWidth
        variant="text"
        disableRipple={false}
        disableTouchRipple={false}
        sx={{
          position: "relative",
          minWidth: 0,
          justifyContent: isBelowTablet ? "center" : "flex-start",
          borderRadius: 2,
          paddingX: { xs: 1.5, md: 3 },
          paddingY: { xs: isBelowTablet ? 2 : 1.5, md: 1.8 },
          textTransform: "capitalize",
          fontWeight: 600,
          width: "100%",
          color: "inherit",

          "&:hover": {
            bgcolor: theme.palette.mode === "dark" ? theme.palette.action.hover : "grey.200",
            boxShadow: 2,
            color: theme.palette.primary.main,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          {linkTo === "/notifications" && authUser && <NotificationPing />}
          {Icon && <Icon sx={{ fontSize: isBelowTablet ? 28 : 24 }} />}
        </Box>
        <Typography
          variant="body1"
          component="span"
          sx={{
            ml: 2,
            display: { xs: "none", md: "block" },
            cursor: "pointer",
            fontWeight: 550,
            fontSize: "1.1rem",
          }}
        >
          {linkTo.split("/").filter(Boolean)[0]}
        </Typography>
      </Button>
    </NavLink>
  );
}

function NotificationPing() {
  const theme = useTheme();

  const { data: notifications } = useGetNotificationsQuery();
  const { data: followerRequests } = useGetFollowerRequestsQuery();

  const hasUnreadFollowRequest = useMemo(() => followerRequests?.some(req => !req.seenAt), [followerRequests]);
  const hasUnreadNotification = useMemo(() => notifications?.some(notification => !notification.seenAt), [notifications]);

  if (location.pathname !== "/notifications" && (hasUnreadFollowRequest || hasUnreadNotification)) {
    return (
      <>
        <Box
          sx={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 12,
            height: 12,
            bgcolor: theme.palette.primary.light,
            borderRadius: "50%",
            animation: "muiPing 1.5s infinite ease-in-out",
            opacity: 0.7,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 7,
            right: 7,
            width: 8,
            height: 8,
            bgcolor: theme.palette.primary.dark,
            borderRadius: "50%",
          }}
        />
      </>
    );
  }

  return null;
}
