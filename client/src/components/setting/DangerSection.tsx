import { useState } from "react";
import {
  Stack,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
  VisibilityOutlined as ShowPasswordIcon,
  VisibilityOffOutlined as HidePasswordIcon,
} from "@mui/icons-material";
import { useDeleteAccountMutation } from "@/services/mutations/user.mutations";
import { inputSx } from "@/utils/mui.ts";

export default function DangerSection() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: deleteAccount, isPending, isError } = useDeleteAccountMutation();

  function handleDeleteAccount() {
    if (!password.trim()) return;

    deleteAccount({ password });
  }

  function handleCloseDialog() {
    if (!isPending) {
      setDeleteDialogOpen(false);
      setPassword("");
    }
  }

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
        {/* <Box sx={{ flex: 1 }}>
          <Button variant="outlined" color="warning" fullWidth>
            Deactivate Account
          </Button>
        </Box> */}
        <Box sx={{ flex: 1 }}>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} fullWidth onClick={() => setDeleteDialogOpen(true)}>
            Delete Account
          </Button>
        </Box>
      </Stack>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningIcon color="error" />
          Delete Account
        </DialogTitle>

        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              This action cannot be undone!
            </Typography>
            <Typography variant="body2">Your account and all associated data will be permanently deleted.</Typography>
          </Alert>

          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter your password to confirm account deletion:
          </Typography>

          <TextField
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isPending}
            error={isError}
            autoFocus
            fullWidth
            required
            placeholder="Enter your password"
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                      {showPassword ? <HidePasswordIcon /> : <ShowPasswordIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
                onKeyDown: e => {
                  if (e.key === " ") {
                    e.preventDefault();
                  }
                },
              },
            }}
            sx={inputSx("IconButton")}
          />
        </DialogContent>

        <DialogActions sx={{ m: 1 }}>
          <Button onClick={handleCloseDialog} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={!password.trim() || isPending}
            startIcon={isPending ? undefined : <DeleteIcon />}
          >
            {isPending ? "Deleting..." : "Delete Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
