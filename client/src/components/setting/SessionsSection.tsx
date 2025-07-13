import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandIcon,
  Logout as LogoutIcon,
  DeviceUnknown as DeviceIcon,
  Public as LocationIcon,
  Language as IPAddressIcon,
} from "@mui/icons-material";
import { useGetAllSessionsQuery } from "@/services/queries/auth.queries";
import { useLogoutAllSessionsMutation, useLogoutSessionMutation } from "@/services/mutations/auth.mutations";
import dayjs from "@/lib/dayjs";
import { useDispatch } from "react-redux";
import { openAlert } from "@/redux/slices/alertSlice";
import type { Session } from "@/types";

export default function SessionsSection() {
  const { data: sessionData, isLoading, isError } = useGetAllSessionsQuery();
  const { mutate: logoutSession, isPending: isPendingLogoutSession } = useLogoutSessionMutation();
  const { mutate: logoutAllSessions, isPending: isPendingLogoutAll } = useLogoutAllSessionsMutation();

  const dispatch = useDispatch();

  const { currentSession, otherSessions } = sessionData ?? {};

  function handleLogoutSession(sessionId: Session["_id"]) {
    dispatch(
      openAlert({
        title: "Revoke?",
        message: "Are you sure you want to revoke this session?",
        confirmButtonText: "revoke",
        onConfirm: () => logoutSession({ sessionId }),
      })
    );
  }

  function handleLogoutAllSessions() {
    dispatch(
      openAlert({
        title: "Revoke All?",
        message: "Are you sure you want to revoke all sessions?",
        confirmButtonText: "revoke",
        onConfirm: () => logoutAllSessions(),
      })
    );
  }

  return (
    <Accordion sx={{ px: 2 }}>
      <AccordionSummary expandIcon={<ExpandIcon />}>
        <Typography fontWeight={600}>Manage your sessions</Typography>
      </AccordionSummary>

      <AccordionDetails>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Typography color="error">Failed to load sessions</Typography>
        ) : (
          <>
            {currentSession && (
              <>
                <Typography fontWeight={500} variant="h6" mb={1}>
                  Current session
                </Typography>
                <Card
                  variant="outlined"
                  sx={{
                    borderColor: "primary.main",
                    backgroundColor: "primary.lighter",
                    mb: 2,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    ":hover": {
                      transform: "scale(1.02)",
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={1} mb={1} alignItems="center">
                      <Chip label="Current" color="primary" size="small" />
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(currentSession.lastUsedAt).format("YYYY-MM-DD HH:mm")}
                      </Typography>
                    </Stack>

                    <Divider sx={{ mb: 1 }} />

                    <Stack spacing={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <IPAddressIcon fontSize="small" />
                        <Typography variant="body2">IP: {currentSession.ip || "Unknown"}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationIcon fontSize="small" />
                        <Typography variant="body2">Location: {currentSession.location || "Unknown"}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DeviceIcon fontSize="small" />
                        <Typography variant="body2">Device: {currentSession.device || "Unknown"}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </>
            )}

            <Typography fontWeight={500} variant="h6" mb={1}>
              Other active sessions
            </Typography>

            <Stack spacing={2}>
              {otherSessions?.length ? (
                otherSessions.map(session => (
                  <Card
                    key={session._id}
                    variant="outlined"
                    sx={{
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      ":hover": {
                        transform: "scale(1.02)",
                        boxShadow: 2,
                      },
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1} mb={1}>
                        <Typography variant="caption" color="text.secondary">
                          Last used: {dayjs(session.lastUsedAt).format("YYYY-MM-DD HH:mm")}
                        </Typography>
                        <Divider />
                      </Stack>

                      <Stack spacing={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <IPAddressIcon fontSize="small" />
                          <Typography variant="body2">IP: {session.ip || "Unknown"}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon fontSize="small" />
                          <Typography variant="body2">Location: {session.location || "Unknown"}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DeviceIcon fontSize="small" />
                          <Typography variant="body2">Device: {session.device || "Unknown"}</Typography>
                        </Box>
                      </Stack>

                      <Tooltip title="Revoke this session" arrow>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<LogoutIcon />}
                          sx={{ mt: 2 }}
                          onClick={() => handleLogoutSession(session._id)}
                          disabled={isPendingLogoutSession}
                        >
                          Revoke
                        </Button>
                      </Tooltip>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <i>No other active sessions found.</i>
              )}
            </Stack>

            {!!otherSessions?.length && (
              <Button
                variant="contained"
                color="error"
                fullWidth
                sx={{ mt: 3, textTransform: "none", fontWeight: 500 }}
                onClick={handleLogoutAllSessions}
                disabled={isPendingLogoutAll}
              >
                Revoke all other sessions
              </Button>
            )}
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
