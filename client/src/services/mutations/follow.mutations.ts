import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import toast from "react-hot-toast";
import axios from "axios";
import type {
  FollowRequestPage,
  UserPage,
  AuthUser,
  FollowStatus,
  ProfileUser,
  User,
  FollowRequest,
  BlockPage,
  Block,
} from "@/types";

export function useCreateFollowMutation() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useMutation<{ _id: FollowRequest["_id"]; followingStatus: "requested" | "accepted" | null }, Error, { following: User }>(
    {
      mutationFn: ({ following }) =>
        apiClient
          .post<{ _id: FollowRequest["_id"]; followingStatus: "requested" | "accepted" | null }>(`/follows/${following._id}`)
          .then(res => res.data),

      onSuccess: ({ _id, followingStatus }, { following: newFollowing }) => {
        if (!authUser) return;

        queryClient.setQueryData<FollowStatus>(["followStatus", newFollowing.username], f => f && { ...f, followingStatus });

        if (followingStatus === "accepted") {
          queryClient.setQueryData<ProfileUser>(
            ["user", authUser.username],
            user => user && { ...user, count: { ...user.count, following: user.count.following + 1 } }
          );

          queryClient.setQueryData<ProfileUser>(
            ["user", newFollowing.username],
            user => user && { ...user, count: { ...user.count, followers: user.count.followers + 1 } }
          );

          queryClient.setQueryData<InfiniteData<UserPage, UserPage["nextPageParam"]>>(
            ["user", authUser.username, "following"],
            oldData => {
              if (!oldData) return oldData;

              for (let i = 0; i < oldData.pages.length; i++) {
                const users = oldData.pages[i].users;
                const idx = users.findIndex(u => u.fullname > newFollowing.fullname);
                if (idx !== -1) {
                  const newUsers = [...users];
                  newUsers.splice(idx, 0, newFollowing);

                  const newPages = [...oldData.pages];
                  newPages[i] = { ...oldData.pages[i], users: newUsers };

                  return { ...oldData, pages: newPages };
                }
              }

              return oldData;
            }
          );

          queryClient.setQueryData<InfiniteData<UserPage, UserPage["nextPageParam"]>>(
            ["user", newFollowing.username, "followers"],
            oldData => {
              if (!oldData) return oldData;

              const newFollower: User = {
                _id: authUser._id,
                username: authUser.username,
                fullname: authUser.fullname,
                profilePicture: authUser.profilePicture,
                verified: { profile: authUser.verified.profile },
              };

              for (let i = 0; i < oldData.pages.length; i++) {
                const users = oldData.pages[i].users;
                const idx = users.findIndex(u => u.fullname > authUser.fullname);
                if (idx !== -1) {
                  const newUsers = [...users];
                  newUsers.splice(idx, 0, newFollower);

                  const newPages = [...oldData.pages];
                  newPages[i] = { ...oldData.pages[i], users: newUsers };

                  return { ...oldData, pages: newPages };
                }
              }

              return oldData;
            }
          );
        } else if (followingStatus === "requested") {
          const newRequest: FollowRequest = {
            _id,
            user: newFollowing,
            createdAt: new Date().toISOString(),
          };

          queryClient.setQueryData<InfiniteData<FollowRequestPage, FollowRequestPage["nextPageParam"]>>(
            ["followingRequests"],
            data =>
              data && {
                ...data,
                pages: data.pages.map((page, i) =>
                  i ? page : { ...page, followRequests: [newRequest, ...page.followRequests] }
                ),
              }
          );
        }
      },

      onError: async (err, { following }) => {
        if (axios.isAxiosError(err)) {
          toast.error(err.response?.data.message ?? "Something went wrong");
        }

        if (!authUser) return;

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["followingRequests"] }),
          queryClient.invalidateQueries({ queryKey: ["followStatus", following.username] }),
          queryClient.invalidateQueries({ queryKey: ["user", authUser.username] }),
          queryClient.invalidateQueries({ queryKey: ["user", authUser.username, "following"] }),
          queryClient.invalidateQueries({ queryKey: ["user", following.username] }),
          queryClient.invalidateQueries({ queryKey: ["user", following.username, "followers"] }),
        ]);
      },
    }
  );
}

