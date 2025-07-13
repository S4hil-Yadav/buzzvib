import axios, { type InternalAxiosRequestConfig } from "axios";

const baseURL = `${import.meta.env.VITE_API_URL}/api/v1`;

export const apiClient = axios.create({ baseURL, withCredentials: true });

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
  async err => {
    if (!axios.isAxiosError(err) || !err.config || retriedRequests.has(err.config)) {
      return Promise.reject(err);
    }

    const originalRequest = err.config;

    if (err.response?.data?.code === "INVALID_ACCESS_TOKEN") {
      if (isRefreshing) {
        return new Promise(resolve => queuedRequests.push(() => resolve(apiClient(originalRequest))));
      }

      retriedRequests.add(originalRequest);
      isRefreshing = true;

      try {
        await axios.post<void>(`${baseURL}/auth/refresh-token`, {}, { withCredentials: true });

        queuedRequests.forEach(cb => cb());
        queuedRequests = [];
        return apiClient(originalRequest);
      } catch (err) {
        queuedRequests = [];
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);
