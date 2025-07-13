import { Accordion, AccordionSummary, Typography, AccordionDetails, TextField, Button, Stack } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { useState } from "react";

export default function PhoneSection() {
  const [phoneStep, setPhoneStep] = useState<"input" | "otp">("input");
  const [newPhone, setNewPhone] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");

  // Handlers for phone flow
  const handlePhoneSubmit = () => {
    if (phoneStep === "input") {
      setPhoneStep("otp");
    } else {
      alert(`Verifying Phone OTP: ${phoneOTP}`);
      setPhoneStep("input");
      setNewPhone("");
      setPhoneOTP("");
    }
  };
  const handlePhoneCancel = () => {
    setPhoneStep("input");
    setNewPhone("");
    setPhoneOTP("");
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Current: +91 9876543210</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {phoneStep === "input" ? (
          <>
            <TextField
              fullWidth
              label="New Phone Number"
              variant="outlined"
              margin="normal"
              type="tel"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
            />
            <Button variant="contained" fullWidth onClick={handlePhoneSubmit} disabled={!newPhone.trim()}>
              Submit
            </Button>
          </>
        ) : (
          <>
            <TextField
              fullWidth
              label="Enter OTP"
              variant="outlined"
              margin="normal"
              value={phoneOTP}
              onChange={e => setPhoneOTP(e.target.value)}
            />
            <Stack direction="row" spacing={2} mt={2}>
              <Button variant="contained" onClick={handlePhoneSubmit} disabled={!phoneOTP.trim()}>
                Verify
              </Button>
              <Button variant="outlined" onClick={handlePhoneCancel}>
                Cancel
              </Button>
            </Stack>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
