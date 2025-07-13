import { useCreatePostMutation } from "@/services/mutations/post.mutations";
import { useDispatch, useSelector } from "react-redux";
import { setDraft } from "@/redux/slices/postDraftSlice";
import BigCarousel from "@/components/post/BigCarousel";
import { useEffect, useRef, useState } from "react";
import { RootState } from "@/redux/store";
import {
  Box,
  Button,
  Typography,
  TextareaAutosize,
  IconButton,
  CircularProgress,
  Paper,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import type { CreateMedia, PostDraft } from "@/types";
import { VideoLibraryOutlined as VideoLibraryOutlinedIcon } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { ReactSortable } from "react-sortablejs";

export default function CreatePostPage() {
  const theme = useTheme();
  const isBelowLarge = useMediaQuery(theme.breakpoints.down("lg"));

  const { postDraft, uploading, uploadProgress } = useSelector((state: RootState) => state.postDraft);
  const [files, setFiles] = useState<CreateMedia[]>([]);
  const { mutateAsync: createPost } = useCreatePostMutation();

  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(
    () => () => {
      filesRef.current.forEach(file => URL.revokeObjectURL(file.url));
    },
    []
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const title = postDraft.title.trim();
      const text = postDraft.text.trim();

      if (!title && !text && !files.length) {
        throw new Error("Post can't be empty");
      }

      const formData = new FormData();
      formData.append("post", JSON.stringify({ title, text }));
      files.forEach(fileContainer => formData.append("files", fileContainer.file));
      await createPost({ formData });
      setTimeout(() => {
        files.forEach(fileContainer => URL.revokeObjectURL(fileContainer.url));
        setFiles([]);
      }, 500);
    } catch {}
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: isBelowLarge ? 0 : 4,
        px: isBelowLarge ? 0 : 4,
        // bgcolor: "background.default",
      }}
    >
      <Paper
        elevation={isBelowLarge ? 0 : 4}
        sx={{
          width: "100%",
          maxWidth: isBelowLarge ? "100%" : 700,
          p: 4,
          borderRadius: isBelowLarge ? 0 : 4,
          bgcolor: theme => (theme.palette.mode === "dark" ? theme.palette.background.default : theme.palette.background.paper),
        }}
      >
        <Typography variant="h4" fontWeight="bold" textAlign="center" color="primary.dark" mb={4}>
          Create Post
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <TitleInput postDraft={postDraft} disabled={uploading} />
          <BodyInput postDraft={postDraft} disabled={uploading} />
          <MediaInput disabled={uploading} files={files} setFiles={setFiles} />
          <Button
            type="submit"
            variant="contained"
            disabled={uploading}
            size="large"
            sx={{
              mt: 3,
              alignSelf: "center",
              borderRadius: 3,
              fontWeight: 600,
              textTransform: "capitalize",
              fontSize: "1.3rem",
              px: 5,
              py: 1,
              bgcolor: "primary.main",
              ":hover": { bgcolor: "primary.dark" },
            }}
          >
            {uploading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Processing...
                {!!files.length && (
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
              "Post"
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

interface TitleInputProps {
  postDraft: PostDraft;
  disabled: boolean;
}

function TitleInput({ postDraft, disabled }: TitleInputProps) {
  const dispatch = useDispatch();

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
          value={postDraft.title}
          disabled={disabled}
          maxLength={300}
          onChange={e =>
            dispatch(
              setDraft({
                ...postDraft,
                title: e.target.value.replace(/[\r\n]+/g, " "),
              })
            )
          }
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
        {postDraft.title.length}/300
      </Typography>
    </Box>
  );
}

interface BodyInputProps {
  postDraft: PostDraft;
  disabled: boolean;
}

function BodyInput({ postDraft, disabled }: BodyInputProps) {
  const dispatch = useDispatch();

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
        value={postDraft.text}
        disabled={disabled}
        onChange={e => dispatch(setDraft({ ...postDraft, text: e.target.value }))}
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
  files: CreateMedia[];
  setFiles: React.Dispatch<React.SetStateAction<CreateMedia[]>>;
}

// function MediaInput({ disabled, files, setFiles }: MediaInputProps) {
//   const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
//   const [openBigCarousel, setOpenBigCarousel] = useState(false);
//   const [fileIdx, setFileIdx] = useState(0);

//   const handleMediaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const inputFiles = e.target.files;
//     if (!inputFiles) return;

//     for (const file of inputFiles) {
//       if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
//         setFiles(prev => [...prev, { file, url: URL.createObjectURL(file) }]);
//       }
//     }

//     e.target.value = "";
//   };

//   return (
//     <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
//       {files.map((fileContainer, i) => (
//         <Box
//           key={i}
//           sx={{
//             width: 120,
//             height: 160,
//             position: "relative",
//             overflow: "hidden",
//             borderRadius: 3,
//             boxShadow: 3,
//             border: "2px solid",
//             borderColor: "divider",
//             bgcolor: "background.paper",
//             transition: "transform 0.2s ease",
//             "&:hover": { transform: "scale(1.03)" },
//           }}
//         >
//           <Box
//             onClick={() => {
//               setFileIdx(i);
//               setOpenBigCarousel(true);
//             }}
//             sx={{
//               width: "100%",
//               height: "100%",
//               borderRadius: 2,
//               cursor: "pointer",
//               overflow: "hidden",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             {fileContainer.file.type.startsWith("image/") ? (
//               <img
//                 src={fileContainer.url}
//                 alt={`upload-${i}`}
//                 style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
//               />
//             ) : (
//               <video
//                 ref={el => {
//                   videoRefs.current[i] = el;
//                 }}
//                 style={{ width: "100%", height: "100%", borderRadius: "10px", objectFit: "cover" }}
//               >
//                 <source src={fileContainer.url} type="video/mp4" />
//               </video>
//             )}
//           </Box>

//           {!disabled && (
//             <IconButton
//               size="small"
//               onClick={() => {
//                 URL.revokeObjectURL(fileContainer.url);
//                 setFiles(prev => prev.filter((_f, idx) => i !== idx));
//                 videoRefs.current.forEach(ref => ref?.load());
//               }}
//               sx={{
//                 position: "absolute",
//                 top: 6,
//                 right: 6,
//                 bgcolor: "background.paper",
//                 "&:hover": { bgcolor: "action.hover" },
//               }}
//             >
//               <CloseIcon fontSize="small" />
//             </IconButton>
//           )}
//         </Box>
//       ))}

//       <Box component="label">
//         <Box
//           sx={{
//             width: 120,
//             height: 160,
//             border: "2px dashed",
//             borderColor: "primary.light",
//             bgcolor: "action.hover",
//             borderRadius: 3,
//             cursor: "pointer",
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             justifyContent: "center",
//             transition: "all 0.3s ease",
//             "&:hover": {
//               bgcolor: "action.selected",
//               transform: "scale(1.03)",
//             },
//           }}
//         >
//           <VideoLibraryOutlinedIcon fontSize="large" />
//           <Typography variant="caption" fontWeight={600} textAlign="center">
//             Add Media
//           </Typography>
//         </Box>
//         <input type="file" multiple accept="image/*,video/*" onInput={handleMediaInput} disabled={disabled} hidden />
//       </Box>

//       {files.length > 0 && (
//         <BigCarousel
//           open={openBigCarousel}
//           onClose={() => setOpenBigCarousel(false)}
//           media={files.map(f => ({
//             url: f.url,
//             type: f.file.type.startsWith("image/") ? "image" : "video",
//           }))}
//           initialIndex={fileIdx}
//         />
//       )}
//     </Box>
//   );
// }
function MediaInput({ disabled, files, setFiles }: MediaInputProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [openBigCarousel, setOpenBigCarousel] = useState(false);
  const [fileIdx, setFileIdx] = useState(0);

  const handleMediaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles) return;

    for (const file of inputFiles) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFiles(prev => [...prev, { id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }]);
      }
    }

    e.target.value = "";
  };

  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <ReactSortable list={files} setList={setFiles} style={{ display: "flex", gap: 16 }}>
        {files.map((fileContainer, i) => (
          <Box
            key={fileContainer.id}
            sx={{
              width: 120,
              height: 160,
              position: "relative",
              overflow: "hidden",
              borderRadius: 3,
              boxShadow: 3,
              border: "2px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "scale(1.03)" },
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
              {fileContainer.file.type.startsWith("image/") ? (
                <img
                  src={fileContainer.url}
                  alt={`upload-${i}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                />
              ) : (
                <video
                  ref={el => {
                    videoRefs.current[i] = el;
                  }}
                  style={{ width: "100%", height: "100%", borderRadius: "10px", objectFit: "cover" }}
                >
                  <source src={fileContainer.url} type="video/mp4" />
                </video>
              )}
            </Box>

            {!disabled && (
              <IconButton
                size="small"
                onClick={() => {
                  URL.revokeObjectURL(fileContainer.url);
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
          media={files.map(f => ({
            url: f.url,
            type: f.file.type.startsWith("image/") ? "image" : "video",
          }))}
          initialIndex={fileIdx}
        />
      )}
    </Box>
  );
}
