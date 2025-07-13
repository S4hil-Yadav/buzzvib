// import { Box, Popover, Typography } from "@mui/material";
// import type { Message } from "@/types";

// export default function ReactionPopover({
//   anchorEl,
//   onClose,
//   message,
// }: {
//   anchorEl: HTMLElement | null;
//   onClose: () => void;
//   message: Message | null;
// }) {
//   return (
//     <Popover
//       open={Boolean(anchorEl)}
//       anchorEl={anchorEl}
//       onClose={onClose}
//       anchorOrigin={{ vertical: "top", horizontal: "left" }}
//       transformOrigin={{ vertical: "bottom", horizontal: "left" }}
//     >
//       <Box p={2}>
//         {message?.reactions?.map((r, idx) => (
//           <Box key={idx} display="flex" alignItems="center" mb={1}>
//             <Typography sx={{ fontSize: 20, mr: 1 }}>{r.emoji}</Typography>
//             <Typography variant="body2">{r.users.join(", ")}</Typography>
//           </Box>
//         ))}
//       </Box>
//     </Popover>
//   );
// }
