import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { Chatroom, ChatroomPage, Message, MessagePage } from "@/types";
import { buildInfiniteScrollQuery } from "@/utils";
import chatDb from "@/lib/chatDb.ts";

export function useGetChatroomsQuery() {
  const queryClient = useQueryClient();

  return useInfiniteQuery<ChatroomPage, Error, Chatroom[], ["chatrooms"], ChatroomPage["nextPageParam"]>({
    queryKey: ["chatrooms"],

    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const page = await apiClient.get<ChatroomPage>(`/chats?${buildInfiniteScrollQuery(pageParam)}`).then(res => res.data);
      page.chatrooms.forEach(chatroom => queryClient.setQueryData<Chatroom>(["chatroom", chatroom._id], chatroom));
      return page;
    },

    getNextPageParam: lastPage => lastPage.nextPageParam,
    select: ({ pages }) => pages.flatMap(({ chatrooms }) => chatrooms),

    refetchOnReconnect: true,
  });
}

export function useGetChatroomQuery(chatroomId: Chatroom["_id"]) {
  return useQuery<Chatroom>({
    queryKey: ["chatroom", chatroomId],

    queryFn: () => apiClient.get<Chatroom>(`/chats/${chatroomId}`).then(res => res.data),

    refetchOnReconnect: true,
  });
}

export function useChatMessagesQuery(chatroomId: string) {
  return useInfiniteQuery<MessagePage, Error, Message[], ["chatroom", string, "messages"], MessagePage["previousPageParam"]>({
    queryKey: ["chatroom", chatroomId, "messages"],

    initialPageParam: null,

    queryFn: async ({ pageParam }) => {
      const page = await apiClient
        .get<MessagePage>(`/chats/${chatroomId}/messages?${buildInfiniteScrollQuery(pageParam)}`)
        .then(res => res.data);
      await chatDb.messages.bulkPut(page.messages);
      return page;
    },

    getPreviousPageParam: lastPage => lastPage.previousPageParam,
    getNextPageParam: () => null,

    select: ({ pages }) => pages.flatMap(page => page.messages).reverse(),
  });
}
