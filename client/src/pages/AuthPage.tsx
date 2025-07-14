import { useEffect, useRef, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Paper,
  InputAdornment,
  Link as MuiLink,
} from "@mui/material";
import {
  // GitHub as GitHubIcon,
  VisibilityOutlined as ShowPasswordIcon,
  VisibilityOffOutlined as HidePasswordIcon,
  AbcOutlined as FullnameIcon,
  EmailOutlined as EmailIcon,
  AccountCircleOutlined as UsernameIcon,
} from "@mui/icons-material";
import { FcGoogle as GoogleIcon } from "react-icons/fc";
import { useLoginMutation, useSignupMutation, useGoogleAuthMutation } from "@/services/mutations/auth.mutations";
import { inputSx } from "@/utils";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

const initialUserFields = {
  fullname: "",
  username: "",
  email: "",
  password: "",
};

const initialTouched = { fullname: false, username: false, email: false, password: false };

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const inputs = useRef(null);

  const [authType, setAuthType] = useState<"login" | "signup">(location.state?.authType === "login" ? "login" : "signup");
  const [userFields, setUserFields] = useState(initialUserFields);
  const [touched, setTouched] = useState(initialTouched);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setTouched(initialTouched);
  }, [authType]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUserFields(prev => ({
      ...prev,
      [e.target.id]:
        e.target.id === "fullname" ? e.target.value.replace(/\s+/g, " ").trimStart() : e.target.value.replace(/\s+/g, ""),
    }));
    setTouched(prev => ({ ...prev, [e.target.id]: true }));
  }

  const { mutate: login, isPending: isPendingLogin, isSuccess: isSuccessLogin } = useLoginMutation();
  const { mutate: signup, isPending: isPendingSignup, isSuccess: isSuccessSignup } = useSignupMutation();
  const { mutate: googleAuth, isPending: isPendingGoogleLogin, isSuccess: isSuccessGoogleLogin } = useGoogleAuthMutation();

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "redirect",
    redirect_uri: `${import.meta.env.VITE_CLIENT_URL}/auth`,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get("code");

    if (code) googleAuth({ code });
  }, [googleAuth, location.search, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { fullname, username, password, email } = userFields;

    try {
      if (!password || !email || (authType === "signup" && (!fullname || !username))) {
        throw new Error("All fields are required");
      }

      if (authType === "signup") {
        if (!/.+@.+\..+/.test(email)) {
          throw new Error("Invalid email address");
        } else if (username.length > 20) {
          throw new Error("Maximum username length is 20");
        } else if (password.length < 6 || password.length > 30) {
          throw new Error("Password must be 6 to 30 characters long");
        } else if (fullname.split(" ").length > 5 || fullname.length > 30) {
          throw new Error("Only 5 words and max length 30 is allowed");
        }
      }

      if (authType === "signup") {
        signup({ userFields: { ...userFields } });
      } else {
        login({ userFields: { email, password } });
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  }

  const isPending = isPendingLogin || isPendingSignup || isPendingGoogleLogin;
  const isSuccess = isSuccessLogin || isSuccessSignup || isSuccessGoogleLogin;

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: { xs: 0, sm: 5 },
      }}
    >
      <Container disableGutters maxWidth="sm">
        <Paper
          elevation={4}
          sx={{
            px: { xs: 3, sm: 6 },
            py: { xs: 0, sm: 4 },
            borderRadius: 0,
            minHeight: { xs: "100vh", sm: "auto" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            bgcolor: "background.paper",
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                <Box flex={1} height={6} bgcolor="divider" />
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {authType.toUpperCase()}
                </Typography>
                <Box flex={1} height={6} bgcolor="divider" />
              </Stack>

              <Stack spacing={3} ref={inputs}>
                {authType === "signup" && (
                  <TextField
                    id="fullname"
                    label="Full Name"
                    value={userFields.fullname}
                    onChange={handleChange}
                    disabled={isPending || isSuccess}
                    fullWidth
                    required
                    placeholder="Enter your full name"
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <FullnameIcon fontSize="large" />
                          </InputAdornment>
                        ),
                        onKeyDown: e => {
                          const start = e.currentTarget.selectionStart;
                          const end = e.currentTarget.selectionEnd;
                          if (
                            e.key === " " &&
                            (!start ||
                              !end ||
                              userFields.fullname[start - 1] === " " ||
                              (end < userFields.fullname.length && userFields.fullname[end] === " "))
                          ) {
                            e.preventDefault();
                          }
                        },
                      },
                    }}
                    error={touched.fullname && !userFields.fullname}
                    helperText={touched.fullname && !userFields.fullname ? "Full name is required" : ""}
                    sx={inputSx()}
                  />
                )}

                {authType === "signup" && (
                  <TextField
                    id="username"
                    label="Username"
                    value={userFields.username}
                    onChange={handleChange}
                    disabled={isPending || isSuccess}
                    fullWidth
                    required
                    placeholder="Enter your username"
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <UsernameIcon />
                          </InputAdornment>
                        ),
                        onKeyDown: e => {
                          if (e.key === " ") {
                            e.preventDefault();
                          }
                        },
                      },
                    }}
                    error={touched.username && !userFields.username}
                    helperText={touched.username && !userFields.username ? "Username is required" : ""}
                    sx={inputSx()}
                  />
                )}

                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  value={userFields.email}
                  onChange={handleChange}
                  disabled={isPending || isSuccess}
                  fullWidth
                  required
                  placeholder="Enter your email"
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
                  error={touched.email && !userFields.email}
                  helperText={touched.email && !userFields.email ? "Email is required" : ""}
                  sx={inputSx()}
                />

                <Box>
                  <TextField
                    id="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={userFields.password}
                    onChange={handleChange}
                    disabled={isPending || isSuccess}
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
                    error={touched.password && !userFields.password}
                    helperText={touched.password && !userFields.password ? "Password is required" : ""}
                    sx={inputSx("IconButton")}
                  />
                  {authType === "login" && (
                    <Box textAlign="right" sx={{ mt: 1 }}>
                      <MuiLink
                        component={RouterLink}
                        to="/reset-password"
                        sx={{ color: "primary.main", ":hover": { color: "primary.dark", bgcolor: "transparent" } }}
                      >
                        Forgot Password
                      </MuiLink>
                    </Box>
                  )}
                </Box>
              </Stack>

              <Box py={2}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isPending || isSuccess}
                  sx={theme => ({
                    py: 1.5,
                    fontSize: 20,
                    borderRadius: 200,
                    textTransform: "capitalize",
                    color: "white",
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(to right, #3F51B5, #AB47BC, #EC407A)"
                        : "linear-gradient(to right, #9FA8DA, #CE93D8, #F48FB1)",
                    ":hover": {
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(to right, #5C6BC0, #BA68C8, #F06292)"
                          : "linear-gradient(to right, #7986CB, #BA68C8, #F06292)",
                    },
                    ":disabled": {
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(to right, #303F9F, #8E24AA, #C2185B)"
                          : "linear-gradient(to right, #F8BBD0, #E1BEE7, #C5CAE9)",
                      color: "white",
                      WebkitTextFillColor: "unset",
                    },
                  })}
                >
                  {isPending ? "Processing..." : isSuccess ? "Redirecting..." : authType}
                </Button>
              </Box>

              <Stack spacing={2}>
                <Divider sx={{ "&::before, &::after": { borderColor: "divider" } }}>
                  <Typography fontWeight={500}>or continue with</Typography>
                </Divider>

                <Stack direction="row" justifyContent="center" spacing={1}>
                  <Tooltip title="Google" placement="left">
                    <IconButton onClick={() => googleLogin()}>
                      <GoogleIcon size={35} />
                    </IconButton>
                  </Tooltip>
                  {/* <Tooltip title={`${authType} with GitHub`} placement="right">
                    <IconButton size="large">
                      <GitHubIcon fontSize="large" sx={{ color: "text.primary" }} />
                    </IconButton>
                  </Tooltip> */}
                </Stack>

                <Typography
                  variant="body2"
                  align="center"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                  }}
                >
                  {authType === "signup" ? "Already have an account?" : "Don't have an account?"}
                  <Button
                    disableTouchRipple
                    onClick={() => setAuthType(prev => (prev === "login" ? "signup" : "login"))}
                    sx={{
                      textTransform: "capitalize",
                      fontWeight: 300,
                      color: "primary.dark",
                      ":hover": { opacity: 0.5, bgcolor: "transparent" },
                    }}
                  >
                    {authType === "signup" ? "login" : "signup"}
                  </Button>
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
