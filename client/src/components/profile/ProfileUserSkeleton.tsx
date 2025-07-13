import { Box, Card, CardContent, Skeleton } from "@mui/material";

export default function ProfileUserSkeleton() {
  return (
    <Box
      sx={{
        width: { xs: "100%", lg: 340 },
        height: { xs: "auto", lg: "100vh" },
        bgcolor: "background.paper",
        borderLeft: { lg: "1px solid" },
        borderBottom: { xs: "1px solid", lg: 0 },
        borderColor: { xs: "secondary.main", lg: "secondary.main" },
        display: "flex",
        flexDirection: "column",
        gap: 3,
        px: 3.5,
        py: 2,
        position: { lg: "fixed" },
        right: 0,
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Avatar and name section */}
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} pt={3}>
        <Skeleton variant="circular" width={120} height={120} />
        <Skeleton width="60%" />
        <Skeleton width="40%" />
        <Skeleton variant="rounded" width={140} height={36} />
      </Box>

      {/* Stats */}
      <Card variant="outlined" sx={{ mt: 1 }}>
        <CardContent sx={{ display: "flex", justifyContent: "space-around", gap: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Skeleton width={50} height={20} />
            <Skeleton width={30} height={24} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Skeleton width={60} height={20} />
            <Skeleton width={30} height={24} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Skeleton width={70} height={20} />
            <Skeleton width={30} height={24} />
          </Box>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card variant="outlined" sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: "background.paper", boxShadow: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Skeleton height={40} />
          <Skeleton height={100} />
        </CardContent>
      </Card>
    </Box>
  );
}
