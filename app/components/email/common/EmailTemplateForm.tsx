import { useState, useEffect } from "react";
import { BlockStack, TextField, Box, Text } from "@shopify/polaris";
import type { EmailSettings } from "app/models/schemas";

export interface EmailTemplateFormProps {
  emailSettings: EmailSettings;
  setFormState: (settings: EmailSettings) => void;
  settingsKeys: {
    subject: keyof EmailSettings;
    heading: keyof EmailSettings;
    content: keyof EmailSettings;
    footer: keyof EmailSettings;
  };
  placeholders: string[];
}

export function EmailTemplateForm({ emailSettings, setFormState, settingsKeys, placeholders }: EmailTemplateFormProps) {
  const [ReactQuill, setReactQuill] = useState<any>(null);

  useEffect(() => {
    import("react-quill").then((module) => {
      setReactQuill(() => module.default);
      import("react-quill/dist/quill.snow.css");
    });
  }, []);

  const handleChange = (field: keyof EmailSettings) => (value: string) => setFormState({ ...emailSettings, [field]: value });

  return (
    <BlockStack gap="300">
      <TextField
        label="Email subject"
        value={emailSettings[settingsKeys.subject] as string}
        onChange={handleChange(settingsKeys.subject)}
        autoComplete="off"
      />
      <TextField
        label="Email heading"
        value={emailSettings[settingsKeys.heading] as string}
        onChange={handleChange(settingsKeys.heading)}
        autoComplete="off"
      />

      {ReactQuill ? (
        <>
          <label>Email content</label>
          <ReactQuill value={emailSettings[settingsKeys.content] as string} onChange={handleChange(settingsKeys.content)} />
        </>
      ) : (
        <TextField
          label="Email content"
          value={emailSettings[settingsKeys.content] as string}
          onChange={handleChange(settingsKeys.content)}
          multiline={4}
          autoComplete="off"
        />
      )}

      <Box>
        {placeholders.map((text) => (
          <Text key={text} as="p" variant="bodySm" tone="subdued">
            {text}
          </Text>
        ))}
      </Box>

      <TextField
        label="Email footer"
        value={emailSettings[settingsKeys.footer] as string}
        onChange={handleChange(settingsKeys.footer)}
        autoComplete="off"
      />
    </BlockStack>
  );
}
