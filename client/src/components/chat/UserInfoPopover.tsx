// import { Avatar, Box, Popover, Typography } from "@mui/material";

// interface User {
//   id: string;
//   name: string;
//   avatar: string;
//   lastMessage: string;
//   unread: number;
//   isActive: boolean;
// }

// export default function UserInfoPopover({
//   anchorEl,
//   onClose,
//   user,
// }: {
//   anchorEl: HTMLElement | null;
//   onClose: () => void;
//   user: User | null;
// }) {
//   return (
//     <Popover
//       open={Boolean(anchorEl)}
//       anchorEl={anchorEl}
//       onClose={onClose}
//       anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
//       transformOrigin={{ vertical: "top", horizontal: "left" }}
//     >
//       <Box p={2} width={240}>
//         <Box display="flex" alignItems="center" gap={2} mb={2}>
//           <Avatar src={user?.avatar} sx={{ width: 48, height: 48 }} />
//           <Box>
//             <Typography variant="subtitle1">{user?.name}</Typography>
//             <Typography variant="caption" color="text.secondary">
//               {user?.isActive ? "Online" : "Offline"}
//             </Typography>
//           </Box>
//         </Box>
//         <Typography variant="body2" color="text.secondary">
//           You can show last seen, about info, and more here.
//         </Typography>
//       </Box>
//     </Popover>
//   );
// }
