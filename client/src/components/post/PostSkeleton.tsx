import { Box, Stack, Skeleton, useMediaQuery } from "@mui/material";

export default function PostSkeleton({ count = 3, stretch = false }) {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down("sm"));

  return (
    <Box
      component="ul"
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: isMobile ? 0.5 : 5,
        px: { xs: 0, sm: 5 },
        mb: 5,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Box
          component="li"
          key={i}
          sx={{
            width: "100%",
            maxWidth: stretch ? "100%" : "40rem",
            px: 4,
            py: 3,
            borderRadius: isMobile ? 0 : 2,
            bgcolor: "background.paper",
            listStyle: "none",
          }}
        >
          {/* Header */}
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Skeleton variant="circular" width={50} height={50} />
            <Box flex={1}>
              <Skeleton height={20} width="60%" />
              <Skeleton height={15} width="40%" />
            </Box>
          </Stack>

          {/* Body */}
          <Box mb={4}>
            <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />
          </Box>

          {/* Footer */}
          <Stack direction="row" spacing={2} width="100%" justifyContent="space-between">
            <Skeleton variant="rounded" width={120} height={35} />
            <Skeleton variant="rounded" width={60} height={35} />
            <Skeleton variant="rounded" width={40} height={35} />
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
