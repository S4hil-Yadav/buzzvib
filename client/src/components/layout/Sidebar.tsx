import { Drawer } from "@mui/material";

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      anchor="right"
      sx={{
        width: 300,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 300,
          height: "100vh",
          position: "fixed",
        },
      }}
    />
  );
}
