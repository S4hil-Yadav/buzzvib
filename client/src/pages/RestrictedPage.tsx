import { Button, Typography, Box, Stack, Paper } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function RestrictedPage() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        px: 2,
        width: "100%",
      }}
    >
      <Paper
        sx={{
          p: 5,
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          borderRadius: 2,
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography sx={{ fontSize: "1.5rem", fontWeight: 600, mb: 1, color: "text.primary" }}>Restricted Access</Typography>
        <Typography sx={{ fontSize: "1rem", color: "text.secondary", mb: 4 }}>
          You need to be logged in to use this feature.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            component={RouterLink}
            to="/auth"
            state={{ authType: "login" }}
            sx={{
              border: "1px solid",
              color: "text.secondary",
              px: 3,
              py: 1,
              borderRadius: 1,
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { color: "text.primary" },
            }}
          >
            Login
          </Button>
          <Button
            component={RouterLink}
            to="/auth"
            sx={{
              backgroundColor: "primary.main",
              color: "primary.contrastText",
              px: 3,
              py: 1,
              borderRadius: 1,
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { backgroundColor: "primary.dark" },
            }}
          >
            Signup
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
