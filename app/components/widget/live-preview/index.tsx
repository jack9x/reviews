import { Card, BlockStack, Text, InlineStack, Button } from "@shopify/polaris";
import { DesktopIcon, MobileIcon, RefreshIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import PreviewContent from "./content";
import type { ReviewWidgetSettings } from "app/models/schemas";

export default function LivePreview({ props }: { props: { reviewWidgetSettings: ReviewWidgetSettings } }) {
  const [previewMode, setPreviewMode] = useState("desktop");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePreviewModeChange = (mode: string) => {
    setPreviewMode(mode);
    setIsRefreshing(false); // Reset refresh state when changing mode
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text variant="headingMd" as="h2">
            Live preview
          </Text>
          <InlineStack gap="200">
            <Button icon={RefreshIcon} accessibilityLabel="Refresh preview" variant={isRefreshing ? "primary" : "tertiary"} onClick={handleRefresh} />
            <Button
              icon={DesktopIcon}
              accessibilityLabel="Desktop preview"
              variant={previewMode === "desktop" && !isRefreshing ? "primary" : "tertiary"}
              onClick={() => handlePreviewModeChange("desktop")}
            />
            <Button
              icon={MobileIcon}
              accessibilityLabel="Mobile preview"
              variant={previewMode === "mobile" && !isRefreshing ? "primary" : "tertiary"}
              onClick={() => handlePreviewModeChange("mobile")}
            />
          </InlineStack>
        </InlineStack>
        <PreviewContent mode={previewMode as "desktop" | "mobile"} reviewWidgetSettings={props.reviewWidgetSettings} />
      </BlockStack>
    </Card>
  );
}
