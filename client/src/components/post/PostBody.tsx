import { useEffect, useRef, useState } from "react";
import type { Post } from "@/types";
import TextWithExpand from "@/components/elements/TextWithExpand";
import { Box, Typography, IconButton } from "@mui/material";
import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import BigCarousel from "./BigCarousel";

interface PostBodyProps {
  post: Post;
}

export default function PostBody({ post }: PostBodyProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [openBigCarousel, setOpenBigCarousel] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || targetIndex === null) return;

    const width = container.offsetWidth;
    container.scrollTo({
      left: width * targetIndex,
      behavior: "smooth",
    });

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

  useEffect(() => {
    const videos = videoRefs.current;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          videos.forEach(videoRef => {
            if (videoRef && !entry.isIntersecting) {
              videoRef.pause();
            }
          });
        });
      },
      { threshold: 0.5 }
    );

    videos.forEach(videoRef => {
      if (videoRef) observer.observe(videoRef);
    });

    return () => {
      videos.forEach(videoRef => {
        if (videoRef) observer.unobserve(videoRef);
      });
    };
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
        <Box
          ref={scrollRef}
          display="flex"
          width="100%"
          sx={{
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none", // Firefox
            "&::-webkit-scrollbar": { display: "none" }, // Chrome, Safari
          }}
        >
          {post.media.map((file, idx) => (
            <Box
              key={idx}
              flex="0 0 100%"
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{
                scrollSnapAlign: "center",
              }}
            >
              {file.type === "image" ? (
                <Box
                  component="img"
                  src={file.url}
                  loading="lazy"
                  sx={{
                    width: "100%",
                    maxHeight: 350,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: "grey.300",
                  }}
                  onClick={() => setOpenBigCarousel(true)}
                />
              ) : file.type === "video" ? (
                <Box
                  component="video"
                  ref={(el: HTMLVideoElement | null) => {
                    videoRefs.current[idx] = el;
                  }}
                  src={file.url}
                  controls
                  sx={{
                    width: "100%",
                    maxHeight: 350,
                    borderRadius: 2,
                  }}
                />
              ) : null}
            </Box>
          ))}
        </Box>

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
                border: "1px solid",
                borderColor: "grey.400",
                "&:hover": { bgcolor: "grey.100" },
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
                border: "1px solid",
                borderColor: "grey.400",
                "&:hover": { bgcolor: "grey.100" },
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
