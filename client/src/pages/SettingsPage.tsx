import React from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
// import { Delete as DeleteIcon } from "@mui/icons-material";
import PrivacySection from "@/components/setting/PrivacySection";
import ThemeSection from "@/components/setting/ThemeSection";
import EmailSection from "@/components/setting/EmailSection";
import PasswordSection from "@/components/setting/PasswordSection";
// import PhoneSection from "@/components/setting/PhoneSection";
import ProfileSection from "@/components/setting/ProfileSection";
import FollowingRequestsDialog from "@/components/setting/FollowingRequestsDialog";
import BlockedUsersDialog from "@/components/setting/BlockedUsersDialog";
import SessionsSection from "@/components/setting/SessionsSection";
import ActivitySection from "@/components/setting/ActivitySection";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 3,
      mb: 4,
      borderRadius: 3,
      boxShadow: "0 2px 8px rgb(167 139 250 / 0.15)",
      backgroundColor: "background.paper",
      width: "100%",
    }}
  >
    <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">
      {title}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

export default function SettingsPage() {
  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: "auto",
        py: 4,
        px: { xs: 2, sm: 4 },
        backgroundColor: "background.default",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <ThemeSection Section={Section} />

      <Section title="Profile Info">
        <ProfileSection />
      </Section>

      <Section title="My Activity">
        <ActivitySection />
      </Section>

      <Section title="Email">
        <EmailSection />
      </Section>

      {/* <Section title="Phone Number">
        <PhoneSection />
      </Section> */}

      <Section title="Change Password">
        <PasswordSection />
      </Section>

      <PrivacySection Section={Section} />

      {/* Notification Settings */}
      {/* <Section title="Notifications">
        <FormGroup>
          <FormControlLabel control={<Switch color="primary" defaultChecked />} label="Likes" />
          <FormControlLabel control={<Switch color="primary" defaultChecked />} label="Comments" />
          <FormControlLabel control={<Switch color="primary" defaultChecked />} label="New Followers" />
          <FormControlLabel control={<Switch color="primary" />} label="Direct Messages" />
        </FormGroup>
      </Section> */}

      {/* Following Requests */}
      <Section title="Following Requests">
        <FollowingRequestsDialog />
      </Section>

      {/* Blocked Users */}
      <Section title="Blocked Users">
        <BlockedUsersDialog />
      </Section>

      {/* Active Sessions */}
      <Section title="Sessions">
        <SessionsSection />
      </Section>

      {/* Danger Zone */}
      {/* <Section title="Danger Zone">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
          <Box sx={{ flex: 1 }}>
            <Button variant="outlined" color="warning" fullWidth>
              Deactivate Account
            </Button>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} fullWidth>
              Delete Account
            </Button>
          </Box>
        </Stack>
      </Section> */}
    </Box>
  );
}
