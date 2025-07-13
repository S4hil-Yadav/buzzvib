import { useUpdatePrivacySettingsMutation } from "@/services/mutations/user.mutations";
import type { AuthUser } from "@/types";
import { Switch, FormControlLabel, Button, Typography, Box } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";

interface PrivacySectionProps {
  Section: React.FC<{ title: string; children: React.ReactNode }>;
}

export default function PrivacySection({ Section }: PrivacySectionProps) {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"])!;

  const { mutate: updatePrivacySettings } = useUpdatePrivacySettingsMutation();

  return (
    <>
      {/* Account Privacy */}
      <Section title="Account Privacy">
        <PrivacyToggleButtons
          value={authUser.privacy.account.visibility}
          onChange={newVal => updatePrivacySettings({ visibility: newVal })}
        />
      </Section>
      {/* Liked Posts Visibility */}
      <Section title="Liked Posts Visibility">
        <FormControlLabel
          control={
            <Switch
              color="primary"
              onClick={() => updatePrivacySettings({ showLikes: !authUser.privacy.showLikes })}
              checked={authUser.privacy.showLikes}
              sx={{ mr: 1 }}
            />
          }
          label={`Other users ${authUser.privacy.showLikes ? "can" : "can't"} view your liked posts`}
        />
      </Section>

      {/* Tagging Permissions */}
      {/* <Section title="Tagging Permissions">
        <FormControlLabel
          control={
            <Switch
              color="primary"
              onClick={() => updatePrivacySettings({ taggable: !authUser.privacy.account.taggable })}
              checked={authUser.privacy.account.taggable}
              sx={{ mr: 1 }}
            />
          }
          label={`Other users ${authUser.privacy.account.taggable ? "can" : "can't"} tag you`}
        />
      </Section> */}

      <Section title="Searching Permissions">
        <FormControlLabel
          control={
            <Switch
              color="primary"
              onClick={() => updatePrivacySettings({ searchable: !authUser.privacy.account.searchable })}
              checked={authUser.privacy.account.searchable}
              sx={{ mr: 1 }}
            />
          }
          label={`Other users ${authUser.privacy.account.searchable ? "can" : "can't"} search you`}
        />
      </Section>
    </>
  );
}

interface PrivacyToggleButtonsProps {
  value: "private" | "public";
  onChange: (newValue: "private" | "public") => void;
  disabled?: boolean;
}

function PrivacyToggleButtons({ value, onChange, disabled }: PrivacyToggleButtonsProps) {
  return (
    <Box borderRadius={2} sx={{ display: "flex", alignItems: "center" }}>
      {/* Public Button (Left) */}
      <Button
        onClick={() => !disabled && onChange("public")}
        startIcon={<PublicIcon sx={{ color: value === "public" ? "primary.dark" : "text.secondary" }} fontSize="small" />}
        sx={{
          borderRadius: "8px 0 0 8px",
          border: "1px solid",
          borderColor: value === "public" ? "primary.dark" : "grey.300",
          borderRight: "none",
          px: 2,
          py: 1,
          textTransform: "none",
          minWidth: "64px",
          userSelect: "none",
        }}
        disabled={disabled}
      >
        <Typography
          variant="caption"
          color={value === "public" ? "primary.dark" : "text.secondary"}
          fontWeight={600}
          sx={{ userSelect: "none" }}
        >
          Public
        </Typography>
      </Button>
      {/* Private Button (Right) */}
      <Button
        onClick={() => !disabled && onChange("private")}
        startIcon={<LockIcon sx={{ color: value === "private" ? "primary.dark" : "text.secondary" }} fontSize="small" />}
        sx={{
          borderRadius: "0 8px 8px 0",
          border: "1px solid",
          borderColor: value === "private" ? "primary.dark" : "grey.300",
          borderLeftColor: "primary.dark",
          px: 2,
          py: 1,
          textTransform: "none",
          minWidth: "64px",
          userSelect: "none",
        }}
        disabled={disabled}
      >
        <Typography
          variant="caption"
          color={value === "private" ? "primary.dark" : "text.secondary"}
          fontWeight={600}
          sx={{ userSelect: "none" }}
        >
          Private
        </Typography>
      </Button>
      <Typography variant="body1" fontWeight={500} sx={{ ml: 3, textTransform: "capitalize" }}>
        {value} Account
      </Typography>
    </Box>
  );
}
