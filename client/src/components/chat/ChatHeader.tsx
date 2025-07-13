// import { Avatar, Badge, Box, Typography } from "@mui/material";

// interface User {
//   id: string;
//   name: string;
//   avatar: string;
//   lastMessage: string;
//   unread: number;
//   isActive: boolean;
// }

// export default function ChatHeader({
//   activeUser,
//   onHeaderClick,
// }: {
//   activeUser: User;
//   onHeaderClick: (e: React.MouseEvent<HTMLElement>) => void;
// }) {
//   return (
//     <Box
//       display="flex"
//       alignItems="center"
//       px={2}
//       py={1}
//       borderBottom="1px solid #e0e0e0"
//       onClick={onHeaderClick}
//       sx={{ cursor: "pointer" }}
//     >
//       <Badge
//         color={activeUser.isActive ? "success" : "default"}
//         variant="dot"
//         overlap="circular"
//         anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
//       >
//         <Avatar src={activeUser.avatar} />
//       </Badge>
//       <Box ml={2}>
//         <Typography variant="subtitle1" fontWeight={600}>
//           {activeUser.name}
//         </Typography>
//         <Typography variant="caption" color="text.secondary">
//           {activeUser.isActive ? "Online" : "Offline"}
//         </Typography>
//       </Box>
//     </Box>
//   );
// }
