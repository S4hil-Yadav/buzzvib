import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { AuthUser, User, FollowStatuses, FollowStatus } from "@/types";
import chatDb from "@/lib/chatDb.ts";

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

export function useGetAndCacheUsers() {
  return async (userIds: User["_id"][]) => {
    const users = await apiClient.get<User[]>(`/users?userIds=${userIds.join(",")}`).then(res => res.data);
    await chatDb.users.bulkPut(users);
  };
}

export function buildInfiniteScrollQuery(pageParam: Record<string, string> | null) {
  return pageParam
    ? Object.entries(pageParam)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&")
    : "";
}

export function inputSx(adornment: "InputAdornment" | "IconButton" = "InputAdornment") {
  return {
    "& .MuiOutlinedInput-root": {
      "&:hover fieldset": {
        borderColor: "primary.main",
      },
      [`&:hover .Mui${adornment}-root`]: {
        color: "primary.main",
      },
      "&.Mui-focused fieldset": {
        borderColor: "primary.dark",
      },
      [`&.Mui-focused .Mui${adornment}-root`]: {
        color: "primary.dark",
      },
      "&.Mui-error fieldset": {
        borderColor: "error.main",
      },
      [`&.Mui-error .Mui${adornment}-root`]: {
        color: "error.main",
      },
      "&.Mui-error:hover fieldset": {
        borderColor: "rgba(255, 0, 0, 0.6)",
      },
      [`&.Mui-error:hover .Mui${adornment}-root`]: {
        color: "rgba(255, 0, 0, 0.6)",
      },
      "&.Mui-error.Mui-focused fieldset": {
        borderColor: "error.main",
      },
      [`&.Mui-error.Mui-focused .Mui${adornment}-root`]: {
        color: "error.main",
      },
    },
  };
}
