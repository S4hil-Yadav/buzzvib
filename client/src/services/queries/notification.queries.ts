import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { AuthUser, Notification, NotificationPage } from "@/types";
import { buildInfiniteScrollQuery } from "../../utils/utils";

export function useGetNotificationsQuery() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  return useInfiniteQuery<NotificationPage, Error, Notification[], ["notifications"], NotificationPage["nextPageParam"]>({
    queryKey: ["notifications"],

    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const page = await apiClient
        .get<NotificationPage>(`/notifications?${buildInfiniteScrollQuery(pageParam)}`)
        .then(res => res.data);
      return page;
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,

    select: ({ pages }) => pages.flatMap(({ notifications }) => notifications),

    enabled: !!authUser,
  });
}
