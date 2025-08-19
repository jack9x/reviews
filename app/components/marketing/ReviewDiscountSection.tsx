import { BlockStack, Box, Button, Card, Grid, InlineGrid, InlineStack, RadioButton, Select, Text } from "@shopify/polaris";
import { SidebarSection } from "app/components/marketing/SidebarSection";

import NewDiscountModal from "app/components/marketing/NewDiscountModal";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import type { DiscountOption } from "app/types/discount";

const DISCOUNT_RATING_OPTIONS = [
  { label: "5★ rating", value: "5_star" },
  { label: "Any rating", value: "any" },
];

interface ReviewDiscountSectionProps {
  formState: { [key: string]: string | boolean };
  onChange: (key: string, value: string | boolean) => void;
  discounts: DiscountOption[];
}

export function ReviewDiscountSection({ formState, onChange, discounts }: ReviewDiscountSectionProps) {
  const app = useAppBridge();
  const [discountOptions, setDiscountOptions] = useState<DiscountOption[]>([]);
  useEffect(() => {
    setDiscountOptions(discounts);
  }, [discounts]);
  return (
    <InlineStack gap="400" align="start">
      <Box width="30%">
        <SidebarSection title="Review discount" description="Lorem ipsum" />
      </Box>
      <Box width="60%">
        <Card>
          <BlockStack gap="300">
            <Text as="p" variant="headingSm">
              Customers receive discount when?
            </Text>
            <Box>
              <Text as="p">Leave a review</Text>
              <InlineGrid gap="0" columns={{ xs: 2, md: 4, lg: 5 }}>
                {DISCOUNT_RATING_OPTIONS.map(({ label, value }) => (
                  <RadioButton
                    key={value}
                    label={label}
                    checked={formState.reviewDiscountWhen === value}
                    id={value}
                    name="rating"
                    onChange={() => onChange("reviewDiscountWhen", value as "5_star" | "any")}
                  />
                ))}
              </InlineGrid>
            </Box>
            <BlockStack gap="200">
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, md: 3, lg: 6, xl: 6 }}>
                  <Select
                    label={
                      <Text as="h2" variant="headingSm">
                        Discount they will receive?
                      </Text>
                    }
                    options={discountOptions}
                    onChange={(discountId) => onChange("reviewDiscountCode", discountId)}
                    value={formState.reviewDiscountCode as string}
                  />
                  <NewDiscountModal
                    onDiscountCreated={(discountId, discountCode) => {
                      onChange("reviewDiscountCode", discountId);
                      setDiscountOptions([...discountOptions, { label: discountCode, value: discountId }]);
                      app.toast.show("Discount created");
                    }}
                  />
                </Grid.Cell>
              </Grid>
              <Box paddingBlockStart="200" width="400px">
                <Button onClick={() => {}}>Generate new flow</Button>
              </Box>
            </BlockStack>
          </BlockStack>
        </Card>
      </Box>
    </InlineStack>
  );
}