export function useRemoveFollowMutation() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useMutation<void, Error, { following: User; followingStatus: "requested" | "accepted" }>({
    mutationFn: ({ following }) => apiClient.delete<void>(`/follows/${following._id}`).then(res => res.data),

    onSuccess: (_, { following, followingStatus: oldFollowingStatus }) => {
      if (!authUser) return;

      queryClient.setQueryData<FollowStatus>(["followStatus", following.username], f => f && { ...f, followingStatus: null });

      if (oldFollowingStatus === "accepted") {
        queryClient.setQueryData<ProfileUser>(
          ["user", authUser.username],
          user => user && { ...user, count: { ...user.count, following: user.count.following - 1 } }
        );

        queryClient.setQueryData<ProfileUser>(
          ["user", following.username],
          user => user && { ...user, count: { ...user.count, followers: user.count.followers - 1 } }
        );

        queryClient.setQueryData<InfiniteData<UserPage, UserPage["nextPageParam"]>>(
          ["user", authUser.username, "following"],
          data =>
            data && {
              ...data,
              pages: data.pages.map(page => ({ ...page, users: page.users.filter(user => user._id !== following._id) })),
            }
        );

        queryClient.setQueryData<InfiniteData<UserPage, UserPage["nextPageParam"]>>(
          ["user", following.username, "followers"],
          data =>
            data && {
              ...data,
              pages: data.pages.map(page => ({ ...page, users: page.users.filter(user => user._id !== authUser._id) })),
            }
        );
      } else if (oldFollowingStatus === "requested") {
        queryClient.setQueryData<InfiniteData<FollowRequestPage, FollowRequestPage["nextPageParam"]>>(
          ["followingRequests"],
          data =>
            data && {
              ...data,
              pages: data.pages.map(page => ({
                ...page,
                followRequests: page.followRequests.filter(req => req.user._id !== following._id),
              })),
            }
        );
      }
    },

    onError: async (err, { following }) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }

      if (!authUser) {
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["followingRequests"] }),
        queryClient.invalidateQueries({ queryKey: ["followStatus", following.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username, "following"] }),
        queryClient.invalidateQueries({ queryKey: ["user", following.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", following.username, "followers"] }),
      ]);
    },
  });
}

export function useBlockFollowMutation() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useMutation<{ _id: Block["_id"] }, Error, { user: User; followStatus: FollowStatus }>({
    mutationFn: ({ user }) => apiClient.patch<{ _id: Block["_id"] }>(`/follows/${user._id}/block`).then(res => res.data),

    onSuccess: async ({ _id }, { user: blockedUser, followStatus: oldFollowStatus }) => {
      if (!authUser) return;

      const newBlockedUserDoc: Block = {
        _id,
        user: blockedUser,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<FollowStatus>(
        ["followStatus", blockedUser.username],
        f => f && { followerStatus: f.followerStatus === "blocked" ? "blocked" : null, followingStatus: "blocked" }
      );

      await queryClient.invalidateQueries({ queryKey: ["user", blockedUser.username], exact: true });

      queryClient.setQueryData<InfiniteData<BlockPage, BlockPage["nextPageParam"]>>(
        ["blockedUserDocs"],
        data =>
          data && {
            ...data,
            pages: data.pages.map((page, i) =>
              i ? page : { ...page, blockedUserDocs: [newBlockedUserDoc, ...page.blockedUserDocs] }
            ),
          }
      );

      if (oldFollowStatus.followingStatus === "accepted") {
        queryClient.setQueryData<ProfileUser>(
          ["user", authUser.username],
          user => user && { ...user, count: { ...user.count, following: user.count.following - 1 } }
        );

        queryClient.setQueryData<InfiniteData<UserPage, UserPage["nextPageParam"]>>(
          ["user", authUser.username, "following"],
          data =>
            data && {
              ...data,
              pages: data.pages.map(page => ({ ...page, users: page.users.filter(user => user._id !== blockedUser._id) })),
            }
        );
      } else if (oldFollowStatus.followingStatus === "requested") {
        queryClient.setQueryData<InfiniteData<FollowRequestPage, FollowRequestPage["nextPageParam"]>>(
          ["followingRequests"],
          data =>
            data && {
              ...data,
              pages: data.pages.map(page => ({
                ...page,
                followRequests: page.followRequests.filter(req => req.user._id !== blockedUser._id),
              })),
            }
        );
      }

      if (oldFollowStatus.followerStatus === "accepted") {
        queryClient.setQueryData<ProfileUser>(
          ["user", authUser.username],
          user => user && { ...user, count: { ...user.count, followers: user.count.followers - 1 } }
        );

        queryClient.setQueryData<InfiniteData<UserPage, UserPage["nextPageParam"]>>(
          ["user", authUser.username, "followers"],
          data =>
            data && {
              ...data,
              pages: data.pages.map(page => ({ ...page, users: page.users.filter(user => user._id !== blockedUser._id) })),
            }
        );
      } else if (oldFollowStatus.followerStatus === "requested") {
        queryClient.setQueryData<InfiniteData<FollowRequestPage, FollowRequestPage["nextPageParam"]>>(
          ["followerRequests"],
          data =>
            data && {
              ...data,
              pages: data.pages.map(page => ({
                ...page,
                followRequests: page.followRequests.filter(req => req.user._id !== blockedUser._id),
              })),
            }
        );
      }
    },

    onError: async (err, { user }) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }

      if (!authUser) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["followingRequests"] }),
        queryClient.invalidateQueries({ queryKey: ["followStatus", user.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username, "following"] }),
        queryClient.invalidateQueries({ queryKey: ["user", user.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", user.username, "followers"] }),
      ]);
    },
  });
}

