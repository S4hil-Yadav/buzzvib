import { useEffect, useRef, useState } from "react";
import type { Post } from "@/types";
import TextWithExpand from "@/components/elements/TextWithExpand";
import { Box, Typography, IconButton } from "@mui/material";
import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import BigCarousel from "./BigCarousel";
import VideoPlayer from "@/components/elements/VideoPlayer";

export default function PostBody({ post }: { post: Post }) {
  const [openBigCarousel, setOpenBigCarousel] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || targetIndex === null) return;

    const width = container.offsetWidth;
    container.scrollTo({ left: width * targetIndex, behavior: "smooth" });

    setTargetIndex(null);
  }, [targetIndex]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const newIndex = Math.round(container.scrollLeft / container.offsetWidth);
      setCurrentIndex(newIndex);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Box display="flex" flexDirection="column" width="100%">
      {post.deletedAt ? (
        "[deleted post]"
      ) : (
        <Box display="flex" flexDirection="column" gap={1} pb={2} textAlign="justify">
          <Typography variant="h6" fontWeight="bold">
            {post.title}
          </Typography>
          <TextWithExpand originalText={post.text} minHeight={4.5} />
        </Box>
      )}
      <Box position="relative" width="100%" overflow="hidden">
        {post.media.length > 0 && (
          <Box
            ref={scrollRef}
            display="flex"
            width="100%"
            sx={{
              // boxShadow: 3,
              border: "2px solid",
              borderColor: "divider",
              borderRadius: 3,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none", // Firefox
              "&::-webkit-scrollbar": { display: "none" }, // Chrome, Safari
            }}
          >
            {post.media.map((item, idx) => (
              <Box
                key={idx}
                flex="0 0 100%"
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{ scrollSnapAlign: "center" }}
              >
                {item.type === "image" ? (
                  <Box
                    component="img"
                    src={item.displayUrl}
                    alt={item.type}
                    loading="lazy"
                    sx={{
                      width: "100%",
                      maxHeight: 350,
                      objectFit: "cover",
                      borderRadius: 2,
                      borderLeft: "2px solid",
                      borderRight: "2px solid",
                      borderColor: "divider",
                    }}
                    onClick={() => setOpenBigCarousel(true)}
                  />
                ) : item.type === "video" ? (
                  <VideoPlayer
                    thumbnail={item.displayUrl}
                    src={item.originalUrl}
                    isCurrentIndex={currentIndex === idx}
                    onClick={() => setOpenBigCarousel(true)}
                    showControls={currentIndex === idx}
                  />
                ) : null}
              </Box>
            ))}
          </Box>
        )}

        {post.media.length > 1 && (
          <>
            <IconButton
              onClick={() => setTargetIndex(currentIndex > 0 ? currentIndex - 1 : post.media.length - 1)}
              sx={{
                position: "absolute",
                top: "50%",
                left: 10,
                transform: "translateY(-50%)",
                bgcolor: "background.paper",
              }}
              size="small"
            >
              <ArrowBackIosNew fontSize="small" />
            </IconButton>

            <IconButton
              onClick={() => setTargetIndex((currentIndex + 1) % post.media.length)}
              sx={{
                position: "absolute",
                top: "50%",
                right: 10,
                transform: "translateY(-50%)",
                bgcolor: "background.paper",
              }}
              size="small"
            >
              <ArrowForwardIos fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
      <BigCarousel
        open={openBigCarousel}
        onClose={() => setOpenBigCarousel(false)}
        media={post.media}
        initialIndex={currentIndex}
      />
    </Box>
  );
}
