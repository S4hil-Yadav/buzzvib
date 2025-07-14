import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { AuthUser, User, FollowStatuses, FollowStatus } from "@/types";

export function useGetAndCacheFollowStatuses() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return async function (users: User[]) {
    const followStatuses = authUser
      ? await apiClient
          .get<FollowStatuses>(`/follows/statuses?userIds=${users.map(user => user._id).join(",")}`)
          .then(res => res.data)
      : {};

    users.forEach(user =>
      queryClient.setQueryData<FollowStatus>(
        ["followStatus", user.username],
        followStatuses[user.username] ?? { followerStatus: null, followingStatus: null }
      )
    );
  };
}
