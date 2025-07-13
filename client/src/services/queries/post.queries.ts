import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { CommentPage, Comment, CommentIdPage, Post, PostIdPage, PostPage } from "@/types";
import { buildInfiniteScrollQuery } from "@/utils/utils";

export function useGetPostIdsQuery() {
  const queryClient = useQueryClient();

  return useInfiniteQuery<PostIdPage, Error, Post["_id"][], ["feed-posts"], PostIdPage["nextPageParam"]>({
    queryKey: ["feed-posts"],

    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const page = await apiClient.get<PostPage>(`/posts?${buildInfiniteScrollQuery(pageParam)}`).then(res => res.data);
      page.posts.forEach(post => queryClient.setQueryData<Post>(["post", post._id], post));
      return { ...page, postIds: page.posts.map(post => post._id), nextPageParam: page.nextPageParam };
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ postIds }) => postIds),
  });
}

export function useGetPostQuery(postId: Post["_id"]) {
  return useQuery<Post>({
    queryKey: ["post", postId],
    queryFn: () => apiClient.get<Post>(`/posts/${postId}`).then(res => res.data),
  });
}

export function useSearchPostsQuery(searchTerm: string) {
  const queryClient = useQueryClient();

  return useInfiniteQuery<PostIdPage, Error, Post["_id"][], ["search-posts", string], PostIdPage["nextPageParam"]>({
    queryKey: ["search-posts", searchTerm.toLowerCase()],

    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const query = [`searchTerm=${encodeURIComponent(searchTerm)}`, buildInfiniteScrollQuery(pageParam)]
        .filter(Boolean)
        .join("&");

      const page = await apiClient.get<PostPage>(`/posts/search?${query}`).then(res => res.data);

      page.posts.forEach(post => queryClient.setQueryData<Post>(["post", post._id], post));
      return { ...page, postIds: page.posts.map(post => post._id), nextPageParam: page.nextPageParam };
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ postIds }) => postIds),

    staleTime: 1000 * 60,
    enabled: !!searchTerm,
  });
}

export function useGetCommentIdsQuery(postId: Post["_id"]) {
  const queryClient = useQueryClient();

  return useInfiniteQuery<CommentIdPage, Error, Comment["_id"][], ["post", string, "comments"], CommentIdPage["nextPageParam"]>({
    queryKey: ["post", postId, "comments"],

    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const page = await apiClient
        .get<CommentPage>(`/posts/${postId}/comments?${buildInfiniteScrollQuery(pageParam)}`)
        .then(res => res.data);
      page.comments.forEach(comment => queryClient.setQueryData<Comment>(["comment", comment._id], comment));
      return { ...page, commentIds: page.comments.map(comment => comment._id) };
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ commentIds }) => commentIds),
  });
}
