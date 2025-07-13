import { type RootState } from "@/redux/store.ts";
import { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";

export default function ToastProvider() {
  const theme = useSelector((state: RootState) => state.theme.mode);

  const isDark = theme === "dark";

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: isDark ? "#1f2937" : "#fff",
          color: isDark ? "#f9fafb" : "#1f2937",
          borderRadius: "8px",
          padding: "12px 16px",
        },
        success: {
          iconTheme: {
            primary: isDark ? "#10b981" : "#22c55e",
            secondary: isDark ? "#f9fafb" : "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: isDark ? "#ef4444" : "#dc2626",
            secondary: isDark ? "#f9fafb" : "#fff",
          },
        },
      }}
    />
  );
}
