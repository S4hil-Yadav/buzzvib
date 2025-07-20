import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface PostDraftState {
  postDraft: { title: string; text: string };
  uploadProgress: number;
}

const initialState: PostDraftState = {
  postDraft: { title: "", text: "" },
  uploadProgress: 0,
};

const postDraftSlice = createSlice({
  name: "postDraft",
  initialState,
  reducers: {
    setPostDraft: (state, { payload: { title, text } }: PayloadAction<{ title?: string; text?: string }>) => {
      if (typeof title === "string") state.postDraft.title = title;
      if (typeof text === "string") state.postDraft.text = text;
    },
    clearPostDraft: () => initialState,
    setPostDraftUploadProgress: (state, { payload }: PayloadAction<number>) => ({ ...state, uploadProgress: payload }),
    clearPostDraftUploadProgress: state => ({ ...state, uploadProgress: 0 }),
  },
});

export const { setPostDraft, clearPostDraft, setPostDraftUploadProgress, clearPostDraftUploadProgress } = postDraftSlice.actions;

const postDraftReducer = postDraftSlice.reducer;
export default postDraftReducer;
