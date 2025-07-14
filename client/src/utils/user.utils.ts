import { apiClient } from "@/lib/axios";
import type { User } from "@/types";
import chatDb from "@/lib/chatDb.ts";

export async function useGetAndCacheUsers(userIds: User["_id"][]) {
  const users = await apiClient.get<User[]>(`/users?userIds=${userIds.join(",")}`).then(res => res.data);
  await chatDb.users.bulkPut(users);
}
