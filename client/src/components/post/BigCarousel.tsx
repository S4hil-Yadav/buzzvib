import { Dialog, Box, IconButton } from "@mui/material";
import { ArrowBackIosNew as PrevIcon, ArrowForwardIos as NextIcon, Close as CloseIcon } from "@mui/icons-material";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Media } from "@/types";
import VideoPlayer from "@/components/elements/VideoPlayer";

interface BigCarouselProps {
  open: boolean;
  onClose: () => void;
  media: Media[];
  initialIndex: number;
}

export default function BigCarousel({ open, onClose, media, initialIndex }: BigCarouselProps) {
  const [index, setIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>(null);

  const scrollRef = useCallback((node: HTMLDivElement | null) => setScrollContainer(node), []);

  useEffect(() => {
    setIndex(initialIndex);
    setTargetIndex(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    if (!scrollContainer || targetIndex === null) return;

    const width = scrollContainer.offsetWidth;
    scrollContainer.scrollTo({ left: width * targetIndex, behavior: index === targetIndex ? "instant" : "smooth" });

    setIndex(targetIndex);
    setTargetIndex(null);
  }, [index, targetIndex, scrollContainer]);

  useEffect(() => {
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      scrollTimeoutRef.current = setTimeout(() => {
        const newIndex = Math.round(scrollContainer.scrollLeft / scrollContainer.offsetWidth);
        setIndex(newIndex);
      }, 100);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [scrollContainer]);

  function handlePrevious() {
    const newIndex = index > 0 ? index - 1 : media.length - 1;
    setTargetIndex(newIndex);
  }

  function handleNext() {
    const newIndex = (index + 1) % media.length;
    setTargetIndex(newIndex);
  }

  const bgcolor = media[index]?.type === "video" ? "#282A36" : "background.paper";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      slotProps={{ paper: { sx: { bgcolor: "background.default", py: 0, overflow: "clip" } } }}
      sx={{ width: "100vw", height: "100vh", display: "flex" }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 20,
          right: 20,
          bgcolor,
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      {media.length > 1 && (
        <>
          <IconButton
            onClick={handlePrevious}
            disabled={index === 0}
            sx={{
              position: "absolute",
              left: 20,
              top: "50%",
              transform: "translateY(-50%)",
              color: "text.primary",
              bgcolor,
              zIndex: 1,
            }}
          >
            <PrevIcon />
          </IconButton>

          <IconButton
            onClick={handleNext}
            disabled={index === media.length - 1}
            sx={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              color: "text.primary",
              bgcolor,
              zIndex: 1,
            }}
          >
            <NextIcon />
          </IconButton>
        </>
      )}

      <Box
        ref={scrollRef}
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none", // Firefox
          "&::-webkit-scrollbar": { display: "none" }, // Chrome, Safari
        }}
      >
        {media.map((item, idx) => (
          <Box
            key={idx}
            flex="0 0 100%"
            sx={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              scrollSnapAlign: "center",
            }}
          >
            {item.type === "image" ? (
              <img
                src={item.originalUrl}
                alt="carousel-media"
                style={{ width: "100vw", height: "auto", maxHeight: "100vh", objectFit: "contain" }}
              />
            ) : item.type === "video" ? (
              <VideoPlayer
                src={item.originalUrl}
                autoPlay={index === idx}
                fullViewport={true}
                showControls={true}
                thumbnail={item.displayUrl}
              />
            ) : null}
          </Box>
        ))}
      </Box>
    </Dialog>
  );
}
