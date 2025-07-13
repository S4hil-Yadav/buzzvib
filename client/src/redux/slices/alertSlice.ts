import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmButtonText: string;
  disabled: boolean;
  onConfirm?: () => void;
}

const initialState: AlertState = {
  isOpen: false,
  title: "",
  message: "",
  confirmButtonText: "",
  disabled: false,
};

const alertSlice = createSlice({
  name: "alert",

  initialState,

  reducers: {
    openAlert: (_state, action: PayloadAction<Omit<AlertState, "isOpen" | "disabled">>) => ({
      isOpen: true,
      disabled: false,
      ...action.payload,
    }),
    setDisabled: (state, action: PayloadAction<boolean>) => {
      state.disabled = action.payload;
    },
    closeAlert: state => ({ ...state, isOpen: false, disabled: true }),
    resetAlert: () => ({ ...initialState }),
  },
});

export const { openAlert, setDisabled, closeAlert, resetAlert } = alertSlice.actions;

const alertReducer = alertSlice.reducer;
export default alertReducer;
