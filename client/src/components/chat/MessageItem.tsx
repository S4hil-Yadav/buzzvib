// import { Box, IconButton, Paper, Typography, Menu, MenuItem } from "@mui/material";
// import { DoneAll, Done, AccessTime, InsertEmoticon, ExpandMore } from "@mui/icons-material";
// import type { Message } from "@/types";
// import { useState } from "react";

// interface Props {
//   msg: Message;
//   setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
//   setReactionAnchorEl: (el: HTMLElement | null) => void;
//   setReactionPopoverMessage: (msg: Message) => void;
// }

// export default function MessageItem({ msg, setMessages, setReactionAnchorEl, setReactionPopoverMessage }: Props) {
//   const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

//   return (
//     <Box
//       display="flex"
//       flexDirection="column"
//       alignItems={msg.isOwn ? "flex-end" : "flex-start"}
//       mb={4}
//       sx={{
//         position: "relative",
//         "&:hover .message-options-trigger": {
//           visibility: "visible",
//           opacity: 1,
//         },
//       }}
//     >
//       <Box
//         sx={{
//           maxWidth: "70%",
//           minWidth: "10rem",
//           width: "fit-content",
//           display: "flex",
//           position: "relative",
//         }}
//       >
//         <Paper
//           sx={{
//             px: 2,
//             pt: 1,
//             pb: 1.5,
//             borderRadius: 3,
//             bgcolor: msg.isOwn ? "primary.main" : "background.paper",
//             color: msg.isOwn ? "white" : "text.primary",
//             width: "100%",
//           }}
//         >
//           {/* Content */}
//           {msg.media ? (
//             msg.media.type === "image" ? (
//               <Box component="img" src={msg.media.url} alt="media" sx={{ maxWidth: 280, borderRadius: 1, mb: 0.5 }} />
//             ) : msg.media.type === "video" ? (
//               <Box component="video" src={msg.media.url} controls sx={{ maxWidth: 280, borderRadius: 1, mb: 0.5 }} />
//             ) : msg.media.type === "audio" ? (
//               <Box component="audio" src={msg.media.url} controls sx={{ width: 240, mb: 0.5 }} />
//             ) : (
//               <Typography>{msg.media.filename}</Typography>
//             )
//           ) : (
//             <Typography sx={{ mb: 0.5 }}>{msg.content}</Typography>
//           )}

//           {/* Time and Status */}
//           <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
//             <Typography variant="caption" color={msg.isOwn ? "white" : "text.secondary"}>
//               {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//             </Typography>
//             <Box display="flex" alignItems="center" gap={0.5}>
//               {msg.isOwn && msg.status === "seen" ? (
//                 <DoneAll fontSize="small" htmlColor="white" />
//               ) : msg.status === "delivered" ? (
//                 <Done fontSize="small" color="action" />
//               ) : msg.status === "pending" ? (
//                 <AccessTime fontSize="small" color="disabled" />
//               ) : null}
//               {/* <IconButton
//                 size="small"
//                 onClick={e => {
//                   setReactionAnchorEl(e.currentTarget);
//                   setReactionPopoverMessage(msg);
//                 }}
//               >
//                 <InsertEmoticon fontSize="small" />
//               </IconButton> */}
//             </Box>
//           </Box>
//         </Paper>

//         {/* Expand dropdown */}
//         <IconButton
//           size="small"
//           className="message-options-trigger"
//           sx={{
//             position: "absolute",
//             top: "50%",
//             transform: "translateY(-50%)",
//             right: msg.isOwn ? undefined : -36,
//             left: msg.isOwn ? -36 : undefined,
//             visibility: "hidden",
//             opacity: 0,
//             transition: "opacity 0.2s",
//           }}
//           onClick={e => {
//             setMenuAnchorEl(e.currentTarget);
//           }}
//         >
//           <ExpandMore fontSize="small" />
//         </IconButton>
//       </Box>

//       {/* Reaction Bubble */}
//       {msg.reactions && msg.reactions.length > 0 && (
//         <Box
//           sx={{
//             position: "absolute",
//             bottom: -18,
//             left: msg.isOwn ? "auto" : 12,
//             right: msg.isOwn ? 12 : "auto",
//             bgcolor: "background.paper",
//             px: 1,
//             py: 0.25,
//             borderRadius: 12,
//             boxShadow: 2,
//             cursor: "pointer",
//             display: "inline-flex",
//             alignItems: "center",
//             gap: 1,
//           }}
//           onClick={e => {
//             setReactionAnchorEl(e.currentTarget);
//             setReactionPopoverMessage(msg);
//           }}
//         >
//           {msg.reactions
//             .sort((a, b) => b.users.length - a.users.length)
//             .slice(0, 3)
//             .map((r, i) => (
//               <Typography key={i} sx={{ fontSize: 14 }}>
//                 {r.emoji} {r.users.length}
//               </Typography>
//             ))}
//         </Box>
//       )}

//       {/* Dropdown Menu */}
//       <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={() => setMenuAnchorEl(null)}>
//         <MenuItem
//           onClick={() => {
//             setReactionAnchorEl(menuAnchorEl);
//             setReactionPopoverMessage(msg);
//             setMenuAnchorEl(null);
//           }}
//         >
//           <IconButton
//             size="small"
//             onClick={e => {
//               setReactionAnchorEl(e.currentTarget);
//               setReactionPopoverMessage(msg);
//             }}
//           >
//             <InsertEmoticon fontSize="small" />
//           </IconButton>
//         </MenuItem>
//         {msg.isOwn && (
//           <>
//             <MenuItem onClick={() => console.log("Edit", msg.id)}>Edit</MenuItem>
//             <MenuItem
//               onClick={() => {
//                 setMessages(prev => prev.filter(m => m.id !== msg.id));
//                 setMenuAnchorEl(null);
//               }}
//             >
//               Delete
//             </MenuItem>
//           </>
//         )}
//       </Menu>
//     </Box>
//   );
// }
