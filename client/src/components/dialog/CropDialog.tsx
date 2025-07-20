import type { CreateMedia, EditMedia } from "@/types";
import { getCroppedImage } from "@/utils/media";
import { Dialog, Box, Button } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import ReactCrop, { type Crop } from "react-image-crop";

interface CropDialogProps {
  open: boolean;
  onClose: () => void;
  fileContainer: CreateMedia | EditMedia | null;
  onCropDone: (newUrl: string, crop: Crop, newFile: File) => void;
  square?: boolean;
}

export default function CropDialog({ open, onClose, fileContainer, onCropDone, square = false }: CropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement | null>(null);

  function centerSquareCrop(width: number, height: number): Crop {
    const size = Math.min(width, height);
    return {
      unit: "px",
      width: size,
      height: size,
      x: (width - size) / 2,
      y: (height - size) / 2,
    };
  }

  useEffect(() => {
    if (fileContainer?.isNew && fileContainer?.cropData && imgRef.current) {
      setCrop(fileContainer.cropData);
    }
  }, [fileContainer]);

  function onImageLoaded(e: React.SyntheticEvent<HTMLImageElement>) {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;

    if (fileContainer?.isNew && fileContainer?.cropData) {
      setCrop(fileContainer.cropData);
    } else if (square && width && height) {
      setCrop(centerSquareCrop(width, height));
    }
  }

  async function handleSave() {
    if (!imgRef.current || !crop?.width || !crop?.height || !fileContainer) return;

    const { blob, url } = await getCroppedImage(imgRef.current, crop);
    const newFile = new File([blob], fileContainer.isNew ? fileContainer.file.name : `${crypto.randomUUID()}.jpg`, {
      type: "image/jpeg",
    });

    onCropDone(url, crop, newFile);
    onClose();
  }

  if (!fileContainer) return null;

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <ReactCrop crop={crop} onChange={c => setCrop(c)} keepSelection aspect={square ? 1 : undefined} circularCrop={square}>
          <img
            src={fileContainer.originalUrl}
            alt="Crop"
            onLoad={onImageLoaded}
            crossOrigin="anonymous"
            style={{ width: "auto", maxWidth: "100vw", height: "auto", maxHeight: "80vh", objectFit: "contain" }}
          />
        </ReactCrop>
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
