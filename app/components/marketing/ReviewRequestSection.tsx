import { Banner, BlockStack, Box, Card, InlineStack, Link, RadioButton, Text, TextField } from "@shopify/polaris";
import { SidebarSection } from "app/components/marketing/SidebarSection";
import { getDaySendState } from "app/lib/helpers/email.helper";
import type { EmailSettings } from "app/models/schemas";
import { useEffect, useState } from "react";

const DAY_OPTIONS = [
  { label: "5 days (recommended)", value: "5" },
  { label: "7 days", value: "7" },
  { label: "14 days", value: "14" },
  { label: "Custom", value: "custom" },
];

interface ReviewRequestSectionProps {
  formState: { [key: string]: string | boolean };
  onChange: (key: keyof EmailSettings, value: number | string) => void;
}

export function ReviewRequestSection({ formState, onChange }: ReviewRequestSectionProps) {
  const [daySendValue, setDaySendValue] = useState("custom");
  const [customDay, setCustomDay] = useState("");
  const handleDaySendChange = (_: boolean, newValue: string) => {
    if (newValue !== "custom") {
      setDaySendValue(newValue);
      onChange("daySend", Number(newValue));
    } else {
      setDaySendValue(newValue);
    }
  };
  const handleCustomDayChange = (value: string) => {
    onChange("daySend", Number(value || 1));
  };

  useEffect(() => {
    const { daySendValue, customDay } = getDaySendState(Number(formState.daySend) || 5);
    setDaySendValue(daySendValue);
    setCustomDay(customDay);
  }, [formState.daySend]);

  return (
    <InlineStack gap="400" align="start">
      {/* Sidebar Section */}
      <Box width="30%">
        <SidebarSection title="Review request" description="Lorem ipsum" />
      </Box>

      {/* Main Content */}
      <Box width="60%">
        <Card>
          <BlockStack gap="300">
            <Text as="p" variant="headingSm">
              When should we send the review email?
            </Text>

            <BlockStack gap="0">
              <Text as="p" variant="bodyMd">
                After order fulfillment
              </Text>

              {DAY_OPTIONS.map(({ label, value }) => (
                <RadioButton key={value} label={label} checked={daySendValue === value} id={value} name="delay" onChange={handleDaySendChange} />
              ))}

              {daySendValue === "custom" && (
                <Box paddingBlockStart="150">
                  <InlineStack gap="150" blockAlign="center">
                    <Box maxWidth="71px">
                      <TextField
                        label="Custom day"
                        type="number"
                        labelHidden
                        maxLength={3}
                        onChange={handleCustomDayChange}
                        value={customDay}
                        autoComplete="off"
                        min={1}
                      />
                    </Box>
                    <Text as="p">days</Text>
                  </InlineStack>
                </Box>
              )}
            </BlockStack>

            <Text as="p" variant="bodySm" tone="subdued">
              We wait until your order status is{" "}
              <Text as="span" fontWeight="bold">
                Fulfilled
              </Text>{" "}
              so the customer has received the product.
            </Text>

            <Banner tone="info">
              <Text as="p" variant="bodyMd">
                Next batch of review emails will be sent on{" "}
                <Text as="span" fontWeight="bold">
                  Jul 9, 2025
                </Text>
                . View <Link url="">all batches.</Link>
              </Text>
            </Banner>
          </BlockStack>
        </Card>
      </Box>
    </InlineStack>
  );
}
