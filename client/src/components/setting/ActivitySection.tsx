import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { ThumbUp, ThumbDown, Bookmark } from "@mui/icons-material";
import { Link } from "react-router-dom";

export default function ActivitySection() {
  return (
    <List>
      <ListItemButton component={Link} to="/activity/liked" sx={{ borderRadius: 2, mb: 1 }}>
        <ListItemIcon>
          <ThumbUp color="primary" />
        </ListItemIcon>
        <ListItemText primary="Liked Posts" />
      </ListItemButton>

      <ListItemButton component={Link} to="/activity/disliked" sx={{ borderRadius: 2, mb: 1 }}>
        <ListItemIcon>
          <ThumbDown color="primary" />
        </ListItemIcon>
        <ListItemText primary="Disliked Posts" />
      </ListItemButton>

      <ListItemButton component={Link} to="/activity/saved" sx={{ borderRadius: 2 }}>
        <ListItemIcon>
          <Bookmark color="primary" />
        </ListItemIcon>
        <ListItemText primary="Saved Posts" />
      </ListItemButton>
    </List>
  );
}
