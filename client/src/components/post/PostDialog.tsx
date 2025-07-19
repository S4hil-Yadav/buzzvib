import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  useMediaQuery,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { Close as CloseIcon } from "@mui/icons-material";
import PostCard from "./PostCard";
import CommentSection from "@/components/comment/CommentSection";
import type { Comment, CommentIdPage } from "@/types";

export default function PostDialog() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { postId = "" } = useParams();

  const [tab, setTab] = useState<"post" | "comments">(location.state?.tab === "post" ? location.state.tab : "comments");

  const isAboveLarge = useMediaQuery(theme => theme.breakpoints.up("lg"));

  function handleToggleTab() {
    setTab(prev => (prev === "post" ? "comments" : "post"));
  }

  const resetCacheReplies = useCallback(
    (commentIds: Comment["_id"][]) => {
      commentIds.forEach(commentId => {
        const replyIdData = queryClient.getQueryData<InfiniteData<CommentIdPage, CommentIdPage["nextPageParam"]>>([
          "comments",
          commentId,
          "replies",
        ]);
        if (replyIdData) {
          resetCacheReplies(replyIdData.pages.flatMap(page => page.commentIds));
        }
        queryClient.removeQueries({ queryKey: ["comment", commentId, "replies"] });
      });
    },
    [queryClient]
  );

  useEffect(() => {
    queryClient.refetchQueries({ queryKey: ["post", postId] });
    return () => {
      const commentIdData = queryClient.getQueryData<InfiniteData<CommentIdPage, CommentIdPage["nextPageParam"]>>([
        "posts",
        postId,
        "comments",
      ]);
      queryClient.removeQueries({ queryKey: ["post", postId, "comments"] });
      if (commentIdData) {
        resetCacheReplies(commentIdData.pages.flatMap(page => page.commentIds));
      }
    };
  }, [postId, queryClient, resetCacheReplies]);

  const handleClose = () => {
    navigate(location.state?.backgroundLocation?.pathname || "/home");
  };

  return (
    <Dialog
      open
      fullScreen
      onClose={handleClose}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 0,
            maxWidth: "100vw",
            maxHeight: "100vh",
            bgcolor: "background.paper",
            boxShadow: 24,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          height: 60,
          borderBottom: theme => `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
        }}
      >
        <Box />

        {isAboveLarge ? (
          <Typography sx={{ fontWeight: 500, fontSize: 20 }} textAlign="center">
            Comments
          </Typography>
        ) : (
          <ToggleButtonGroup value={tab} exclusive onChange={handleToggleTab} aria-label="tab toggle">
            <ToggleButton sx={{ width: "6rem" }} value="post" aria-label="Post">
              Post
            </ToggleButton>
            <ToggleButton sx={{ width: "6rem" }} value="comments" aria-label="Comments">
              Comments
            </ToggleButton>
          </ToggleButtonGroup>
        )}

        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: { xs: 0, md: 3, lg: 1.5 },
          overflowY: "auto",
          py: 0,
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: 3,
          bgcolor: "background.default",
          scrollbarWidth: "none",
        }}
      >
        {/* PostCard Section */}
        {(isAboveLarge || tab === "post") && (
          <Box
            sx={{
              display: isAboveLarge || tab === "post" ? "block" : "none",
              flexBasis: { xs: "100%", lg: "40%" },
              py: 0.5,
              my: 2,
              borderRadius: 2,
              overflowY: "auto",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: theme => theme.palette.primary.light,
                borderRadius: "3px",
              },
            }}
          >
            <PostCard postId={postId} isDialog={true} handleToggleTab={handleToggleTab} />
          </Box>
        )}

        {/* Comments Section */}
        <Box
          sx={{
            flexBasis: { xs: "100%", lg: "60%" },
            maxWidth: { xs: "100%", lg: "60%" },
            display: isAboveLarge || tab === "comments" ? "block" : "none",
            maxHeight: "calc(100vh - 60px)",
          }}
        >
          <CommentSection postId={postId} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
