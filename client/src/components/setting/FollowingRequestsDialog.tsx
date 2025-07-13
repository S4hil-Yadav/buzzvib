import { Dialog, DialogContent, DialogTitle, Typography, Box, Button, IconButton, useTheme, useMediaQuery } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useGetFollowingRequestsQuery } from "@/services/queries/follow.queries";
import { Close as CloseIcon, PersonAddAlt as PersonAddIcon } from "@mui/icons-material";
import RequestList from "@/components/follow-request/RequestList";

const FollowingRequestsDialog = React.memo(() => {
  const {
    data: followingRequests,
    isLoading,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetFollowingRequestsQuery();

  const [openFollowingRequestsDialog, setOpenFollowingRequestsDialog] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  function handleClose() {
    setOpenFollowingRequestsDialog(false);
  }

  useEffect(() => {
    if (!followingRequests?.length) {
      setOpenFollowingRequestsDialog(false);
    }
  }, [followingRequests]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="body1" fontWeight={600}>
          {followingRequests?.length ?? 0} pending {(followingRequests?.length ?? 0) > 1 ? "requests" : "request"}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpenFollowingRequestsDialog(true)}
          disabled={!followingRequests?.length}
        >
          Manage
        </Button>
      </Box>

      <Dialog open={openFollowingRequestsDialog} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            mb: 4,
            height: 60,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box />
          <Typography fontSize={20} fontWeight={500} textAlign="center">
            Following Requests
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <RequestList
            requestType="following"
            followRequests={followingRequests}
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

export default FollowingRequestsDialog;
