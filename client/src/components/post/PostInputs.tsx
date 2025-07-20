import BigCarousel from "@/components/post/BigCarousel.tsx";
import type { CreateMedia, EditMedia } from "@/types";
import { generateVideoThumbnail, revokeURLs } from "@/utils/";
import { Box, Paper, TextareaAutosize, Typography, IconButton, Button, CircularProgress } from "@mui/material";
import {
  VideoLibraryOutlined as VideoLibraryOutlinedIcon,
  CloseOutlined as CloseIcon,
  CropOutlined as CropIcon,
} from "@mui/icons-material";
import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import CropDialog from "@/components/dialog/CropDialog";
import { ReactSortable } from "react-sortablejs";
import "react-image-crop/dist/ReactCrop.css";

interface TitleInputProps {
  title: string;
  disabled: boolean;
  onChange: (title: string) => void;
}

export function TitleInput({ title, disabled, onChange }: TitleInputProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Paper
        variant="outlined"
        sx={{
          border: "2px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
          "&:hover": { borderColor: "primary.light" },
          "&:focus-within": { borderColor: "primary.main" },
        }}
      >
        <TextareaAutosize
          placeholder="Enter the title"
          value={title}
          disabled={disabled}
          maxLength={300}
          onChange={e => onChange(e.target.value.replace(/[\r\n]+/g, " "))}
          onKeyDown={e => e.key === "Enter" && e.preventDefault()}
          style={{
            width: "100%",
            resize: "none",
            padding: 12,
            fontSize: "1.1rem",
            fontWeight: 500,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "inherit",
            fontFamily: "inherit",
          }}
        />
      </Paper>
      <Typography variant="caption" align="right" color="text.secondary">
        {title.length}/300
      </Typography>
    </Box>
  );
}

interface TextInputProps {
  text: string;
  disabled: boolean;
  onChange: (text: string) => void;
}

export function TextInput({ text, disabled, onChange }: TextInputProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        border: "2px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        "&:hover": { borderColor: "primary.light" },
        "&:focus-within": { borderColor: "primary.main" },
      }}
    >
      <TextareaAutosize
        placeholder="Write your thoughts..."
        value={text}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        minRows={4}
        style={{
          width: "100%",
          resize: "none",
          padding: 12,
          fontSize: "1rem",
          fontWeight: 400,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "inherit",
          fontFamily: "inherit",
        }}
      />
    </Paper>
  );
}

interface MediaInputProps {
  disabled: boolean;
  files: (CreateMedia | EditMedia)[];
  setFiles: React.Dispatch<React.SetStateAction<(CreateMedia | EditMedia)[]>>;
}

