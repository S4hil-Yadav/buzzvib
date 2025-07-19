import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  autoplayVideosWithAudio: false,
};

const preferenceSlice = createSlice({
  name: "preference",
  initialState,
  reducers: {
    setAutoplayVideosWithAudio: (state, action: PayloadAction<boolean>) => ({
      ...state,
      autoplayVideosWithAudio: action.payload,
    }),
    toggleAutoplayVideosWithAudio: state => ({
      ...state,
      autoplayVideosWithAudio: !state.autoplayVideosWithAudio,
    }),
  },
});

export const { setAutoplayVideosWithAudio, toggleAutoplayVideosWithAudio } = preferenceSlice.actions;

const preferenceReducer = preferenceSlice.reducer;
export default preferenceReducer;
