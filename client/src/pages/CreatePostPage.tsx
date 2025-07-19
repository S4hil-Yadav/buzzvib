import { useCreatePostMutation } from "@/services/mutations/post.mutations";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import type { RootState, AppDispatch } from "@/redux/store";
import { Box, Typography, Paper, useMediaQuery } from "@mui/material";
import type { CreateMedia, EditMedia } from "@/types";
import { revokeURLs } from "@/utils";
import { TitleInput, TextInput, MediaInput, SubmitPostButton } from "@/components/post/PostInputs";
import { setPostDraft } from "@/redux/slices/postDraftSlice.ts";
import toast from "react-hot-toast";
import axios from "axios";

export default function CreatePostPage() {
  const dispatch = useDispatch<AppDispatch>();
  const isBelowLarge = useMediaQuery(theme => theme.breakpoints.down("lg"));

  const { postDraft, uploadProgress } = useSelector((state: RootState) => state.postDraft);
  const [files, setFiles] = useState<(CreateMedia | EditMedia)[]>([]);
  const { mutateAsync: createPost, isPending } = useCreatePostMutation();

  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(
    () => () => {
      filesRef.current.forEach(fileContainer => fileContainer.isNew && revokeURLs(fileContainer));
    },
    []
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const title = postDraft.title.trim() || null;
      const text = postDraft.text.trim() || null;

      if (!title && !text && !files.length) {
        throw new Error("Post can't be empty");
      }

      const formData = new FormData();
      formData.append("post", JSON.stringify({ title, text }));
      files.forEach(fileContainer => fileContainer.isNew && formData.append("files", fileContainer.file));
      await createPost({ formData, post: { title, text } });
      setTimeout(() => {
        files.forEach(fileContainer => fileContainer.isNew && revokeURLs(fileContainer));
        setFiles([]);
      }, 500);
    } catch (error) {
      if (!axios.isAxiosError(error) && error instanceof Error) toast.error(error.message);
    }
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
          <TitleInput title={postDraft.title} disabled={isPending} onChange={title => dispatch(setPostDraft({ title }))} />
          <TextInput text={postDraft.text} disabled={isPending} onChange={text => dispatch(setPostDraft({ text }))} />
          <MediaInput disabled={isPending} files={files} setFiles={setFiles} />
          <SubmitPostButton isPending={isPending} showProgress={!!files.length} uploadProgress={uploadProgress} />
        </Box>
      </Paper>
    </Box>
  );
}
