import { Dialog, DialogTitle, DialogContent, Box, Typography, IconButton, useMediaQuery } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { MediaInput, SubmitPostButton, TextInput, TitleInput } from "@/components/post/PostInputs";
import { closeEditPost, resetEditPost } from "@/redux/slices/editPostSlice";
import type { AppDispatch, RootState } from "@/redux/store";
import type { CreateMedia, EditMedia } from "@/types/post.js";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEditPostMutation } from "@/services/mutations/post.mutations.ts";
import { revokeURLs } from "@/utils/media";

export default function EditPostDialog() {
  const dispatch = useDispatch<AppDispatch>();
  const { isOpen, post, uploadProgress } = useSelector((state: RootState) => state.editPost);

  const { mutateAsync: editPost, isPending } = useEditPostMutation();

  const [postId, setPostId] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<(CreateMedia | EditMedia)[]>([]);

  const filesRef = useRef(files);

  const isMobile = useMediaQuery(theme => theme.breakpoints.down("sm"));

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    setPostId(post._id);
    setTitle(post.title ?? "");
    setText(post.text ?? "");

    setFiles(post.media.map(fileContainer => ({ ...fileContainer, isNew: false, id: crypto.randomUUID() })));

    return () => {
      filesRef.current.forEach(fileContainer => fileContainer.isNew && revokeURLs(fileContainer));
      setFiles([]);
    };
  }, [post]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const newTitle = title.trim() || null;
      const newText = text.trim() || null;

      if (!newTitle && !newText && !files.length) {
        throw new Error("Post can't be empty");
      }

      const formData = new FormData();
      formData.append("post", JSON.stringify({ title: newTitle, text: newText }));

      const fileMeta: { type: "file" | "url"; value: string }[] = [];
      files.forEach((fileContainer, index) => {
        if (fileContainer.isNew) {
          formData.append("files", fileContainer.file);
          fileMeta.push({ type: "file", value: String(index) });
        } else {
          fileMeta.push({ type: "url", value: fileContainer.originalUrl });
        }
      });
      formData.append("fileMeta", JSON.stringify(fileMeta));

      await editPost({ formData, post: { _id: postId, title: newTitle, text: newText } });

      dispatch(closeEditPost());
    } catch {}
  }

  return (
    <Dialog
      open={isOpen}
      onClose={() => dispatch(closeEditPost())}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      slotProps={{ transition: { onExited: () => dispatch(resetEditPost()) } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, height: 60 }}>
        <Box />
        <Typography sx={{ fontWeight: 500, fontSize: 20 }} textAlign="center">
          Edit Post
        </Typography>
        <IconButton onClick={() => dispatch(closeEditPost())}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column" }}>
          <TitleInput title={title} disabled={isPending} onChange={newTitle => setTitle(newTitle)} />
          <TextInput text={text} disabled={isPending} onChange={newText => setText(newText)} />
          <br />
          <MediaInput disabled={isPending} files={files} setFiles={setFiles} />
          <SubmitPostButton
            isPending={isPending}
            showProgress={!!files.length}
            uploadProgress={uploadProgress}
            submitButtonText="Submit"
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
