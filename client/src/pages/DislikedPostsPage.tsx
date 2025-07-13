import { Box } from "@mui/material";
import PostList from "@/components/post/PostList";
import { useGetDislikedPostIdsQuery } from "@/services/queries/user.queries";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@/types";

export default function DislikedPostsPage() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"])!;

  const {
    data: postIds,
    isLoading,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetDislikedPostIdsQuery(authUser.username);

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" width="100%">
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
