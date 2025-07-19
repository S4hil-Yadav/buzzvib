import type { Post } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EditPostState {
  isOpen: boolean;
  post: Pick<Post, "_id" | "title" | "text" | "media">;
  uploadProgress: number;
}

const initialState: EditPostState = {
  isOpen: false,
  post: { _id: "", title: "", text: "", media: [] },
  uploadProgress: 0,
};

const editPostSlice = createSlice({
  name: "editPost",
  initialState,
  reducers: {
    openEditPost: (_state, { payload }: PayloadAction<EditPostState["post"]>) => ({
      ...initialState,
      isOpen: true,
      post: payload,
    }),
    // setEditPost: (state, { payload: { title, text } }: PayloadAction<{ title?: string; text?: string }>) => {
    //   if (title) state.post.title = title;
    //   if (text) state.post.text = text;
    // },
    setEditPostUploading: state => ({ ...state, isUploading: true }),
    setEditPostUploadProgress: (state, { payload }: PayloadAction<number>) => ({ ...state, uploadProgress: payload }),
    clearEditPostUploading: state => ({ ...state, isUploading: false, uploadProgress: 0 }),
    closeEditPost: state => ({ ...state, isOpen: false }),
    resetEditPost: () => initialState,
  },
});

export const {
  openEditPost,
  setEditPostUploading,
  setEditPostUploadProgress,
  clearEditPostUploading,
  closeEditPost,
  resetEditPost,
} = editPostSlice.actions;
export default editPostSlice.reducer;