export function useUnblockFollowMutation() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useMutation<void, Error, { user: User }>({
    mutationFn: ({ user }) => apiClient.patch<void>(`/follows/${user._id}/unblock`).then(res => res.data),

    onSuccess: (_, { user: unblockedUser }) => {
      if (!authUser) return;

      queryClient.removeQueries({ queryKey: ["user", unblockedUser.username] });

      queryClient.setQueryData<FollowStatus>(
        ["followStatus", unblockedUser.username],
        f => f && { followerStatus: f.followerStatus, followingStatus: null }
      );

      queryClient.setQueryData<InfiniteData<BlockPage, BlockPage["nextPageParam"]>>(
        ["blockedUserDocs"],
        data =>
          data && {
            ...data,
            pages: data.pages.map(page => ({
              ...page,
              blockedUserDocs: page.blockedUserDocs.filter(doc => doc.user._id !== unblockedUser._id),
            })),
          }
      );

      queryClient.invalidateQueries({ queryKey: ["user", unblockedUser.username] });
    },

    onError: async (err, { user }) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }

      if (!authUser) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["followingRequests"] }),
        queryClient.invalidateQueries({ queryKey: ["followStatus", user.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username, "following"] }),
        queryClient.invalidateQueries({ queryKey: ["user", user.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", user.username, "followers"] }),
      ]);
    },
  });
}

export function useRemoveFollowerMutation() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useMutation<void, Error, { follower: User }>({
    mutationFn: ({ follower }) => apiClient.delete<void>(`/follows/follower/${follower._id}`).then(res => res.data),

    onSuccess: (_, { follower }) => {
      if (!authUser) return;

      queryClient.setQueryData<FollowStatus>(["followStatus", follower.username], f => f && { ...f, followerStatus: null });

      queryClient.setQueryData<ProfileUser>(
        ["user", authUser.username],
        user => user && { ...user, count: { ...user.count, followers: user.count.followers - 1 } }
      );

      queryClient.setQueryData<ProfileUser>(
        ["user", follower.username],
        user => user && { ...user, count: { ...user.count, following: user.count.following - 1 } }
      );

      queryClient.setQueryData<InfiniteData<UserPage, UserPage["nextPageParam"]>>(
        ["user", follower.username, "following"],
        data =>
          data && {
            ...data,
            pages: data.pages.map(page => ({ ...page, users: page.users.filter(user => user._id !== authUser._id) })),
          }
      );

      queryClient.setQueryData<InfiniteData<UserPage, UserPage["nextPageParam"]>>(
        ["user", authUser.username, "followers"],
        data =>
          data && {
            ...data,
            pages: data.pages.map(page => ({ ...page, users: page.users.filter(user => user._id !== follower._id) })),
          }
      );
    },

    onError: async (err, { follower }) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }

      if (!authUser) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["followStatus", follower.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username, "followers"] }),
        queryClient.invalidateQueries({ queryKey: ["user", follower.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", follower.username, "following"] }),
      ]);
    },
  });
}

