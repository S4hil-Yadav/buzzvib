import { Box, Typography, IconButton } from "@mui/material";
import {
  SettingsOutlined as SettingsIcon,
  // ForumOutlined as ChatIcon
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import PostList from "@/components/post/PostList";
import { useGetPostIdsQuery } from "@/services/queries/post.queries";

export default function HomePage() {
  const {
    data: postIds,
    isLoading,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetPostIdsQuery();

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" width="100%">
      <Box
        sx={{
          display: { xs: "flex", sm: "none" },
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          borderBottom: theme => `1px solid ${theme.palette.divider}`,
          bgcolor: "background.default",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(90deg, #6A5ACD, #00BFFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "1.25rem",
          }}
        >
          BuzzVib
        </Typography>

        <Box display="flex" gap={1}>
          {/* <IconButton component={Link} to="#" size="large">
            <ChatIcon />
          </IconButton> */}
          <IconButton component={Link} to="/settings" size="large">
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      <Box flex="1">
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
      </Box>
    </Box>
  );
}
