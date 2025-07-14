import {
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  TextField,
  Button,
  Stack,
  InputAdornment,
  Box,
  Alert,
} from "@mui/material";
import { ExpandMore as ExpandIcon, EmailOutlined as EmailIcon } from "@mui/icons-material";
import { useState } from "react";
import { inputSx } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@/types";
import {
  useChangeEmailMutation,
  useRequestEmailVerificationMutation,
  useVerifyEmailOTPMutation,
} from "@/services/mutations/user.mutations";
import toast from "react-hot-toast";

export default function EmailSection() {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"])!;

  const [emailStep, setEmailStep] = useState<"input" | "verify">("input");
  const [newEmail, setNewEmail] = useState(authUser.email);
  const [otp, setOtp] = useState("");

  const { mutate: updateEmail, isPending: isPendingUpdateEmail } = useChangeEmailMutation();
  const { mutateAsync: requestEmailVerificationOTP, isPending: isPendingSendEmailVerificationOTP } =
    useRequestEmailVerificationMutation();
  const { mutateAsync: verifyEmailOTP, isPending: isPendingVerifyEmailOTP } = useVerifyEmailOTPMutation();

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (!newEmail) {
        throw new Error("Email is required");
      } else if (!/.+@.+\..+/.test(newEmail)) {
        throw new Error("Invalid email address");
      }

      updateEmail({ email: newEmail });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  }

  async function handleSendOTPSubmit() {
    try {
      setNewEmail(authUser.email);
      await requestEmailVerificationOTP();
      setEmailStep("verify");
    } catch {}
  }

  async function handleVerifyOTPSubmit() {
    try {
      await verifyEmailOTP({ otp });
      setEmailStep("input");
    } catch {}
  }

  function handleVerifyCancel() {
    setEmailStep("input");
    setOtp("");
  }

  return (
    <Accordion slotProps={{ transition: { onExited: () => setNewEmail(authUser.email) } }}>
      <AccordionSummary expandIcon={<ExpandIcon />}>
        <Typography fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          Current: {authUser.email}
          <Typography component="span" fontWeight={500} color={authUser.verified.email ? "success.main" : "error.main"}>
            {authUser.verified.email ? "Verified" : "Not Verified"}
          </Typography>
        </Typography>
      </AccordionSummary>
      {!authUser.verified.email && emailStep === "input" && (
        <Button
          variant="outlined"
          size="small"
          sx={{ ml: 2, color: "primary.dark" }}
          onClick={handleSendOTPSubmit}
          disabled={isPendingUpdateEmail || isPendingSendEmailVerificationOTP}
        >
          Verify Email
        </Button>
      )}
      <AccordionDetails>
        {emailStep === "input" ? (
          <Box component="form" onSubmit={handleEmailSubmit}>
            <TextField
              id="email"
              label="Email"
              type="email"
              margin="normal"
              value={newEmail}
              disabled={isPendingUpdateEmail || isPendingSendEmailVerificationOTP}
              onChange={e => setNewEmail(e.target.value.replace(/\s+/g, ""))}
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
              sx={inputSx()}
              error={!newEmail}
              helperText={newEmail ? "" : "Email is required"}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!newEmail || newEmail === authUser.email || isPendingUpdateEmail || isPendingSendEmailVerificationOTP}
              sx={{ mt: 2, mb: 1 }}
            >
              Submit
            </Button>
          </Box>
        ) : (
          <>
            <Alert severity="success">An OTP has been sent to your email.</Alert>
            <TextField
              fullWidth
              margin="normal"
              label="Enter OTP"
              variant="outlined"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\s+/, ""))}
              slotProps={{
                input: {
                  onKeyDown: e => {
                    if (e.key === " ") {
                      e.preventDefault();
                    }
                  },
                },
              }}
              sx={inputSx()}
            />
            <Stack direction="row" spacing={2} mt={1}>
              <Button variant="contained" disabled={!otp || isPendingVerifyEmailOTP} onClick={handleVerifyOTPSubmit}>
                Verify
              </Button>
              <Button variant="outlined" onClick={handleVerifyCancel}>
                Cancel
              </Button>
            </Stack>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
