import { List, ListItem, Skeleton, Box } from "@mui/material";

export default function UserSkeleton({ count = 3 }) {
  return (
    <List disablePadding sx={{ width: "100%" }}>
      {Array.from({ length: count }).map((_, idx) => (
        <ListItem
          key={idx}
          disableGutters
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            py: 1.5,
            px: 1,
            borderTop: "1px solid",
            borderColor: "divider",
            ":first-of-type": {
              border: "none",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
            <Skeleton variant="circular" width={46} height={46} />
            <Box>
              <Skeleton variant="text" width={100} height={20} />
              <Skeleton variant="text" width={80} height={16} />
            </Box>
          </Box>

          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 2 }} />
        </ListItem>
      ))}
    </List>
  );
}
