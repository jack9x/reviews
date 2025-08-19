import { Box, Tabs } from "@shopify/polaris";
import type { EmailSettings } from "app/models/schemas";
import { useCallback, useState } from "react";
import { DEFAULT_EMAIL_SETTINGS } from "app/lib/helpers/email.helper";
import { EmailReminder } from "./EmailReminder";
import { EmailReward } from "./EmailReward";

export interface EmailSectionProps {
  emailSettings: EmailSettings;
  setFormState: (settings: EmailSettings) => void;
}

export function EmailSection({ emailSettings, setFormState }: EmailSectionProps) {
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback((selectedTabIndex: number) => setSelected(selectedTabIndex), []);

  const tabs = [
    {
      id: "reminder",
      content: "Reminder",
      accessibilityLabel: "Reminder",
      panelID: "reminder-content",
    },
    {
      id: "reward",
      content: "Reward",
      panelID: "reward-content",
    },
  ];

  const mergedSettings: EmailSettings = {
    ...DEFAULT_EMAIL_SETTINGS,
    ...emailSettings,
  };

  return (
    <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
      <Box padding="300">
        {selected === 0 && <EmailReminder emailSettings={mergedSettings} setFormState={setFormState} />}
        {selected === 1 && <EmailReward emailSettings={mergedSettings} setFormState={setFormState} />}
      </Box>
    </Tabs>
  );
}
