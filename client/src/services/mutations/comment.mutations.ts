import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { AuthUser, Comment, CommentIdPage, Post } from "@/types";
import axios from "axios";
import toast from "react-hot-toast";

export function useEditCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { commentId: Comment["_id"]; commentText: string }>({
    mutationFn: ({ commentId, commentText }) =>
      apiClient.patch<void>(`/comments/${commentId}`, { commentText }).then(res => res.data),

    onSuccess: (_data, { commentText, commentId }) => {
      queryClient.setQueryData<Comment>(
        ["comment", commentId],
        comment =>
          comment && {
            ...comment,
            text: commentText,
            updatedAt: new Date().toISOString(),
          }
      );
    },

    onError: err => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useDeleteCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { commentId: Comment["_id"]; postId: Post["_id"]; parentId: Comment["_id"] | null }>({
    mutationFn: ({ commentId }) => apiClient.delete<void>(`/comments/${commentId}`).then(res => res.data),

    onSuccess: (_data, { postId, commentId: deletedCommentId, parentId }) => {
      if (parentId) {
        queryClient.setQueryData<Comment>(
          ["comment", parentId],
          comment =>
            comment && {
              ...comment,
              commentor: null,
              text: null,
              media: [],
              reaction: null,
              count: { ...comment.count, replies: comment.count.replies - 1 },
            }
        );
        queryClient.setQueryData<InfiniteData<CommentIdPage, CommentIdPage["nextPageParam"]>>(
          ["comment", parentId, "replies"],
          data =>
            data && {
              ...data,
              pages: data.pages.map(page => ({
                ...page,
                commentIds: page.commentIds.filter(commentId => commentId !== deletedCommentId),
              })),
            }
        );
      } else {
        queryClient.setQueryData<Post>(
          ["post", postId],
          post => post && { ...post, count: { ...post.count, comments: post.count.comments - 1 } }
        );
      }

      queryClient.setQueryData<Comment>(
        ["comment", deletedCommentId],
        prev => prev && { ...prev, text: null, commentor: null, deletedAt: new Date().toISOString() }
      );
    },

    onError: err => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useSubmitReplyMutation() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useMutation<Pick<Comment, "_id">, Error, { postId: Post["_id"]; commentId: Comment["_id"]; replyText: string }>({
    mutationFn: ({ commentId, replyText }) =>
      apiClient.post<Pick<Comment, "_id">>(`/comments/${commentId}/reply`, { replyText }).then(res => res.data),

    onSuccess: ({ _id: newReplyId }, { commentId, replyText }) => {
      if (!authUser) return;

      const createdAt = new Date().toISOString();
      const nextPageParam = { _id: newReplyId, createdAt };

      const newReply: Comment = {
        _id: newReplyId,
        commentor: {
          _id: authUser._id,
          username: authUser.username,
          fullname: authUser.fullname,
          profilePicture: authUser.profilePicture,
          verified: { profile: authUser.verified.profile },
        },
        text: replyText.trim(),
        count: { replies: 0, reactions: { like: 0, dislike: 0 } },
        media: [],
        reaction: null,
        createdAt,
        editedAt: null,
        deletedAt: null,
      };

      queryClient.setQueryData<Comment>(["comment", newReplyId], newReply);

      queryClient.setQueryData<InfiniteData<CommentIdPage, CommentIdPage["nextPageParam"]>>(
        ["comment", commentId, "replies"],
        data =>
          data && {
            ...data,
            pages: data.pages.map((page, i) =>
              i ? page : { ...page, commentIds: [newReply._id, ...page.commentIds], nextPageParam }
            ),
          }
      );

      // queryClient.setQueryData<Post>(["post", postId], post => post && { ...post, commentCount: post.commentCount + 1 });
      queryClient.setQueryData<Comment>(
        ["comment", commentId],
        comment => comment && { ...comment, count: { ...comment.count, replies: comment.count.replies + 1 } }
      );
    },

    onError: err => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useToggleCommentReactionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { commentId: Comment["_id"]; reaction: Post["reaction"] },
    { previousComment: Comment | undefined }
  >({
    onMutate: ({ commentId, reaction }) => {
      const previousComment = queryClient.getQueryData<Comment>(["comment", commentId]);

      queryClient.setQueryData<Comment>(
        ["comment", commentId],
        comment =>
          comment && {
            ...comment,
            count: {
              ...comment.count,
              reactions: {
                like: comment.count.reactions.like - (comment.reaction === "like" ? 1 : 0) + (reaction === "like" ? 1 : 0),
                dislike:
                  comment.count.reactions.dislike - (comment.reaction === "dislike" ? 1 : 0) + (reaction === "dislike" ? 1 : 0),
              },
            },
            reaction,
          }
      );

      return { previousComment };
    },

    mutationFn: ({ commentId, reaction }) =>
      apiClient.post<void>(`/comments/${commentId}/react`, { reactionType: reaction ?? "none" }).then(res => res.data),

    onError: (_err, { commentId }, context) => {
      if (context?.previousComment) {
        queryClient.setQueryData(["comment", commentId], context.previousComment);
      }
    },
  });
}
