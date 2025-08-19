import { BlockStack, Box, Button, Badge, Text, InlineStack } from "@shopify/polaris";

interface WelcomeStepProps {
  currentStep: number;
  totalSteps: number;
  image?: string;
  handleNext: () => void;
}

export function WelcomeStep({ currentStep, totalSteps, image, handleNext }: WelcomeStepProps) {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingLg">
        Welcome to SeedReviews! 🌱
      </Text>
      <Box width="400px">
        <img
          src={image}
          alt="Onboarding illustration"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>
      <Text as="p" variant="bodyMd">
        Get reviews live in 1 minutes.
      </Text>
      <InlineStack align="space-between">
        <Box>
          <Badge tone="new">{`${String(currentStep)}/${String(totalSteps - 1)}`}</Badge>
        </Box>
        <Button variant="primary" onClick={handleNext} accessibilityLabel="Add Widget">
          Add widget
        </Button>
      </InlineStack>
    </BlockStack>
  );
}
