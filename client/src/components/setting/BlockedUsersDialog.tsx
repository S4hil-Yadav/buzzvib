import { Dialog, DialogContent, DialogTitle, Typography, Box, Button, IconButton, useTheme, useMediaQuery } from "@mui/material";
import { Close as CloseIcon, Block as BlockIcon } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { useGetBlockedUserDocsQuery } from "@/services/queries/follow.queries";
import RequestList from "@/components/follow-request/RequestList";

const FollowingRequestsDialog = React.memo(() => {
  const {
    data: blockedUserDocs,
    isLoading,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetBlockedUserDocsQuery();

  const [openBlockedUsersDialog, setOpenBlockedUsersDialog] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  function handleClose() {
    setOpenBlockedUsersDialog(false);
  }

  useEffect(() => {
    if (!blockedUserDocs?.length) {
      setOpenBlockedUsersDialog(false);
    }
  }, [blockedUserDocs]);

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
          {blockedUserDocs?.length ?? 0} blocked {(blockedUserDocs?.length ?? 0) > 1 ? "users" : "user"}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<BlockIcon />}
          onClick={() => setOpenBlockedUsersDialog(true)}
          disabled={!blockedUserDocs?.length}
          // sx={{}}
        >
          Manage
        </Button>
      </Box>

      <Dialog open={openBlockedUsersDialog} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
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
            Blocked Users
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <RequestList
            requestType="blocked"
            followRequests={blockedUserDocs}
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
