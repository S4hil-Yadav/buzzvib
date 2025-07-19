import { useSocket } from "@/hooks/useSocket";
import type { Media, Post } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function GlobalSocketListeners() {
  const socket = useSocket();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    function handleNewPostMediaUploaded({ postId, media, status }: { postId: string; media: Media[]; status: Post["status"] }) {
      queryClient.setQueryData<Post>(["post", postId], data => data && { ...data, media, status });
    }

    function handleNewPostMediaError(message: string) {
      toast.error(message);
    }

    socket.on("post-media", handleNewPostMediaUploaded);
    socket.on("post-media:error", handleNewPostMediaError);

    return () => {
      socket.off("post-media", handleNewPostMediaUploaded);
      socket.off("post-media:error", handleNewPostMediaError);
    };
  }, [queryClient, socket]);

  return null;
}
