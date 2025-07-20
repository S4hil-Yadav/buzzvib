import React from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
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
import DangerSection from "@/components/setting/DangerSection.tsx";

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
      <Section title="Danger Zone">
        <DangerSection />
      </Section>
    </Box>
  );
}
