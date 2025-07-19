import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store, persistor } from "@/redux/store";
import { PersistGate } from "redux-persist/integration/react";
import App from "@/App";
import "@/index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import ScrollToTop from "@/lib/ScrollToTop.jsx";
import { SocketProvider } from "@/context/SocketProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ThemeWrapper from "@/wrappers/ThemeWrapper";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import CssBaseline from "@mui/material/CssBaseline";
import GlobalDialogues from "@/components/dialog/GlobalDialogues";
import axios from "axios";
import ToastProvider from "@/wrappers/ToastProvider";
import GlobalSocketListeners from "@/lib/listeners/GlobalSocketListeners";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error) && error.response?.status === 500) {
          return failureCount < 3;
        }
        return false;
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    {/* <ScrollToTop /> */}
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        {import.meta.env.MODE === "development" && <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left" />}
        <SocketProvider>
          <PersistGate persistor={persistor}>
            <Provider store={store}>
              <ThemeWrapper>
                <GlobalSocketListeners />
                <CssBaseline />
                <ToastProvider />
                <GlobalDialogues />
                <App />
              </ThemeWrapper>
            </Provider>
          </PersistGate>
        </SocketProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
