import { Box, Skeleton } from "@mui/material";

export default function FollowRequestSkeleton({ count = 3 }) {
  return (
    <Box component="ul" sx={{ display: "flex", flexDirection: "column", width: "100%", gap: 2 }}>
      {Array.from({ length: count }).map((_, idx) => (
        <Box
          component="li"
          key={idx}
          sx={{
            p: 2,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "background.paper",
            border: "2px solid",
            borderColor: "secondary.main",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
            <Skeleton variant="circular" width={50} height={50} />
            <Box ml={2}>
              <Skeleton variant="text" width={120} height={20} />
              <Skeleton variant="text" width={100} height={16} />
            </Box>
          </Box>

          {/* Simulating action buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Skeleton variant="rectangular" width={30} height={30} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" width={30} height={30} sx={{ borderRadius: 2 }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
