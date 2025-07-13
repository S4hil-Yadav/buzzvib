import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const postDraftSlice = createSlice({
  name: "postDraft",
  initialState: {
    postDraft: { title: "", text: "", mediaUrls: [] },
    uploading: false,
    uploadProgress: 0,
  },
  reducers: {
    setDraft: (state, action) => ({ ...state, postDraft: action.payload }),

    clearDraft: () => ({
      postDraft: { title: "", text: "", mediaUrls: [] },
      uploading: false,
      uploadProgress: 0,
    }),

    setUploading: state => ({ ...state, uploading: true }),

    setUploadProgress: (state, action: PayloadAction<number>) => ({ ...state, uploadProgress: action.payload }),

    clearUploading: state => ({ ...state, uploading: false, uploadProgress: 0 }),
  },
});

export const { setDraft, clearDraft, setUploading, setUploadProgress, clearUploading } = postDraftSlice.actions;

const postDraftReducer = postDraftSlice.reducer;
export default postDraftReducer;
