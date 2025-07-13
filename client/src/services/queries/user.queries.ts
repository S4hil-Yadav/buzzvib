import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { AuthUser, Post, ProfileUser, User, UserPage, FollowStatus, PostIdPage, PostPage } from "@/types";
import { buildInfiniteScrollQuery, useGetAndCacheFollowStatuses } from "@/utils/utils";

export function useGetProfileUserQuery(username: User["username"]) {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useQuery<ProfileUser>({
    queryKey: ["user", username],
    queryFn: async () => {
      const status =
        authUser && authUser.username !== username
          ? await apiClient.get<FollowStatus>(`/follows/status?username=${username}`).then(res => res.data)
          : { followerStatus: null, followingStatus: null };

      queryClient.setQueryData<FollowStatus>(["followStatus", username], status);

      const user = await apiClient.get<ProfileUser>(`/users/profile/${username}`).then(res => res.data);
      return user;
    },
  });
}

export function useSearchUsersQuery(searchTerm: string) {
  const getAndCacheFollowStatuses = useGetAndCacheFollowStatuses();

  return useInfiniteQuery<UserPage, Error, User[], ["search-users", string], UserPage["nextPageParam"]>({
    queryKey: ["search-users", searchTerm.toLowerCase()],

    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const query = [`searchTerm=${encodeURIComponent(searchTerm)}`, buildInfiniteScrollQuery(pageParam)]
        .filter(Boolean)
        .join("&");
      const page = await apiClient.get<UserPage>(`/users/search?${query}`).then(res => res.data);
      await getAndCacheFollowStatuses(page.users);
      return page;
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ users }) => users),

    staleTime: 1000 * 60,
    enabled: !!searchTerm,
  });
}

export function useGetFollowersQuery(user: User) {
  const getAndCacheFollowStatuses = useGetAndCacheFollowStatuses();

  return useInfiniteQuery<UserPage, Error, User[], ["user", string, "followers"], UserPage["nextPageParam"]>({
    queryKey: ["user", user.username, "followers"],

    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const page = await apiClient
        .get<UserPage>(`/users/${user.username}/followers?${buildInfiniteScrollQuery(pageParam)}`)
        .then(res => res.data);
      await getAndCacheFollowStatuses(page.users);
      return page;
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ users }) => users),
  });
}

export function useGetFollowingQuery(user: User) {
  const getAndCacheFollowStatuses = useGetAndCacheFollowStatuses();

  return useInfiniteQuery<UserPage, Error, User[], ["user", string, "following"], UserPage["nextPageParam"]>({
    queryKey: ["user", user.username, "following"],

    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const page = await apiClient
        .get<UserPage>(`/users/${user.username}/following?${buildInfiniteScrollQuery(pageParam)}`)
        .then(res => res.data);
      await getAndCacheFollowStatuses(page.users);
      return page;
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ users }) => users),
  });
}

export function useGetUserPostIdsQuery(username: User["username"]) {
  const queryClient = useQueryClient();

  return useInfiniteQuery<PostIdPage, Error, Post["_id"][], ["user", User["username"], "posts"], PostIdPage["nextPageParam"]>({
    queryKey: ["user", username, "posts"],

    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const page = await apiClient
        .get<PostPage>(`/users/${username}/posts?${buildInfiniteScrollQuery(pageParam)}`)
        .then(res => res.data);

      page.posts.forEach(post => queryClient.setQueryData<Post>(["post", post._id], post));
      return { postIds: page.posts.map(post => post._id), nextPageParam: page.nextPageParam };
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ postIds }) => postIds),

    staleTime: Infinity,
  });
}

export function useGetLikedPostIdsQuery(username: User["username"]) {
  const queryClient = useQueryClient();

  return useInfiniteQuery<PostIdPage, Error, Post["_id"][], ["user", string, "liked-posts"], PostIdPage["nextPageParam"]>({
    queryKey: ["user", username, "liked-posts"],
    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const page = await apiClient
        .get<PostPage>(`/users/${username}/liked-posts?${buildInfiniteScrollQuery(pageParam)}`)
        .then(res => res.data);
      page.posts.forEach(post => queryClient.setQueryData<Post>(["post", post._id], post));
      return { ...page, postIds: page.posts.map(post => post._id) };
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ postIds }) => postIds),

    staleTime: Infinity,
  });
}

export function useGetSavedPostIdsQuery(username: User["username"]) {
  const queryClient = useQueryClient();

  return useInfiniteQuery<PostIdPage, Error, Post["_id"][], ["user", string, "saved-posts"], PostIdPage["nextPageParam"]>({
    queryKey: ["user", username, "saved-posts"],
    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const page = await apiClient
        .get<PostPage>(`/users/me/saved-posts?${buildInfiniteScrollQuery(pageParam)}`)
        .then(res => res.data);
      page.posts.forEach(post => queryClient.setQueryData<Post>(["post", post._id], post));
      return { ...page, postIds: page.posts.map(post => post._id) };
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ postIds }) => postIds),

    staleTime: Infinity,
  });
}

export function useGetDislikedPostIdsQuery(username: User["username"]) {
  const queryClient = useQueryClient();

  return useInfiniteQuery<PostIdPage, Error, Post["_id"][], ["user", string, "disliked-posts"], PostIdPage["nextPageParam"]>({
    queryKey: ["user", username, "disliked-posts"],
    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const page = await apiClient
        .get<PostPage>(`/users/me/disliked-posts?${buildInfiniteScrollQuery(pageParam)}`)
        .then(res => res.data);
      page.posts.forEach(post => queryClient.setQueryData<Post>(["post", post._id], post));
      return { ...page, postIds: page.posts.map(post => post._id) };
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ postIds }) => postIds),

    staleTime: Infinity,
  });
}
