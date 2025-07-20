// theme.ts
import { createTheme, type Theme } from "@mui/material/styles";

// --- Shared Styles ---
const baseTypography = {
  fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  button: {
    textTransform: "none" as const,
    fontWeight: 600,
  },
};

const componentOverrides = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: "12px",
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        textDecoration: "none",
        "&:hover": {
          textDecoration: "none",
        },
      },
    },
  },
  MuiDialog: {
    defaultProps: {
      slotProps: {
        paper: {
          sx: (theme: Theme) => ({
            bgcolor: theme.palette.mode === "dark" ? "#0A0F1C" : "#ffffff",
            color: theme.palette.text.primary,
            borderRadius: 3,
            boxShadow: theme.palette.mode === "dark" ? "0 0 20px rgba(0,0,0,1)" : "0 4px 20px rgba(0,0,0,0.1)",
          }),
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: "12px",
      },
      standardError: ({ theme }: { theme: Theme }) => ({
        backgroundColor: theme.palette.mode === "dark" ? "#2D1B1B" : "#FEF2F2",
        color: theme.palette.mode === "dark" ? "#F87171" : "#B91C1C",
        "& .MuiAlert-icon": {
          color: theme.palette.mode === "dark" ? "#F87171" : "#EF4444",
        },
      }),
      standardWarning: ({ theme }: { theme: Theme }) => ({
        backgroundColor: theme.palette.mode === "dark" ? "#2D2416" : "#FFFBEB",
        color: theme.palette.mode === "dark" ? "#FBBF24" : "#92400E",
        "& .MuiAlert-icon": {
          color: theme.palette.mode === "dark" ? "#FBBF24" : "#F59E0B",
        },
      }),
      standardInfo: ({ theme }: { theme: Theme }) => ({
        backgroundColor: theme.palette.mode === "dark" ? "#1E2A3A" : "#EFF6FF",
        color: theme.palette.mode === "dark" ? "#60A5FA" : "#1E40AF",
        "& .MuiAlert-icon": {
          color: theme.palette.mode === "dark" ? "#60A5FA" : "#3B82F6",
        },
      }),
      standardSuccess: ({ theme }: { theme: Theme }) => ({
        backgroundColor: theme.palette.mode === "dark" ? "#1A2E1A" : "#F0FDF4",
        color: theme.palette.mode === "dark" ? "#4ADE80" : "#166534",
        "& .MuiAlert-icon": {
          color: theme.palette.mode === "dark" ? "#4ADE80" : "#22C55E",
        },
      }),
    },
  },
  MuiCssBaseline: {
    styleOverrides: `
      @keyframes muiPing {
        0% { transform: scale(0.8); opacity: 0.8; }
        75% { transform: scale(2.5); opacity: 0; }
        100% { transform: scale(2.5); opacity: 0; }
      }
    `,
  },
};

// --- 🌤 Light Theme (Emilia-inspired) ---
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#A78BFA", // Soft Amethyst Purple
      light: "#D8B4FE",
      dark: "#7C3AED",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#E0E7FF", // Soft lavender
      light: "#F5F3FF",
      dark: "#C7D2FE",
      contrastText: "#5B21B6",
    },
    background: {
      default: "#F9FAFB", // Light silver background
      paper: "#ffffff", // Card / Drawer background
    },
    text: {
      primary: "#4B5563", // Dark gray text
      secondary: "#6B7280", // Softer gray
    },
    error: {
      main: "#EF4444", // Bright, attention-grabbing red (used by default in MUI)
      light: "#F87171", // Softer red for hover/active states
      dark: "#B91C1C", // Deep red for contrast or focus states
      contrastText: "#ffffff", // White text on red background
    },

    divider: "rgba(0, 0, 0, 0.1)",
  },
  typography: baseTypography,
  components: componentOverrides,
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#E8DCFE", // Soft violet
      light: "#D8B4FE", // Notification ping, hover
      dark: "#BB9AFB", // Richer hover/active
      contrastText: "#1F1F2F",
    },
    secondary: {
      main: "#394256", // Muted bluish-gray
      light: "#4B5565",
      dark: "#2A2D3C",
      contrastText: "#F3F4F6",
    },
    background: {
      default: "#1E1F2A", // Full page background
      paper: "#282A36", // Drawer, Navbar, Cards
    },
    text: {
      primary: "#E0E0E0", // Main light text
      secondary: "#A0A0B2", // Muted gray text
    },
    action: {
      hover: "rgba(255, 255, 255, 0.08)",
      selected: "rgba(255, 255, 255, 0.12)",
    },
    error: {
      main: "#F87171", // Softer red works better on dark
      light: "#FCA5A5", // Slightly gentler red for hover
      dark: "#DC2626", // Rich, saturated dark red
      contrastText: "#1E1F2A", // Your dark background for contrast (matches your palette)
    },
    divider: "rgba(255, 255, 255, 0.1)",
  },
  typography: baseTypography,
  components: componentOverrides,
});