export function useAcceptFollowRequestMutation() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useMutation<void, Error, { follower: User }>({
    mutationFn: ({ follower }) => apiClient.patch<void>(`/follows/${follower._id}/accept`).then(res => res.data),

    onSuccess: (_, { follower: newFollower }) => {
      if (!authUser) return;

      queryClient.setQueryData<FollowStatus>(
        ["followStatus", newFollower.username],
        f => f && { ...f, followerStatus: "accepted" }
      );

      queryClient.setQueryData<InfiniteData<FollowRequestPage, FollowRequestPage["nextPageParam"]>>(
        ["followerRequests"],
        data =>
          data && {
            ...data,
            pages: data.pages.map(page => ({
              ...page,
              followRequests: page.followRequests.filter(request => request.user._id !== newFollower._id),
            })),
          }
      );

      queryClient.setQueryData<ProfileUser>(
        ["user", authUser.username],
        user => user && { ...user, count: { ...user.count, followers: user.count.followers + 1 } }
      );

      queryClient.setQueryData<ProfileUser>(
        ["user", newFollower.username],
        user => user && { ...user, count: { ...user.count, following: user.count.following + 1 } }
      );

      queryClient.setQueryData<InfiniteData<UserPage, UserPage["nextPageParam"]>>(
        ["user", authUser.username, "followers"],
        oldData => {
          if (!oldData) return oldData;

          for (let i = 0; i < oldData.pages.length; i++) {
            const users = oldData.pages[i].users;
            const idx = users.findIndex(u => u.fullname > newFollower.fullname);
            if (idx !== -1) {
              const newUsers = [...users];
              newUsers.splice(idx, 0, newFollower);

              const newPages = [...oldData.pages];
              newPages[i] = { ...oldData.pages[i], users: newUsers };

              return { ...oldData, pages: newPages };
            }
          }

          return oldData;
        }
      );

      queryClient.setQueryData<InfiniteData<UserPage, UserPage["nextPageParam"]>>(
        ["user", newFollower.username, "following"],
        oldData => {
          if (!oldData) return oldData;

          const newFollowing: User = {
            _id: authUser._id,
            username: authUser.username,
            fullname: authUser.fullname,
            profilePicture: authUser.profilePicture,
            verified: { profile: authUser.verified.profile },
          };

          for (let i = 0; i < oldData.pages.length; i++) {
            const users = oldData.pages[i].users;
            const idx = users.findIndex(u => u.fullname > authUser.fullname);
            if (idx !== -1) {
              const newUsers = [...users];
              newUsers.splice(idx, 0, newFollowing);

              const newPages = [...oldData.pages];
              newPages[i] = { ...oldData.pages[i], users: newUsers };

              return { ...oldData, pages: newPages };
            }
          }

          return oldData;
        }
      );
    },

    onError: async (err, { follower }) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }

      if (!authUser) {
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["followerRequests"] }),
        queryClient.invalidateQueries({ queryKey: ["followStatus", follower.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username, "following"] }),
        queryClient.invalidateQueries({ queryKey: ["user", follower.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", follower.username, "followers"] }),
      ]);
    },
  });
}

export function useRejectFollowRequestMutation() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useMutation<void, Error, { follower: User }>({
    mutationFn: ({ follower }) => apiClient.patch<void>(`/follows/${follower._id}/reject`).then(res => res.data),

    onSuccess: (_, { follower: rejectedUser }) => {
      if (!authUser) return;

      queryClient.setQueryData<FollowStatus>(
        ["followStatus", rejectedUser.username],
        followStatus => followStatus && { ...followStatus, followerStatus: null }
      );

      queryClient.setQueryData<InfiniteData<FollowRequestPage, FollowRequestPage["nextPageParam"]>>(
        ["followerRequests"],
        data =>
          data && {
            ...data,
            pages: data.pages.map(page => ({
              ...page,
              followRequests: page.followRequests.filter(request => request.user._id !== rejectedUser._id),
            })),
          }
      );
    },

    onError: async (err, { follower }) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }

      if (!authUser) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["followerRequests"] }),
        queryClient.invalidateQueries({ queryKey: ["followStatus", follower.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", authUser.username, "followers"] }),
        queryClient.invalidateQueries({ queryKey: ["user", follower.username] }),
        queryClient.invalidateQueries({ queryKey: ["user", follower.username, "following"] }),
      ]);
    },
  });
}

export function useSeeAllFollowerRequestsMutation() {
  return useMutation({
    mutationFn: () => apiClient.patch("/follows/follower-requests/see-all"),
  });
}
