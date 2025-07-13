import { Box, Card, Skeleton, Avatar, Typography } from "@mui/material";

export default function NotificationSkeleton({ count = 10 }) {
  return (
    <Box
      component="ul"
      sx={{
        gap: 3,
        maxWidth: "48rem",
        width: "100%",
        mx: "auto",
        px: { xs: 3, md: 6 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          variant="outlined"
          component="li"
          sx={{
            width: "100%",
            p: 2,
            borderRadius: 3,
            position: "relative",
            overflow: "hidden",
            boxShadow: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Skeleton variant="circular">
              <Avatar sx={{ width: 50, height: 50 }} />
            </Skeleton>

            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="30%">
                <Typography>.</Typography>
              </Skeleton>
              <Skeleton variant="text" width="70%">
                <Typography>.</Typography>
              </Skeleton>
            </Box>
          </Box>

          <Skeleton variant="text" width="12%" sx={{ position: "absolute", right: 16, top: 8 }}>
            <Typography variant="caption">.</Typography>
          </Skeleton>
        </Card>
      ))}
    </Box>
  );
}
