import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";

export default function LoadingApp() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessage("This may take a few seconds if the app was inactive.");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ height: "100vh", width: "100vw", justifyItems: "center", alignContent: "center" }}>
      <CircularProgress size={48} thickness={4} color="primary" />
      <Typography variant="body2" sx={{ marginTop: 2 }}>
        {message}
      </Typography>
    </Box>
  );
}
