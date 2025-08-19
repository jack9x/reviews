import { BlockStack, Box, InlineStack, Button, Text, Divider } from "@shopify/polaris";
import { DesktopIcon, MobileIcon } from "@shopify/polaris-icons";
import type { EmailSettings } from "app/models/schemas";
import { SendTestEmailModal } from "./SendTestEmailModal";
import { useState } from "react";

export interface EmailTemplatePreviewProps {
  mode: "desktop" | "mobile";
  setMode: (mode: "desktop" | "mobile") => void;
  emailSettings: EmailSettings;
  settingsKeys: {
    subject: keyof EmailSettings;
    heading: keyof EmailSettings;
    content: keyof EmailSettings;
    footer: keyof EmailSettings;
  };
  replaceTokens: (content: string) => string;
}

export function EmailTemplatePreview({ mode, setMode, emailSettings, settingsKeys, replaceTokens }: EmailTemplatePreviewProps) {
  const subject = emailSettings[settingsKeys.subject] as string;
  const heading = emailSettings[settingsKeys.heading] as string;
  const content = emailSettings[settingsKeys.content] as string;
  const footer = emailSettings[settingsKeys.footer] as string;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fullHtml = replaceTokens(content);

  const handleSendTestEmail = () => {
    setIsModalOpen(true);
  };

  return (
    <Box borderWidth="025" borderColor="border" borderRadius="150" padding="500">
      <InlineStack align="space-between">
        <Text as="h3" variant="headingSm">
          Preview
        </Text>
        <InlineStack gap="300">
          <Button
            icon={DesktopIcon}
            accessibilityLabel="Desktop preview"
            variant={mode === "desktop" ? "primary" : "tertiary"}
            onClick={() => setMode("desktop")}
          />
          <Button
            icon={MobileIcon}
            accessibilityLabel="Mobile preview"
            variant={mode === "mobile" ? "primary" : "tertiary"}
            onClick={() => setMode("mobile")}
          />
          <Button onClick={handleSendTestEmail}>Send test email</Button>
        </InlineStack>
      </InlineStack>

      <div
        style={{
          margin: mode === "desktop" ? "15px 0px 5px 0px" : "25px auto",
          width: mode === "desktop" ? "100%" : "300px",
        }}
      >
        <Box borderWidth="025" borderColor="border" borderRadius="200">
          <Box padding="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                {subject}
              </Text>
              <InlineStack gap="100">
                <div style={{ width: 20, height: 20, backgroundColor: "#6366F1", borderRadius: "50%" }} />
                <Text as="p" tone="subdued">
                  Demo site
                </Text>
              </InlineStack>
            </BlockStack>
          </Box>
          <Divider />
          <Box padding="400" minHeight="400px">
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                {heading}
              </Text>

              <Text as="p">
                <div dangerouslySetInnerHTML={{ __html: fullHtml }} />
              </Text>
              <Text as="p" alignment="center">
                {footer?.replace("{site_title}", "Demo Store")}
              </Text>
            </BlockStack>
          </Box>
        </Box>
        <SendTestEmailModal open={isModalOpen} onClose={() => setIsModalOpen(false)} subject={subject} htmlContent={fullHtml} />
      </div>
    </Box>
  );
}
