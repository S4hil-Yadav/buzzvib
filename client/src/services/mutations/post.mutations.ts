import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/axios";
import type { AuthUser, Post, Comment, CommentIdPage, ProfileUser, PostIdPage } from "@/types";
import { useDispatch } from "react-redux";
import { clearPostDraft, clearPostDraftUploadProgress, setPostDraftUploadProgress } from "@/redux/slices/postDraftSlice";
import { clearEditPostUploading, setEditPostUploadProgress, setEditPostUploading } from "@/redux/slices/editPostSlice";
import axios from "axios";
import type { AppDispatch } from "@/redux/store.ts";

export function useCreatePostMutation() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"])!;

  const dispatch = useDispatch<AppDispatch>();

  return useMutation<Pick<Post, "_id" | "status">, Error, { formData: FormData; post: Pick<Post, "title" | "text"> }>({
    mutationFn: ({ formData }) =>
      apiClient
        .post<Pick<Post, "_id" | "status">>("/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: e => dispatch(setPostDraftUploadProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0)),
        })
        .then(res => res.data),

    onSuccess: ({ _id: postId, status }, { post }) => {
      const newPost: Post = {
        _id: postId,
        title: post.title,
        text: post.text,
        author: {
          _id: authUser._id,
          username: authUser.username,
          fullname: authUser.fullname,
          profilePicture: authUser.profilePicture,
          verified: { profile: authUser.verified.profile },
        },
        count: { comments: 0, reactions: { like: 0, dislike: 0 } },
        createdAt: new Date().toISOString(),
        editedAt: null,
        status: status,
        deletedAt: null,
        media: [],
        reaction: null,
        savedAt: null,
      };

      queryClient.setQueryData<Post>(["post", postId], newPost);

      queryClient.setQueryData<ProfileUser>(
        ["user", authUser.username],
        prev => prev && { ...prev, count: { ...prev.count, posts: prev.count.posts + 1 } }
      );

      queryClient.setQueryData<InfiniteData<PostIdPage, PostIdPage["nextPageParam"]>>(
        ["user", authUser.username, "posts"],
        data =>
          data && {
            ...data,
            pages: data.pages.map((page, i) => (i ? page : { ...page, postIds: [postId, ...page.postIds] })),
          }
      );

      setTimeout(() => {
        dispatch(clearPostDraft());
        toast.success("Posted");
      }, 500);
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
      dispatch(clearPostDraftUploadProgress());
    },
  });
}

export function useEditPostMutation() {
  const queryClient = useQueryClient();

  const dispatch = useDispatch<AppDispatch>();

  return useMutation<Pick<Post, "status">, Error, { formData: FormData; post: Pick<Post, "_id" | "title" | "text"> }>({
    onMutate: () => {
      dispatch(setEditPostUploading());
    },

    mutationFn: ({ formData, post }) =>
      apiClient
        .patch<Pick<Post, "status">>(`/posts/${post._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: e => dispatch(setEditPostUploadProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0)),
        })
        .then(res => res.data),

    onSuccess: ({ status }, { post }) => {
      queryClient.setQueryData<Post>(
        ["post", post._id],
        data => data && { ...data, title: post.title, text: post.text, media: [], status }
      );

      setTimeout(() => {
        dispatch(clearEditPostUploading());
        toast.success("Post edited");
      }, 500);
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
      dispatch(clearEditPostUploading());
    },
  });
}

export function useTogglePostReactionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { postId: Post["_id"]; reaction: Post["reaction"] }, Post | undefined>({
    onMutate: ({ postId, reaction }) => {
      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      queryClient.setQueryData<Post>(
        ["post", postId],
        post =>
          post && {
            ...post,
            count: {
              ...post.count,
              reactions: {
                like: post.count.reactions.like - (post.reaction === "like" ? 1 : 0) + (reaction === "like" ? 1 : 0),
                dislike: post.count.reactions.dislike - (post.reaction === "dislike" ? 1 : 0) + (reaction === "dislike" ? 1 : 0),
              },
            },
            reaction,
          }
      );

      return previousPost;
    },

    mutationFn: ({ postId, reaction }) =>
      apiClient.post<void>(`/posts/${postId}/react`, { reactionType: reaction ?? ("none" as const) }).then(res => res.data),

    // onSuccess: (_, { postId }) => {},

    onError: (_err, { postId }, previousPost) => {
      queryClient.setQueryData(["post", postId], data => previousPost ?? data);
    },
  });
}

export function useTogglePostSaveMutation() {
  const queryClient = useQueryClient();

  return useMutation<{ savedAt: string }, Error, { post: Post }>({
    mutationFn: ({ post }) => apiClient.post<{ savedAt: string }>(`/posts/${post._id}/save`).then(res => res.data),

    onSuccess: ({ savedAt }, { post: savedPost }) => {
      queryClient.setQueryData<Post>(["post", savedPost._id], post => post && { ...post, savedAt });
      toast.success(savedAt ? "Post saved" : "Post unsaved");
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useDeletePostMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { post: Post }>({
    mutationFn: ({ post }) => apiClient.delete<void>(`/posts/${post._id}`).then(res => res.data),

    onSuccess: (_res, { post }) => {
      queryClient.setQueryData<Post>(
        ["post", post._id],
        post =>
          post && {
            ...post,
            author: null,
            title: null,
            text: null,
            media: [],
            reaction: null,
            savedAt: null,
            count: { reactions: { like: 0, dislike: 0 }, comments: 0 },
            deletedAt: new Date().toISOString(),
          }
      );
      queryClient.setQueryData<ProfileUser>(
        ["user", post.author!.username],
        prev =>
          prev && {
            ...prev,
            count: { ...prev.count, posts: prev.count.posts - 1 },
          }
      );

      toast.success("Post deleted");
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useSubmitCommentMutation() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useMutation<Pick<Comment, "_id">, Error, { postId: Post["_id"]; commentText: string }>({
    mutationFn: ({ commentText, postId }) =>
      apiClient.post<Pick<Comment, "_id">>(`/posts/${postId}/comment`, { commentText }).then(res => res.data),

    onSuccess: ({ _id: newCommentId }, { postId, commentText }) => {
      if (!authUser) return;

      const createdAt = new Date().toISOString();
      const nextPageParam = { _id: newCommentId, createdAt };

      const newComment: Comment = {
        _id: newCommentId,
        commentor: {
          _id: authUser._id,
          username: authUser.username,
          fullname: authUser.fullname,
          profilePicture: authUser.profilePicture,
          verified: { profile: authUser.verified.profile },
        },
        text: commentText.trim(),
        media: [],
        count: { replies: 0, reactions: { like: 0, dislike: 0 } },
        reaction: null,
        createdAt,
        editedAt: createdAt,
        deletedAt: null,
      };

      queryClient.setQueryData<Comment>(["comment", newCommentId], newComment);

      queryClient.setQueryData<Post>(
        ["post", postId],
        post => post && { ...post, count: { ...post.count, comments: post.count.comments + 1 } }
      );

      queryClient.setQueryData<InfiniteData<CommentIdPage, CommentIdPage["nextPageParam"]>>(
        ["post", postId, "comments"],
        (data = { pages: [{ commentIds: [], nextPageParam }], pageParams: [nextPageParam] }) => ({
          ...data,
          pages: data.pages.map((page, i) => (i ? page : { ...page, commentIds: [newComment._id, ...page.commentIds] })),
        })
      );
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
    },
  });
}
