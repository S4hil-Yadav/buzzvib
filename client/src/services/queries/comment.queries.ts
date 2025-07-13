import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { CommentPage, Comment, CommentIdPage } from "@/types";
import { buildInfiniteScrollQuery } from "@/utils/utils";

export function useGetCommentQuery(commentId: Comment["_id"]) {
  return useQuery<Comment>({
    queryKey: ["comment", commentId],
    queryFn: () => apiClient.get<Comment>(`/comments/${commentId}`).then(res => res.data),
  });
}

export function useGetReplyIdsQuery(parentId: Comment["_id"]) {
  const queryClient = useQueryClient();

  return useInfiniteQuery<CommentIdPage, Error, Comment["_id"][], ["comment", string, "replies"], CommentIdPage["nextPageParam"]>(
    {
      queryKey: ["comment", parentId, "replies"],

      initialPageParam: null,

      queryFn: async ({ pageParam }) => {
        const page = await apiClient
          .get<CommentPage>(`/comments/${parentId}/replies?${buildInfiniteScrollQuery(pageParam)}`)
          .then(res => res.data);
        page.comments.forEach(comment => queryClient.setQueryData<Comment>(["comment", comment._id], comment));
        return { ...page, commentIds: page.comments.map(comment => comment._id) };
      },

      getNextPageParam: lastPage => lastPage.nextPageParam,

      select: ({ pages }) => pages.flatMap(({ commentIds }) => commentIds),
    }
  );
}
