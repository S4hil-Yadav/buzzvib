import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Avatar,
  Box,
  TextField,
  Button,
  Menu,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  AbcOutlined as FullnameIcon,
  AccountCircleOutlined as UsernameIcon,
} from "@mui/icons-material";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useUpdateProfileMutation } from "@/services/mutations/user.mutations";
import type { AuthUser, UpdateUserFields } from "@/types";
import { useEffect, useRef, useState } from "react";
import { inputSx } from "@/utils/utils";

export default function EditProfile() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"])!;

  const [isOpen, setIsOpen] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const [uploadProgress, setUploadProgress] = useState(0);

  const { mutateAsync: handleUpdate, isPending } = useUpdateProfileMutation({ setUploadProgress });

  const { username, fullname, profilePicture, bio } = authUser;

  const [userFields, setUserFields] = useState<UpdateUserFields>({ username, fullname, profilePicture, bio });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changed, setChanged] = useState(false);
  const profilePictureRef = useRef<HTMLInputElement>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => () => URL.revokeObjectURL(userFields.profilePicture), [userFields.profilePicture]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setUserFields({
      ...userFields,
      [e.target.id]:
        e.target.id === "bio"
          ? e.target.value.trimStart()
          : e.target.id === "fullname"
          ? e.target.value.replace(/\s+/g, " ").trimStart()
          : e.target.value.replace(/\s+/g, ""),
    });
    setChanged(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const pfp = e.target.files?.[0];
    if (!pfp) return;

    setUserFields(prev => ({ ...prev, profilePicture: URL.createObjectURL(pfp) }));
    e.target.value = "";
    setChanged(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      if (!userFields.fullname || !userFields.username) {
        throw new Error("Full name and username are required");
      } else if (userFields.username.length > 20) {
        throw new Error("Maximum username length is 20");
      } else if (userFields.fullname.split(" ").length > 5 || !userFields.fullname.split(" ").every(part => part.length <= 20)) {
        throw new Error("Only 5 words of max length 20 are allowed in full name");
      }

      const formData = new FormData();
      const newProfilePicture =
        !userFields.profilePicture || userFields.profilePicture === authUser.profilePicture
          ? null
          : await fetch(userFields.profilePicture).then(res => res.blob());

      formData.append("userFields", JSON.stringify(userFields));
      if (newProfilePicture) {
        formData.append("profilePicture", newProfilePicture);
      }

      await handleUpdate({ formData });
      setChanged(false);
    } catch {}
  }

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      slotProps={{
        transition: { onExited: () => navigate(location.state?.backgroundLocation.pathname ?? `/profile/${authUser.username}`) },
      }}
      fullWidth
      fullScreen={isMobile}
      maxWidth="sm"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          height: 60,
        }}
      >
        <Box />

        <Typography sx={{ fontWeight: 500, fontSize: 25 }} textAlign="center">
          Edit Profile
        </Typography>

        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={3}>
            <Box position="relative" mx="auto">
              <Avatar
                src={userFields.profilePicture}
                alt={userFields.fullname}
                onClick={() => profilePictureRef.current?.click()}
                sx={{ width: 130, height: 130, border: "4px double grey", ":hover": { cursor: "pointer" } }}
              />
              <IconButton
                onClick={e => setAnchorEl(e.currentTarget)}
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bgcolor: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                  ":hover": { bgcolor: "rgba(0, 0, 0, 0.8)" },
                }}
              >
                <EditIcon />
              </IconButton>
              <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                <MenuItem
                  disabled={isPending}
                  onClick={() => {
                    profilePictureRef.current?.click();
                    setAnchorEl(null);
                  }}
                >
                  Change photo
                </MenuItem>
                <MenuItem
                  disabled={!userFields.profilePicture || isPending}
                  onClick={() => {
                    setUserFields(prev => ({ ...prev, profilePicture: "" }));
                    setChanged(true);
                    setAnchorEl(null);
                  }}
                  sx={{ color: "error.light" }}
                >
                  Remove photo
                </MenuItem>
              </Menu>
              <input type="file" accept="image/*" ref={profilePictureRef} onInput={handleImageUpload} hidden />
            </Box>

            <TextField
              id="fullname"
              label="Full Name"
              value={userFields.fullname}
              onChange={handleChange}
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
                      (!start || !end || fullname[start - 1] === " " || (end < fullname.length && fullname[end] === " "))
                    ) {
                      e.preventDefault();
                    }
                  },
                },
              }}
              sx={inputSx()}
              error={!userFields.fullname}
              helperText={userFields.fullname ? "" : "Full name is required"}
            />
            <TextField
              id="username"
              label="Username"
              value={userFields.username}
              onChange={handleChange}
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
              sx={inputSx()}
              error={!userFields.username}
              helperText={userFields.username ? "" : "Username is required"}
            />
            <TextField
              label="Bio"
              id="bio"
              value={userFields.bio}
              placeholder="Write something about yourself"
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              sx={inputSx()}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  onKeyDown: e => {
                    if (e.key === " " && !e.currentTarget.selectionStart) {
                      e.preventDefault();
                    }
                  },
                },
              }}
            />

            <DialogActions sx={{ justifyContent: "center", mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!changed || isPending}
                sx={{
                  minWidth: 120,
                  fontSize: 15,
                  fontWeight: 300,
                  textTransform: "capitalize",
                }}
              >
                {isPending ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    Saving...
                    {userFields.profilePicture && userFields.profilePicture !== authUser.profilePicture && (
                      <Box sx={{ position: "relative", display: "inline-flex" }}>
                        <CircularProgress variant="determinate" value={uploadProgress} />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: "absolute",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography variant="caption" component="div" sx={{ color: "text.secondary" }}>
                            {`${Math.round(uploadProgress)}%`}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography fontSize={15} sx={{ color: isPending || !changed ? "text.primary" : "primary.contrastText" }}>
                    Save Changes
                  </Typography>
                )}
              </Button>
            </DialogActions>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
