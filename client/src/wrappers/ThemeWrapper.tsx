import { useSelector } from "react-redux";
import { CssBaseline, ThemeProvider } from "@mui/material";
import type { RootState } from "@/redux/store.ts";
import { darkTheme, lightTheme } from "@/lib/themes.ts";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const mode = useSelector((state: RootState) => state.theme.mode);

  return (
    <ThemeProvider theme={mode === "light" ? lightTheme : darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
