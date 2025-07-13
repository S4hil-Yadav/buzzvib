import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export function useSeeAllNotificationsMutation() {
  return useMutation({
    mutationFn: () => apiClient.patch("/notifications/see-all"),
  });
}
