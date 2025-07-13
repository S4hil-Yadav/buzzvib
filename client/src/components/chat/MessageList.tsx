// import { Box } from "@mui/material";
// import MessageItem from "./MessageItem";
// import type { Message } from "@/types";

// export default function MessageList({
//   messages,
//   setMessages,
//   setReactionPopoverMessage,
//   setReactionAnchorEl,
//   messagesEndRef,
// }: {
//   messages: Message[];
//   setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
//   setReactionPopoverMessage: (msg: Message) => void;
//   setReactionAnchorEl: (el: HTMLElement | null) => void;
//   messagesEndRef: React.RefObject<HTMLDivElement | null>;
// }) {
//   return (
//     <Box flexGrow={1} overflow="auto" px={4} py={2}>
//       {messages.map(msg => (
//         <MessageItem
//           key={msg.id}
//           msg={msg}
//           setMessages={setMessages}
//           setReactionPopoverMessage={setReactionPopoverMessage}
//           setReactionAnchorEl={setReactionAnchorEl}
//         />
//       ))}
//       <Box ref={messagesEndRef} />
//     </Box>
//   );
// }
