import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { AuthUser, SessionData } from "@/types";

export function useGetAuthQuery() {
  return useQuery<AuthUser>({
    queryKey: ["authUser"],
    queryFn: () => apiClient.get<AuthUser>("/auth").then(res => res.data),
    refetchOnReconnect: true,
  });
}

export function useGetAllSessionsQuery() {
  return useQuery<SessionData>({
    queryKey: ["sessions"],
    queryFn: () => apiClient.get<SessionData>("/auth/sessions").then(res => res.data),
  });
}
