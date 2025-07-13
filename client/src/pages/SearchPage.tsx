import { Box, Avatar, Typography, List, InputBase, Paper, Tabs, Tab, ListItem, Link as MuiLink, useTheme } from "@mui/material";
import { Search as SearchIcon, SearchOffOutlined as SearchOffIcon } from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { useSearchPostsQuery } from "@/services/queries/post.queries";
import { useSearchUsersQuery } from "@/services/queries/user.queries";
import type { User } from "@/types";
import PostList from "@/components/post/PostList";
import LoadingOrError from "@/components/elements/LoadingOrError";
import UserSkeleton from "@/components/profile/UserSkeleton";
import { HandleFollowButton } from "@/components/profile/UserActionButtons";
import { RefetchOptions, QueryObserverResult, FetchNextPageOptions, InfiniteQueryObserverResult } from "@tanstack/react-query";

type Tab = "users" | "posts";
const tabs: Tab[] = ["users", "posts"];

export default function SearchPage() {
  const theme = useTheme();
  const location = useLocation();

  const [tab, setTab] = useState<"users" | "posts">("users");
  const [term, setTerm] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState<string>("");
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (["users", "posts"].includes(location.state?.search)) {
      setTab(location.state.search);
      location.state.search = null;
    }
    if (typeof location.state?.searchParam === "string") {
      setTerm(location.state.searchParam);
      setSearchTerm(location.state.searchParam);
      location.state.searchParam = null;
    }
  }, [location.state]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSearchTerm(term), 1000);
  }, [term]);

  const {
    data: users,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    isError: isErrorUsers,
    refetch: refetchUsers,
    hasNextPage: hasNextPageUsers,
    isFetchingNextPage: isFetchingNextPageUsers,
    fetchNextPage: fetchNextPageUsers,
  } = useSearchUsersQuery(tab === "users" ? searchTerm : "");

  const {
    data: postIds,
    isLoading: isLoadingPostIds,
    isFetching: isFetchingPostIds,
    isError: isErrorPostIds,
    refetch: refetchPostIds,
    hasNextPage: hasNextPagePostIds,
    isFetchingNextPage: isFetchingNextPagePostIds,
    fetchNextPage: fetchNextPagePostIds,
  } = useSearchPostsQuery(tab === "posts" ? searchTerm : "");

  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY.current) {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" width="100%">
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          transform: showHeader ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s ease-in-out",
          width: "100%",
          bgcolor: "background.paper",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            bgcolor: "transparent",
            py: 1.5,
            px: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            width: "100%",
          }}
        >
          <SearchInput tab={tab} value={term} onChange={e => setTerm(e.target.value)} />
          <Box sx={{ width: "100%" }}>
            <Tabs
              value={tab}
              onChange={(_, newValue) => setTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="tabs"
              sx={{
                ".MuiTabs-flexContainer": { gap: 2 },
                ".MuiTab-root": {
                  fontWeight: 500,
                  fontSize: 15,
                  textTransform: "none",
                  color: theme.palette.text.primary,
                  px: 1,
                  "&.Mui-selected": { color: theme.palette.primary.dark },
                  "&:hover": { color: theme.palette.primary.main },
                },
                ".MuiTabs-indicator": {
                  height: 3,
                  borderRadius: 2,
                  bgcolor: theme.palette.primary.dark,
                },
              }}
            >
              {tabs.map(tab => (
                <Tab key={tab} value={tab} label={tab === "users" ? "People" : "Posts"} />
              ))}
            </Tabs>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        {searchTerm && tab === "users" ? (
          <UserList
            users={users}
            isLoading={isLoadingUsers}
            isFetching={isFetchingUsers}
            isError={isErrorUsers}
            refetch={refetchUsers}
            hasNextPage={hasNextPageUsers}
            isFetchingNextPage={isFetchingNextPageUsers}
            fetchNextPage={fetchNextPageUsers}
          />
        ) : searchTerm && tab === "posts" ? (
          <PostList
            postIds={postIds}
            isLoading={isLoadingPostIds}
            isFetching={isFetchingPostIds}
            isError={isErrorPostIds}
            refetch={refetchPostIds}
            hasNextPage={hasNextPagePostIds}
            isFetchingNextPage={isFetchingNextPagePostIds}
            fetchNextPage={fetchNextPagePostIds}
          />
        ) : null}
      </Box>
    </Box>
  );
}

