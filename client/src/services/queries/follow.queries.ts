import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { Block, BlockPage, AuthUser, FollowRequest, FollowRequestPage, FollowStatus } from "@/types";
import { buildInfiniteScrollQuery } from "@/utils";

export function useGetFollowerRequestsQuery() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useInfiniteQuery<FollowRequestPage, Error, FollowRequest[], ["followerRequests"], FollowRequestPage["nextPageParam"]>({
    queryKey: ["followerRequests"],

    initialPageParam: null,

    queryFn: ({ pageParam }) =>
      apiClient
        .get<FollowRequestPage>(`/follows/me/follower-requests?${buildInfiniteScrollQuery(pageParam)}`)
        .then(res => res.data),

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ followRequests }) => followRequests),

    enabled: !!authUser,
  });
}

export function useGetFollowingRequestsQuery() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useInfiniteQuery<FollowRequestPage, Error, FollowRequest[], ["followingRequests"], FollowRequestPage["nextPageParam"]>({
    queryKey: ["followingRequests"],

    initialPageParam: null,

    queryFn: ({ pageParam }) =>
      apiClient
        .get<FollowRequestPage>(`/follows/me/following-requests?${buildInfiniteScrollQuery(pageParam)}`)
        .then(res => res.data),

    select: ({ pages }) => pages.flatMap(({ followRequests }) => followRequests),

    getNextPageParam: lastPage => lastPage.nextPageParam,

    enabled: !!authUser,
  });
}

export function useGetBlockedUserDocsQuery() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useInfiniteQuery<BlockPage, Error, Block[], ["blockedUserDocs"], BlockPage["nextPageParam"]>({
    queryKey: ["blockedUserDocs"],

    initialPageParam: null,

    queryFn: ({ pageParam }) =>
      apiClient.get<BlockPage>(`/follows/me/blocked-user-docs?${buildInfiniteScrollQuery(pageParam)}`).then(res => res.data),

    select: ({ pages }) => pages.flatMap(({ blockedUserDocs }) => blockedUserDocs),

    getNextPageParam: lastPage => lastPage.nextPageParam,

    enabled: !!authUser,
  });
}

export function useGetFollowStatusQuery(username: string) {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useQuery<FollowStatus>({
    queryKey: ["followStatus", username],
    queryFn: () =>
      authUser && authUser.username !== username
        ? apiClient.get(`/follows/status?username=${username}`).then(res => res.data)
        : { followerStatus: null, followingStatus: null },

    enabled: !!username,
  });
}
