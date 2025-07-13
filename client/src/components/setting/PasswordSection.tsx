import {
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Box,
  Link as MuiLink,
} from "@mui/material";
import {
  VisibilityOutlined as ShowPasswordIcon,
  VisibilityOffOutlined as HidePasswordIcon,
  ExpandMore as ExpanedIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { inputSx } from "@/utils/utils";
import { useState } from "react";
import { useChangePasswordMutation } from "@/services/mutations/user.mutations";
import toast from "react-hot-toast";

const initialTouched = { oldPassword: false, newPassword: false };

export default function PasswordSection() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(true);
  const [showNewPassword, setShowNewPassword] = useState(true);

  const [touched, setTouched] = useState(initialTouched);

  const { mutate: changePassword, isPending: isPendingChangePassword } = useChangePasswordMutation();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      if (!oldPassword || !newPassword) {
        throw new Error("Both fields are required");
      } else if (oldPassword.length < 6 || newPassword.length < 6) {
        throw new Error("Minimum password length is 6");
      } else if (oldPassword.length > 30 || newPassword.length > 30) {
        throw new Error("Maximum password length is 30");
      } else if (oldPassword === newPassword) {
        throw new Error("Both Password are same");
      }

      changePassword({ oldPassword, newPassword });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  }

  return (
    <Accordion
      slotProps={{
        transition: {
          onExited: () => {
            setTouched(initialTouched);
            setOldPassword("");
            setNewPassword("");
          },
        },
      }}
    >
      <AccordionSummary expandIcon={<ExpanedIcon />}>
        <Typography fontWeight={600}>Change your password</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column" }}>
          <TextField
            id="old-password"
            label="Old Password"
            type={showOldPassword ? "text" : "password"}
            value={oldPassword}
            onChange={e => {
              setOldPassword(e.target.value.replace(/\s+/g, ""));
              setTouched(prev => ({ ...prev, oldPassword: true }));
            }}
            fullWidth
            margin="normal"
            placeholder="Enter your password"
            required
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowOldPassword(prev => !prev)} edge="end">
                      {showOldPassword ? <HidePasswordIcon /> : <ShowPasswordIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
                onKeyDown: e => {
                  if (e.key === " ") e.preventDefault();
                },
              },
            }}
            error={touched.oldPassword && !oldPassword}
            helperText={touched.oldPassword && !oldPassword ? "Please provide old password" : ""}
            sx={inputSx("IconButton")}
          />

          <TextField
            id="new-password"
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={e => {
              setNewPassword(e.target.value.replace(/\s+/g, ""));
              setTouched(prev => ({ ...prev, newPassword: true }));
            }}
            fullWidth
            margin="normal"
            placeholder="Enter your password"
            required
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(prev => !prev)} edge="end">
                      {showNewPassword ? <HidePasswordIcon /> : <ShowPasswordIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
                onKeyDown: e => {
                  if (e.key === " ") e.preventDefault();
                },
              },
            }}
            error={touched.newPassword && !newPassword}
            helperText={
              touched.newPassword && !newPassword ? "New password can't be empty" : "Password must be 6 to 30 characters long"
            }
            sx={inputSx("IconButton")}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 1 }}
            disabled={
              oldPassword.length < 6 ||
              newPassword.length < 6 ||
              oldPassword.length > 30 ||
              newPassword.length > 30 ||
              isPendingChangePassword
            }
          >
            Submit
          </Button>

          <MuiLink
            component={RouterLink}
            to="/reset-password"
            sx={{
              widows: "100%",
              mt: 1,
              color: "primary.dark",
              ":hover": { color: "primary.main" },
              textAlign: "center",
              fontSize: 12,
            }}
          >
            Forgot Password
          </MuiLink>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