function UserList({
  users,
  isLoading,
  isError,
  isFetching,
  refetch,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UserListProps) {
  const theme = useTheme();
  const loaderRef = useRef<HTMLDivElement | null>(null);

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

  if (isLoading || isError || !users) {
    return (
      <Box sx={{ width: "100%", px: { xs: 2, sm: 4 }, maxWidth: "42rem", my: 3 }}>
        <LoadingOrError
          isLoading={isLoading}
          isError={isError || !users}
          errorMessage="Failed to fetch users"
          LoadingComponent={<UserSkeleton />}
          isFetching={isFetching}
          refetch={refetch}
        />
      </Box>
    );
  }

  if (!users.length) {
    return (
      <Box
        sx={{
          mt: 10,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: "1.25rem", fontWeight: 500, color: theme.palette.text.secondary }}>No users found</Typography>
        <SearchOffIcon sx={{ fontSize: 25 }} />
      </Box>
    );
  }

  return (
    <List
      disablePadding
      sx={{
        width: "100%",
        px: { xs: 2, sm: 4 },
        maxWidth: "42rem",
        my: 3,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {users.map((user, i) => (
        <Box key={user._id} sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          {i === users.length - 4 && <Box key={-1} ref={loaderRef} />}
          <ListItem
            disableGutters
            sx={{
              px: 2,
              py: 2,
              bgcolor: theme.palette.background.paper,
              borderRadius: 3,
              boxShadow: 1,
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: 3,
                bgcolor: theme.palette.action.hover,
              },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <MuiLink
              component={RouterLink}
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
              <Avatar src={user.profilePicture} alt={user.fullname} sx={{ width: 52, height: 52 }} />
              <Box>
                <Typography
                  fontWeight={600}
                  variant="body1"
                  sx={theme => ({
                    color: theme.palette.text.primary,
                    textTransform: "capitalize",
                  })}
                >
                  {user.username}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textTransform: "capitalize" }}>
                  {user.fullname}
                </Typography>
              </Box>
            </MuiLink>

            <HandleFollowButton user={user} />
          </ListItem>
        </Box>
      ))}
      {isFetchingNextPage && <UserSkeleton />}
    </List>
  );
}

interface UserListProps {
  users: User[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<User[]>>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: (options?: FetchNextPageOptions) => Promise<InfiniteQueryObserverResult<User[]>>;
}

interface SearchInputProps {
  tab: Tab;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SearchInput({ tab, value, onChange }: SearchInputProps) {
  const theme = useTheme();

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: theme.palette.background.paper,
          border: "2px solid",
          borderColor: theme.palette.divider,
          borderRadius: "10rem",
          px: 2,
          py: 1,
          width: { xs: "85%", sm: "22rem", md: "28rem" },
          transition: "border-color 0.3s ease",
          "&:hover": {
            borderColor: theme.palette.primary.light,
          },
          "&:focus-within": {
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        <SearchIcon sx={{ mr: 1.5, color: theme.palette.text.secondary, fontSize: 24 }} />
        <InputBase
          placeholder={tab === "users" ? "Search users..." : tab === "posts" ? "Search posts..." : ""}
          value={value}
          onChange={onChange}
          fullWidth
          sx={{
            fontWeight: 500,
            fontSize: "1.05rem",
            color: theme.palette.text.primary,
            fontFamily: "Exo, Roboto, sans-serif",
            "& input::placeholder": {
              opacity: 0.7,
            },
          }}
        />
      </Box>
    </Box>
  );
}
