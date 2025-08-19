import { BlockStack, Button, Text } from "@shopify/polaris";

interface CompleteStepProps {
  navigate: (path: string) => void;
}

export function CompleteStep({ navigate }: CompleteStepProps) {
  return (
    <BlockStack gap="400" align="center">
      <Text as="h2" variant="headingLg">
        You’re ready to collect reviews! 🎉
      </Text>
      <Text as="p" variant="bodyMd">
        We’ll handle the tech. You focus on selling.
      </Text>
      <Button variant="primary" onClick={() => navigate("/")} accessibilityLabel="View dashboard">
        View dashboard
      </Button>
    </BlockStack>
  );
}
