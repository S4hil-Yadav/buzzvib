import Navbar from "@/components/layout/Navbar";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AuthPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/ProfilePage";
import CreatePostPage from "@/pages/CreatePostPage";
import { excludeSidebarRoutes, excludeSideNavbarRoutes } from "@/utils/routes";
import SearchPage from "@/pages/SearchPage";
import NotificationPage from "@/pages/NotificationPage";
import Sidebar from "@/components/layout/Sidebar";
import SettingsPage from "@/pages/SettingsPage";
import { useGetAuthQuery } from "@/services/queries/auth.queries";
import PostDialog from "@/components/post/PostDialog";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import SavedPostsPage from "@/pages/SavedPostsPage";
import LikedPostsPage from "@/pages/LikedPostsPage";
import RestrictedPage from "@/pages/RestrictedPage";
import { Box, CircularProgress, useMediaQuery } from "@mui/material";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import type { AuthUser } from "@/types";
import NotFoundPage from "@/pages/NotFoundPage";
import DislikedPostsPage from "@/pages/DislikedPostsPage";

export default function App() {
  const { data: authUser, isLoading, isSuccess } = useGetAuthQuery();

  const location = useLocation();
  const navLoc: string = location.state?.backgroundLocation ? location.state?.backgroundLocation.pathname : location.pathname;
  const navLocArr = navLoc.split("/").filter(Boolean);

  const includeNavbar = !excludeSideNavbarRoutes.includes(navLocArr[0] || "");
  const includeSidebar =
    (!isSuccess && navLocArr.length === 1 && ["profile", "edit-profile"].includes(navLocArr[0])) ||
    !excludeSidebarRoutes.includes(navLoc.split("/").filter(Boolean)[0] || "");

  const isMobile = useMediaQuery(theme => theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme => theme.breakpoints.between("sm", "md"));
  const isBelowLarge = useMediaQuery(theme => theme.breakpoints.down("lg"));

  const navWidth = isMobile ? "100%" : isTablet ? "7.5rem" : "18.75rem";

  if (isLoading) {
    return (
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <CircularProgress size={48} thickness={4} color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
      {/* Make header here if required */}

      <Box
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: isMobile ? "column" : "row",
          width: "100%",
          overflowX: "hidden",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {includeNavbar && <Navbar navWidth={navWidth} />}
        <Box
          component="main"
          sx={{
            display: "flex",
            flexGrow: 1,
            mb: isMobile ? "56px" : 0,
            width: "100%",
          }}
        >
          <PageRoutes authUser={authUser} />
        </Box>

        {!isBelowLarge && includeSidebar && <Sidebar />}
      </Box>
    </Box>
  );
}

function PageRoutes({ authUser }: { authUser: AuthUser | undefined }) {
  const location = useLocation();
  const pathRoot = location.pathname.split("/").filter(Boolean)[0];

  const bgLocation =
    !location.state?.backgroundLocation && pathRoot === "post"
      ? { pathname: "/home" }
      : !location.state?.backgroundLocation && pathRoot === "edit-profile"
      ? { pathname: `/profile/${authUser?._id ?? ""}` }
      : location.state?.backgroundLocation;

  return (
    <>
      <Routes location={bgLocation || location}>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/signup" element={authUser ? <Navigate to="/home" /> : <AuthPage authType="signup" />} />
        <Route path="/login" element={authUser ? <Navigate to="/home" /> : <AuthPage authType="login" />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/create" element={authUser ? <CreatePostPage /> : <RestrictedPage />} />
        <Route path="/notifications" element={authUser ? <NotificationPage /> : <RestrictedPage />} />
        <Route path="/settings" element={authUser ? <SettingsPage /> : <RestrictedPage />} />
        <Route path="/profile" element={authUser ? <Navigate to={`/profile/${authUser.username}`} /> : <RestrictedPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/activity">
          <Route path="liked" element={authUser ? <LikedPostsPage /> : <RestrictedPage />} />
          <Route path="saved" element={authUser ? <SavedPostsPage /> : <RestrictedPage />} />
          <Route path="disliked" element={authUser ? <DislikedPostsPage /> : <RestrictedPage />} />
        </Route>
        {/* <Route path="/chat" element={1 ? <ChatPage /> : <RestrictedPage />} />
        <Route path="/chat/:chatroomId" element={1 ? <ChatPage /> : <RestrictedPage />} /> */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {bgLocation && (
        <Routes>
          <Route path="/post/:postId" element={<PostDialog />} />
          <Route path="/profile/edit" element={authUser ? <EditProfileDialog /> : null} />
          <Route path="*" element />
        </Routes>
      )}
    </>
  );
}