export function MediaInput({ disabled, files, setFiles }: MediaInputProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [openBigCarousel, setOpenBigCarousel] = useState(false);
  const [fileIdx, setFileIdx] = useState(0);
  const [openCropDialog, setOpenCropDialog] = useState(false);
  const [cropFileIdx, setCropFileIdx] = useState<number | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  function handleMediaInput(e: React.ChangeEvent<HTMLInputElement>) {
    const inputFiles = e.target.files;
    if (!inputFiles) return;

    for (const file of inputFiles) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFiles(prev => [
          ...prev,
          { isNew: true, id: crypto.randomUUID(), file, url: URL.createObjectURL(file), originalUrl: URL.createObjectURL(file) },
        ]);
      } else {
        toast.error(`Invalid file type ${file.type}`);
      }
    }

    e.target.value = "";
  }

  useEffect(() => {
    async function generateThumbnails() {
      for (const fileContainer of files) {
        if (fileContainer.isNew && fileContainer.file.type.startsWith("video/") && !thumbnails[fileContainer.id]) {
          setThumbnails(prev => ({ ...prev, [fileContainer.id]: "loading" }));
          await generateVideoThumbnail(fileContainer.file)
            .then(url => setThumbnails(prev => ({ ...prev, [fileContainer.id]: url })))
            .catch(() => setThumbnails(prev => ({ ...prev, [fileContainer.id]: fileContainer.url })));
        }
      }
    }

    generateThumbnails();
  }, [files, thumbnails]);

  function getDisplayUrl(fileContainer: CreateMedia | EditMedia): string {
    if (!fileContainer.isNew) {
      return fileContainer.displayUrl;
    }

    if (fileContainer.file.type.startsWith("image/")) {
      return fileContainer.url;
    }

    if (fileContainer.file.type.startsWith("video/")) {
      return thumbnails[fileContainer.id] || fileContainer.url;
    }

    return fileContainer.url;
  }

  function isStaticImage(fileContainer: CreateMedia | EditMedia) {
    return fileContainer.isNew
      ? fileContainer.file.type.startsWith("image/") && fileContainer.file.type !== "image/gif"
      : fileContainer.type === "image";
  }

  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <ReactSortable list={files} setList={setFiles} style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {files.map((fileContainer, i) => (
          <Box
            key={fileContainer.id}
            sx={{
              width: 120,
              height: 160,
              position: "relative",
              overflow: "hidden",
              border: "2px solid",
              borderRadius: 3,
              borderColor: "divider",
              boxShadow: 3,
              bgcolor: "background.paper",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "scale(1.03)" },
              // backgroundColor: "black",
            }}
          >
            <Box
              onClick={() => {
                setFileIdx(i);
                setOpenBigCarousel(true);
              }}
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: 2,
                cursor: "pointer",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {(() => {
                const isVideoLoading =
                  fileContainer.isNew &&
                  fileContainer.file.type.startsWith("video/") &&
                  thumbnails[fileContainer.id] === "loading";

                return isVideoLoading ? (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "background.paper",
                      borderRadius: "10px",
                    }}
                  >
                    <CircularProgress size={40} />
                  </Box>
                ) : (
                  <img
                    src={getDisplayUrl(fileContainer)}
                    alt={`upload-${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                  />
                );
              })()}
            </Box>

            {isStaticImage(fileContainer) && (
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  setCropFileIdx(i);
                  setOpenCropDialog(true);
                }}
                sx={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  bgcolor: "background.paper",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <CropIcon fontSize="small" />
              </IconButton>
            )}

            {!disabled && (
              <IconButton
                size="small"
                onClick={() => {
                  if (fileContainer.isNew) revokeURLs(fileContainer);
                  setFiles(prev => prev.filter((_f, idx) => i !== idx));
                  videoRefs.current.forEach(ref => ref?.load());
                }}
                sx={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  bgcolor: "background.paper",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
      </ReactSortable>

      <Box component="label">
        <Box
          sx={{
            width: 120,
            height: 160,
            border: "2px dashed",
            borderColor: "primary.light",
            bgcolor: "action.hover",
            borderRadius: 3,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            "&:hover": {
              bgcolor: "action.selected",
              transform: "scale(1.03)",
            },
          }}
        >
          <VideoLibraryOutlinedIcon fontSize="large" />
          <Typography variant="caption" fontWeight={600} textAlign="center">
            Add Media
          </Typography>
        </Box>
        <input type="file" multiple accept="image/*,video/*" onInput={handleMediaInput} disabled={disabled} hidden />
      </Box>
      {files.length > 0 && (
        <BigCarousel
          open={openBigCarousel}
          onClose={() => setOpenBigCarousel(false)}
          media={files.map((f, i) =>
            f.isNew
              ? {
                  originalUrl: f.url,
                  displayUrl: thumbnails[i] ?? f.url,
                  type: f.file.type.startsWith("image/") ? "image" : "video",
                }
              : f
          )}
          initialIndex={fileIdx}
        />
      )}
      <CropDialog
        open={openCropDialog}
        onClose={() => setOpenCropDialog(false)}
        fileContainer={cropFileIdx !== null ? files[cropFileIdx] : null}
        onCropDone={(newUrl, newCrop, newFile) => {
          if (cropFileIdx === null) return;
          setFiles(prev => {
            const newFiles = [...prev];
            const oldFile = newFiles[cropFileIdx];
            if (oldFile.isNew) URL.revokeObjectURL(oldFile.url);
            newFiles[cropFileIdx] = {
              ...oldFile,
              isNew: true,
              originalUrl: oldFile.originalUrl,
              url: newUrl,
              cropData: newCrop,
              file: newFile,
            };
            return newFiles;
          });
        }}
      />
    </Box>
  );
}

interface SubmitPostButtonProps {
  isPending: boolean;
  showProgress: boolean;
  uploadProgress: number;
  submitButtonText?: string;
  onClick?: () => void;
}
export function SubmitPostButton({
  isPending,
  showProgress,
  uploadProgress,
  submitButtonText = "Post",
  onClick,
}: SubmitPostButtonProps) {
  return (
    <Button
      type="submit"
      variant="contained"
      onClick={onClick}
      disabled={isPending}
      size="large"
      sx={{
        mt: 3,
        alignSelf: "center",
        borderRadius: 3,
        fontWeight: 600,
        textTransform: "capitalize",
        fontSize: "1rem",
        px: 4,
        py: 1,
        bgcolor: "primary.main",
        ":hover": { bgcolor: "primary.dark" },
      }}
    >
      {isPending ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          Processing...
          {showProgress && (
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress variant="determinate" value={uploadProgress} />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="caption" component="div" color="text.secondary">
                  {`${Math.round(uploadProgress)}%`}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        submitButtonText
      )}
    </Button>
  );
}
