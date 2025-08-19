import { Box, Text } from "@shopify/polaris";

export function SidebarSection({ title, description }: { title: string; description: string }) {
  return (
    <Box minWidth="200px">
      <Text as="h2" variant="headingMd">
        {title}
      </Text>
      <Text as="p" tone="subdued">
        {description}
      </Text>
    </Box>
  );
}
