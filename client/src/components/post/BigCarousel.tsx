import { Dialog, Box, IconButton, useTheme } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import type { Media } from "@/types";

interface BigCarouselProps {
  open: boolean;
  onClose: () => void;
  media: Media[];
  initialIndex: number;
}

export default function BigCarousel({ open, onClose, media, initialIndex }: BigCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      slotProps={{
        paper: {
          sx: {
            bgcolor: "background.default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 20,
          right: 20,
          bgcolor: "background.paper",
          // border: "2px solid",
          "&:hover": { bgcolor: "grey.100" },
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      {media.length > 1 && (
        <>
          <IconButton
            onClick={() => setIndex(prev => (prev ? prev - 1 : media.length - 1))}
            sx={{
              position: "absolute",
              left: 20,
              color: theme.palette.text.primary,
              bgcolor: "background.paper",
              // border: "2px solid",
              "&:hover": { bgcolor: "grey.100" },
              zIndex: 1,
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>

          <IconButton
            onClick={() => setIndex(prev => (prev + 1) % media.length)}
            sx={{
              position: "absolute",
              right: 20,
              color: theme.palette.text.primary,
              bgcolor: "background.paper",
              // border: "2px solid",
              "&:hover": { bgcolor: "grey.100" },
              zIndex: 1,
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </>
      )}

      <Box
        sx={{
          maxWidth: "90%",
          maxHeight: "90%",
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!media[index] ? (
          "invalid image"
        ) : media[index].type === "image" ? (
          <img
            src={media[index].url}
            alt="carousel-media"
            style={{ width: "100%", height: "auto", maxHeight: "90vh", objectFit: "contain" }}
          />
        ) : media[index].type === "video" ? (
          <video
            src={media[index].url}
            controls
            style={{ width: "100%", height: "auto", maxHeight: "90vh", objectFit: "contain" }}
          />
        ) : null}
      </Box>
    </Dialog>
  );
}
