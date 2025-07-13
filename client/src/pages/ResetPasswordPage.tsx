import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  EmailOutlined as EmailIcon,
  VisibilityOutlined as ShowPasswordIcon,
  VisibilityOffOutlined as HidePasswordIcon,
} from "@mui/icons-material";
import { inputSx } from "@/utils/utils";
import { useConfirmPasswordResetMutation, useRequestPasswordResetMutation } from "@/services/mutations/auth.mutations";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

export default function ResetPasswordPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const secret = queryParams.get("secret");

  return secret ? <PasswordForm secret={secret} /> : <EmailForm />;
}

function EmailForm() {
  const [email, setEmail] = useState("");

  const [touched, setTouched] = useState(false);

  const { mutate: requestPasswordReset, isPending, isSuccess } = useRequestPasswordResetMutation();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      if (!/.+@.+\..+/.test(email)) {
        throw new Error("Invalid email address");
      }

      requestPasswordReset({ email });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 0, md: 5 },
        width: "100%",
      }}
    >
      <Card
        elevation={2}
        sx={{ width: "100%", maxWidth: { xs: "100vw", md: 700 }, borderRadius: 3, p: 1, height: { xs: "100vh", md: "auto" } }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Reset Your Password
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Enter your email below.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              id="email"
              label="Email"
              type="email"
              value={email}
              disabled={isPending || isSuccess}
              onChange={e => {
                setEmail(e.target.value.replace(/\s+/g, ""));
                setTouched(true);
              }}
              fullWidth
              placeholder="Enter your email"
              required
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                  onKeyDown: e => {
                    if (e.key === " ") {
                      e.preventDefault();
                    }
                  },
                },
              }}
              error={touched && !email}
              helperText={touched && !email ? "Email is required" : ""}
              sx={inputSx()}
            />

            {isSuccess ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                Password reset link has been sent to your email.
              </Alert>
            ) : (
              <Button fullWidth variant="contained" type="submit" disabled={isPending} sx={{ mt: 4, py: 1 }}>
                {isPending ? <CircularProgress size={24} color="inherit" /> : "Submit"}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function PasswordForm({ secret }: { secret: string }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState(false);

  const { mutate: confirmPasswordReset, isPending, isSuccess } = useConfirmPasswordResetMutation();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      if (password.length < 6 || password.length > 30) {
        throw new Error("Password must be 6 to 30 characters long");
      } else if (!secret) {
        throw new Error("No secret provided");
      }

      confirmPasswordReset({ secret, newPassword: password });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 0, md: 5 },
        width: "100%",
      }}
    >
      <Card
        elevation={2}
        sx={{ width: "100%", maxWidth: { xs: "100vw", md: 700 }, borderRadius: 3, p: 1, height: { xs: "100vh", md: "auto" } }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Reset Your Password
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Enter your new password below.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              disabled={isPending || isSuccess}
              onChange={e => {
                setPassword(e.target.value.replace(/\s+/g, ""));
                setTouched(true);
              }}
              fullWidth
              placeholder="Enter your password"
              required
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(prev => !prev)} edge="end">
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
              error={touched && !password}
              helperText="Password must be 6 to 30 characters long"
              sx={inputSx("IconButton")}
            />

            {isSuccess ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                Password has been successfully reset.
              </Alert>
            ) : (
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={isPending || password.length < 6 || password.length > 30}
                sx={{ mt: 2 }}
              >
                {isPending ? <CircularProgress size={24} color="inherit" /> : "Update Password"}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
