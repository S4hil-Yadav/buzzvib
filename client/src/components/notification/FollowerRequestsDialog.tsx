import { Dialog, DialogContent, DialogTitle, Typography, Box, Button, IconButton, useMediaQuery } from "@mui/material";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useSeeAllFollowerRequestsMutation } from "@/services/mutations/follow.mutations";
import type { AuthUser, FollowRequestPage } from "@/types";
import React, { useEffect, useState } from "react";
import { useGetFollowerRequestsQuery } from "@/services/queries/follow.queries";
import { Close as CloseIcon, PersonAddAlt as PersonAddIcon } from "@mui/icons-material";
import RequestList from "@/components/follow-request/RequestList";

const FollowerRequestsDialog = React.memo(() => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"]);

  const {
    data: followerRequests,
    isLoading,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetFollowerRequestsQuery();

  const { mutate: seeAllFollowerRequests } = useSeeAllFollowerRequestsMutation();

  const [openFollowerRequestDialog, setOpenFollowerRequestDialog] = useState(false);

  useEffect(
    () => () => {
      seeAllFollowerRequests();

      queryClient.setQueryData<InfiniteData<FollowRequestPage>>(
        ["followerRequests"],
        data =>
          data && {
            ...data,
            pages: data.pages.map(page => ({
              ...page,
              followerRequests: page.followRequests.map(req => (req.seenAt ? req : { ...req, seenAt: new Date().toISOString() })),
            })),
          }
      );
    },
    [authUser, seeAllFollowerRequests, queryClient]
  );

  const isMobile = useMediaQuery(theme => theme.breakpoints.down("sm"));

  const handleClose = () => setOpenFollowerRequestDialog(false);

  if (!followerRequests?.length) return null;

  const hasUnseen = followerRequests.some(req => !req.seenAt);

  return (
    <>
      <Button
        variant="outlined"
        onClick={() => setOpenFollowerRequestDialog(true)}
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          gap: 2,
          bgcolor: "background.paper",
          borderColor: "primary.light",
          color: "primary.dark",
          fontWeight: 600,
          px: 2,
          py: 1.5,
          position: "relative",
          "&:hover": {
            bgcolor: "primary.light",
            color: "primary.contrastText",
          },
        }}
      >
        {hasUnseen && (
          <>
            <Box
              sx={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "success.main",
                opacity: 0.5,
                animation: "muiPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "success.main",
              }}
            />
          </>
        )}
        <PersonAddIcon fontSize="medium" />
        <Typography fontWeight="bold" fontSize="0.95rem">
          You have new&nbsp;Follow&nbsp;
          {followerRequests.length === 1 ? "Request" : "Requests"}
        </Typography>
      </Button>

      <Dialog
        open={openFollowerRequestDialog}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        slotProps={{
          paper: {
            sx: theme => ({
              bgcolor: theme.palette.mode === "dark" ? "#16161D" : "#ffffff",
              color: theme.palette.text.primary,
              borderRadius: 3,
              boxShadow: theme.palette.mode === "dark" ? "0 0 20px rgba(0,0,0,1)" : "0 4px 20px rgba(0,0,0,0.1)",
            }),
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            mb: 4,
            height: 60,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box />
          <Typography fontSize={20} fontWeight={500} textAlign="center">
            Follow Requests
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <RequestList
            requestType="follower"
            followRequests={followerRequests}
            closeDialog={handleClose}
            isLoading={isLoading}
            isError={isError}
            isFetching={isFetching}
            refetch={refetch}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </DialogContent>
      </Dialog>
    </>
  );
});

export default FollowerRequestsDialog;
