import { Box, Button } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "@/redux/slices/themeSlice.ts";
import type { AppDispatch, RootState } from "@/redux/store.ts";

interface ThemeSettingsProps {
  Section: React.FC<{ title: string; children: React.ReactNode }>;
}
export default function ThemeSection({ Section }: ThemeSettingsProps) {
  const mode = useSelector((state: RootState) => state.theme.mode);

  return (
    <Section title="Appearance">
      <ThemeToggleButtons value={mode} />
    </Section>
  );
}

interface ThemeToggleButtonsProps {
  value: "light" | "dark";
}

function ThemeToggleButtons({ value }: ThemeToggleButtonsProps) {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <Box borderRadius={2} sx={{ display: "flex", alignItems: "center" }}>
      {/* Light Button (Left) */}
      <Button
        onClick={() => dispatch(setTheme("light"))}
        startIcon={<LightModeIcon sx={{ color: value === "light" ? "primary.dark" : "text.secondary" }} fontSize="small" />}
        sx={{
          borderRadius: "8px 0 0 8px",
          border: "1px solid",
          borderColor: value === "light" ? "primary.dark" : "grey.300",
          borderRight: "none",
          px: 2,
          py: 1,
          textTransform: "none",
          minWidth: "64px",
          userSelect: "none",
          color: value === "light" ? "primary.dark" : "text.secondary",
        }}
      >
        Light
      </Button>
      {/* Dark Button (Right) */}
      <Button
        onClick={() => dispatch(setTheme("dark"))}
        startIcon={<DarkModeIcon sx={{ color: value === "dark" ? "primary.dark" : "text.secondary" }} fontSize="small" />}
        sx={{
          borderRadius: "0 8px 8px 0",
          border: "1px solid",
          borderColor: value === "dark" ? "primary.dark" : "grey.300",
          borderLeftColor: "primary.dark",
          px: 2,
          py: 1,
          textTransform: "none",
          minWidth: "64px",
          userSelect: "none",
          color: value === "dark" ? "primary.dark" : "text.secondary",
        }}
      >
        Dark
      </Button>
    </Box>
  );
}
