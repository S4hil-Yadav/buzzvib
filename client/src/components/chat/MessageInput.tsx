// import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
// import AttachFileIcon from "@mui/icons-material/AttachFile";
// import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
// import SendIcon from "@mui/icons-material/Send";
// import { useRef } from "react";
// import type { Message } from "@/types";

// interface Props {
//   input: string;
//   setInput: (val: string) => void;
//   setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
// }

// export default function MessageInput({ input, setInput }: Props) {
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleSend = () => {
//     if (!input.trim()) return;

//     // const newMessage: Message = {
//     //   id: String(Date.now()),
//     //   sender: "you",
//     //   isOwn: true,
//     //   content: input,
//     //   timestamp: new Date().toISOString(),
//     //   status: "pending",
//     //   reactions: [],
//     // };

//     // setMessages(prevMessages => [...prevMessages, newMessage]);
//     setInput("");
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // const url = URL.createObjectURL(file);
//     // const type = file.type.startsWith("image")
//     //   ? "image"
//     //   : file.type.startsWith("video")
//     //   ? "video"
//     //   : file.type.startsWith("audio")
//     //   ? "audio"
//     //   : "file";

//     // const newMessage: Message = {
//     //   id: String(Date.now()),
//     //   sender: "you",
//     //   isOwn: true,
//     //   media: {
//     //     url,
//     //     type,
//     //     filename: file.name,
//     //   },
//     //   timestamp: new Date().toISOString(),
//     //   status: "pending",
//     //   reactions: [],
//     // };

//     // setMessages(prevMessages => [...prevMessages, newMessage]);
//   };

//   return (
//     <Box p={2} borderTop="1px solid #e0e0e0">
//       <TextField
//         fullWidth
//         placeholder="Type a message..."
//         value={input}
//         onChange={e => setInput(e.target.value)}
//         onKeyDown={e => e.key === "Enter" && handleSend()}
//         InputProps={{
//           startAdornment: (
//             <InputAdornment position="start">
//               <IconButton component="label">
//                 <AttachFileIcon />
//                 <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} />
//               </IconButton>
//             </InputAdornment>
//           ),
//           endAdornment: (
//             <InputAdornment position="end">
//               <IconButton>
//                 <InsertEmoticonIcon />
//               </IconButton>
//               <IconButton onClick={handleSend}>
//                 <SendIcon color="primary" />
//               </IconButton>
//             </InputAdornment>
//           ),
//         }}
//       />
//     </Box>
//   );
// }
