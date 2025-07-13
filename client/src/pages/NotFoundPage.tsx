import { Box, Typography, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";

export default function NotFound() {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        mx: "auto",
        color: "text.primary",
        px: 2,
        textAlign: "center",
      }}
    >
      <SentimentVeryDissatisfiedIcon sx={{ fontSize: 80, mb: 2, color: "primary.main" }} />
      {/* <Typography variant="h2" fontWeight={700} gutterBottom>
        404
      </Typography> */}
      <Typography variant="h5" gutterBottom>
        Oops! Page not found.
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, maxWidth: 400 }}>
        The page you're looking for doesn't exist or has been moved. Please check the URL or return home.
      </Typography>
      <MuiLink
        component={RouterLink}
        to="/home"
        sx={{ borderRadius: "12px", px: 4, py: 1.5, fontWeight: 600, bgcolor: "primary.main", color: "primary.contrastText" }}
      >
        Go Home
      </MuiLink>
    </Box>
  );
}
