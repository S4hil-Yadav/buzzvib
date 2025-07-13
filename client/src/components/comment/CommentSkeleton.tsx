import { Divider, List, ListItem, Skeleton, Stack } from "@mui/material";

export default function CommentSkeletonList({ count = 3, isReply = false }) {
  return (
    <List
      sx={{
        ...(isReply ? { ml: -15, borderLeft: "1px solid", borderColor: "secondary.main" } : {}),
        px: { xs: 0, md: 1 },
        py: 1,
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <ListItem key={idx} disableGutters sx={{ px: 1 }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{
              width: "100%",
              pb: 2,
            }}
          >
            <Skeleton variant="circular" width={40} height={40} />

            <Stack spacing={1} flex={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack spacing={0.5}>
                  <Skeleton variant="text" width={120} height={20} />
                  <Skeleton variant="text" width={80} height={16} />
                </Stack>
              </Stack>

              <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />
            </Stack>
          </Stack>
          <Divider sx={{ mt: 2, borderColor: "primary.light" }} />
        </ListItem>
      ))}
    </List>
  );
}
