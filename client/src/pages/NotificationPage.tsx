import { useEffect, useRef } from "react";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import FollowerRequestsDialog from "@/components/notification/FollowerRequestsDialog";
import { useSeeAllNotificationsMutation } from "@/services/mutations/notification.mutations";
import { useGetNotificationsQuery } from "@/services/queries/notification.queries";
import LoadingOrError from "@/components/elements/LoadingOrError";
import NotificationCard from "@/components/notification/NotificationCard";
import NotificationSkeleton from "@/components/notification/NotificationSkeleton";
import type { NotificationPage } from "@/types";

export default function NotificationPage() {
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isLoading,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetNotificationsQuery();

  const { mutate: seeAllNotifications } = useSeeAllNotificationsMutation();

  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["notifications"], refetchType: "active" });
    queryClient.invalidateQueries({ queryKey: ["followerRequests"], refetchType: "active" });
  }, [queryClient]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    return () => {
      seeAllNotifications();

      queryClient.setQueryData<InfiniteData<NotificationPage>>(
        ["notifications"],
        data =>
          data && {
            ...data,
            pages: data.pages.map(page => ({
              ...page,
              notifications: page.notifications.map(n => (n.seenAt ? n : { ...n, seenAt: new Date().toISOString() })),
            })),
          }
      );
    };
  }, [seeAllNotifications, queryClient]);

  if (isLoading || isError || !notifications) {
    return (
      <Box sx={{ my: 1, width: "100%" }}>
        <LoadingOrError
          isLoading={isLoading}
          isError={isError || !notifications}
          LoadingComponent={<NotificationSkeleton />}
          errorMessage="Failed to fetch notifications"
          isFetching={isFetching}
          refetch={refetch}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        px: { xs: 3, md: 6 },
        py: 4,
        pb: 5,
      }}
    >
      {/* 
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          color: "primary.dark",
          textAlign: "center",
          mt: 3,
          mb: 4,
          textTransform: "capitalize",
        }}
      >
        Notifications
      </Typography> 
      */}

      <FollowerRequestsDialog />

      {!notifications.length ? (
        <Typography
          sx={{
            fontSize: "1.2rem",
            fontWeight: 500,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          You don't have notifications
        </Typography>
      ) : (
        <Box
          component="ul"
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            alignItems: "center",
            gap: 3,
          }}
        >
          {notifications.map((notification, i) => (
            <Box key={notification._id} sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
              {i === notifications.length - 4 && <Box ref={loaderRef} />}
              <Box component="li" sx={{ width: "100%", maxWidth: "48rem", listStyle: "none" }}>
                <NotificationCard notification={notification} />
              </Box>
            </Box>
          ))}
          {isFetchingNextPage && <NotificationSkeleton />}
        </Box>
      )}
    </Box>
  );
}
