import type { Tokens } from "@/types";
import { clearTokens, setTokens } from "@/utils";
import axios, { type InternalAxiosRequestConfig } from "axios";

const baseURL = `${import.meta.env.VITE_API_URL}/api/v1`;

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem("accessToken");
    const sessionId = localStorage.getItem("sessionId");

    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    if (sessionId) config.headers["x-session-id"] = sessionId;

    return config;
  },
  error => Promise.reject(error)
);

let isRefreshing = false;
let queuedRequests: (() => void)[] = [];
const retriedRequests = new WeakSet<InternalAxiosRequestConfig>();

apiClient.interceptors.response.use(
  res => {
    const contentType = res.headers["content-type"];
    if (contentType && !contentType.includes("application/json")) {
      throw new Error("Unexpected response type — likely HTML");
    }
    return res;
  },
  async error => {
    if (!axios.isAxiosError(error) || !error.config || retriedRequests.has(error.config)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (error.response?.data?.code === "INVALID_ACCESS_TOKEN") {
      if (isRefreshing) {
        clearTokens();
        return new Promise(resolve => queuedRequests.push(() => resolve(apiClient(originalRequest))));
      }

      retriedRequests.add(originalRequest);
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        const { data } = await axios.post<Tokens>(
          `${baseURL}/auth/refresh-token`,
          {},
          { headers: refreshToken ? { "x-refresh-token": refreshToken } : {} }
        );

        setTokens(data);

        queuedRequests.forEach(cb => cb());
        queuedRequests = [];
        return apiClient(originalRequest);
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          ["INVALID_REFRESH_TOKEN", "MISSING_REFRESH_TOKEN"].includes(error.response?.data?.code)
        ) {
          clearTokens();
        }
        queuedRequests = [];
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
