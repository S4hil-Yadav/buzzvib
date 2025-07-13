import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const initialState = { mode: "light" as "light" | "dark" };

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: state => ({ ...state, mode: state.mode === "light" ? "dark" : "light" }),
    setTheme: (state, action: PayloadAction<typeof initialState.mode>) => ({ ...state, mode: action.payload }),
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;

const themeReducer = themeSlice.reducer;
export default themeReducer;
