import { TitleBar } from "@shopify/app-bridge-react";
import { BlockStack, Button, Card, InlineStack, Layout, Page, Text } from "@shopify/polaris";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { registerOrderFulfilledWebhook } from "app/webhooks/register.server";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  if (process.env.NODE_ENV === "development") {
    try {
      await registerOrderFulfilledWebhook(admin as AdminApiContext, session);
      console.log("Webhook has been registered or updated.");
    } catch (err) {
      console.error("Error registering webhook:", err);
    }
  }

  return null;
};

export default function DashboardPage() {
  return (
    <Page>
      <TitleBar title="Dashboard" />
      <Layout>
        <Layout.Section>
          <Card roundedAbove="sm">
            <BlockStack gap="200">
              <Text as="h2" variant="headingLg">
                Welcome to SeedReviews!
              </Text>
              <Text as="p" variant="bodyMd">
                Get reviews live in 1 minute.
              </Text>
              <InlineStack align="end">
                <Button variant="primary" onClick={() => {}} accessibilityLabel="Create shipping label">
                  Add widget
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
