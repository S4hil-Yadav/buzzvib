// import LoadingOrError from "@/components/elements/LoadingOrError.tsx";
// import chatDb from "@/lib/chatDb.ts";
// import { useGetChatroomsQuery } from "@/services/queries/chat.queries.ts";
// import { Avatar, Badge, Box, List, ListItem, ListItemAvatar, ListItemText, TextField, Typography } from "@mui/material";
// import { useRef, useEffect } from "react";
// import { NavLink } from "react-router-dom";

// export default function ChatSidebar() {
//   const {
//     data: chatrooms,
//     isLoading,
//     isError,
//     isFetching,
//     refetch,
//     hasNextPage,
//     isFetchingNextPage,
//     fetchNextPage,
//   } = useGetChatroomsQuery();

//   const loaderRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       entries => {
//         if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && fetchNextPage) {
//           fetchNextPage();
//         }
//       },
//       { threshold: 1 }
//     );

//     const currentLoader = loaderRef.current;
//     if (currentLoader) {
//       observer.observe(currentLoader);
//     }

//     return () => {
//       if (currentLoader) {
//         observer.unobserve(currentLoader);
//       }
//     };
//   }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

//   if (isLoading || isError || !chatrooms) {
//     return (
//       <Box sx={{ my: 5, width: "100%" }}>
//         <LoadingOrError
//           isLoading={isLoading}
//           isError={isError}
//           // LoadingComponent={<PostSkeleton count={Math.min(3, postCount ?? 3)} />}
//           errorMessage="Failed to fetch chats"
//           isFetching={isFetching}
//           refetch={refetch}
//         />
//       </Box>
//     );
//   }

//   return (
//     <Box width={300} borderRight="1px solid #e0e0e0" overflow="auto" bgcolor="background.paper">
//       <Box p={2} borderBottom="1px solid #e0e0e0">
//         <Typography variant="h6" gutterBottom>
//           Chats
//         </Typography>
//         <TextField fullWidth placeholder="Search..." size="small" variant="outlined" />
//       </Box>

//       <List>
//         {chatrooms.map(async chatroom => {
//           const user = chatroom.type === "private" ? await chatDb.users.get(chatroom.user) : null;
//           return (
//             <ListItem key={chatroom._id} disablePadding>
//               <NavLink
//                 to={`/chat/${chatroom._id}`}
//                 style={({ isActive }) => ({
//                   textDecoration: "none",
//                   color: isActive ? "#7C3AED" : "#6B7280",
//                   fontWeight: isActive ? 700 : 600,
//                   backgroundColor: isActive ? "#F3E8FF" : "transparent",
//                   borderRadius: "12px",
//                   display: "block",
//                   width: "100%",
//                 })}
//               >
//                 <ListItemAvatar>
//                   <Badge
//                     color="success"
//                     variant="dot"
//                     // invisible={!user.isActive}
//                     overlap="circular"
//                     anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
//                   >
//                     <Avatar src={user?.profilePicture} />
//                   </Badge>
//                 </ListItemAvatar>
//                 <ListItemText
//                   primary={<Typography fontWeight={600}>{chatroom.nickname ?? user?.fullname}</Typography>}
//                   secondary={chatroom.lastMessage?.text}
//                 />
//                 {/* {user?.unread > 0 && <Badge color="primary" badgeContent={user.unread} />} */}
//               </NavLink>
//             </ListItem>
//           );
//         })}
//       </List>
//     </Box>
//   );
// }
