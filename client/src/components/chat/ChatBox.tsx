// import { useEffect, useRef, useState } from "react";
// import { useParams } from "react-router-dom";
// import socket from "@/lib/socket.ts";
// import { Box } from "@mui/material";
// import MessageInput from "@/components/chat/MessageInput.tsx";
// import MessageList from "@/components/chat/MessageList.tsx";
// import ReactionPopover from "@/components/chat/ReactionPopover.tsx";
// import UserInfoPopover from "@/components/chat/UserInfoPopover.tsx";
// import type { Message } from "@/types";
// import toast from "react-hot-toast";
// import { useGetChatroomQuery } from "@/services/queries/chat.queries.ts";

// export default function ChatBox() {
//   const { chatroomId = "" } = useParams();
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const [input, setInput] = useState("");
//   const [userInfoAnchorEl, setUserInfoAnchorEl] = useState<HTMLElement | null>(null);
//   const [reactionAnchorEl, setReactionAnchorEl] = useState<HTMLElement | null>(null);
//   const [reactionPopoverMessage, setReactionPopoverMessage] = useState<Message | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);

// const { data: chatroom, isLoading, isError } = useGetChatroomQuery(chatroomId);

//   useEffect(() => {
//     if (!chatroomId) return;
//     socket.on("chatroom:error", (errorMsg: string) => toast.error(errorMsg));

//     return () => {
//       socket.off("receive-chatroom");
//       socket.off("chatroom:error");
//       // socket.emit("leaveRoom", chatroomId); // optionally handle leaving
//     };
//   }, [chatroomId]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   return (
//     <Box flexGrow={1} display="flex" flexDirection="column">
//       {/* <ChatHeader chatroom={chatroom} onHeaderClick={e => setUserInfoAnchorEl(e.currentTarget)} /> */}

//       <MessageList
//         messages={messages}
//         setMessages={setMessages}
//         setReactionPopoverMessage={setReactionPopoverMessage}
//         setReactionAnchorEl={setReactionAnchorEl}
//         messagesEndRef={messagesEndRef}
//       />

//       <MessageInput input={input} setInput={setInput} setMessages={setMessages} />

//       <UserInfoPopover anchorEl={userInfoAnchorEl} onClose={() => setUserInfoAnchorEl(null)} user={null} />

//       <ReactionPopover anchorEl={reactionAnchorEl} onClose={() => setReactionAnchorEl(null)} message={reactionPopoverMessage} />
//     </Box>
//   );
// }
