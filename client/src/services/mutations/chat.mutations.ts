import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { Chatroom, User } from "@/types";

export function useCreatePrivateChatMutation() {
  const navigate = useNavigate();

  return useMutation<Chatroom["_id"], Error, { user: User }>({
    mutationFn: ({ user }) => apiClient.post<Chatroom["_id"]>("/chats/private", { userId: user._id }).then(res => res.data),

    onSuccess: chatroomId => {
      navigate(`/chat/${chatroomId}`);
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
    },
  });
}
