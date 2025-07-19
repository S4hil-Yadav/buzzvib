import { closeAlert, resetAlert } from "@/redux/slices/alertSlice";
import type { RootState, AppDispatch } from "@/redux/store";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

const redBgColorTextSet = new Set(["remove", "unfollow", "delete", "logout", "withdraw", "block", "revoke"]);

export default function AlertDialog() {
  const dispatch = useDispatch<AppDispatch>();
  const { isOpen, title, confirmButtonText, message, disabled, onConfirm } = useSelector((state: RootState) => state.alert);

  const redBgColor = redBgColorTextSet.has(confirmButtonText);

  return (
    <Dialog
      open={isOpen}
      onClose={() => dispatch(closeAlert())}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: 2,
            bgcolor: "background.paper",
            boxShadow: 8,
          },
        },
        transition: { onExited: () => dispatch(resetAlert()) },
      }}
    >
      <DialogTitle
        sx={{
          textTransform: "capitalize",
          fontSize: "1.6rem",
          fontWeight: "bold",
          textAlign: "center",
          pb: 0,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ textAlign: "center" }}>
        <DialogContentText sx={{ fontSize: "1rem", color: "text.secondary", mt: 1 }}>{message}</DialogContentText>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "center",
          gap: 2,
          mt: 1,
          pb: 2,
        }}
      >
        {!!onConfirm && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => dispatch(closeAlert())}
            sx={{
              textTransform: "capitalize",
              border: "1px solid lightgrey",
              fontWeight: 500,
              width: 100,
              fontSize: 17,
              py: 0.5,
              "&:hover": {
                color: "grey.500",
              },
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          disabled={disabled}
          onClick={() => {
            if (onConfirm) {
              onConfirm();
            }
            dispatch(closeAlert());
          }}
          sx={{
            borderRadius: 3,
            textTransform: "capitalize",
            fontWeight: 500,
            width: 100,
            fontSize: 17,
            py: 0.5,
            backgroundColor: redBgColor ? "#ef4444" : "primary.dark",
            color: redBgColor ? "white" : "primary.contrastText",
            "&:hover": { backgroundColor: redBgColor ? "#f87171" : "primary.main" },
            "&.Mui-disabled": {
              backgroundColor: redBgColor ? "#ef4444" : "primary.dark",
              opacity: 1,
              pointerEvents: "auto",
            },
          }}
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
