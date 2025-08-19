import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { TitleBar } from "@shopify/app-bridge-react";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { authenticate } from "../../shopify.server";
import { getReviews, fake10Reviews, getProductThumbnail, getCustomerInfo, updateReviewStatus } from "app/models/review.server";
import { BlockStack, Box, Button, Card, InlineStack, Layout, Page, Text } from "@shopify/polaris";
import ReviewIndexTable from "../../components/ReviewIndexTable";

export interface ActionData {
  success: boolean;
  message: string;
}
export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  const reviews = (await getReviews(admin.graphql)) ?? [];
  const thumbnails: Record<string, string> = {};
  const customers: Record<string, { firstName: string; lastName: string; emailAddress: string }> = {};

  for (const review of reviews) {
    thumbnails[review.productId] = await getProductThumbnail(admin.graphql, review.productId);
    customers[review.authorId] = await getCustomerInfo(admin.graphql, review.authorId);
  }

  return { reviews, thumbnails, customers };
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create-fake-reviews") {
    try {
      await fake10Reviews(admin.graphql);
      return { success: true, message: `Created 10 fake reviews` };
    } catch (error) {
      console.error("Failed to create fake reviews:", error);
      return { success: false, message: "Failed to create fake reviews" };
    }
  }

  if (intent === "update-status") {
    const status = formData.get("status") as "approved" | "denied" | "spam";
    const reviewIds = formData.getAll("reviewIds") as string[];

    if (!reviewIds.length || !status) {
      return { success: false, message: "Missing reviewIds or status" };
    }

    try {
      await Promise.all(reviewIds.map((id) => updateReviewStatus(admin.graphql, id, status)));
      return { success: true, message: `Updated ${reviewIds.length} reviews to ${status}` };
    } catch (error) {
      console.error("Failed to update status:", error);
      return { success: false, message: "Failed to update status" };
    }
  }
}

export default function ReviewsPage() {
  const { reviews, thumbnails, customers } = useLoaderData<typeof loader>();
  const parsedReviews = reviews.map((r) => ({
    ...r,
    submittedAt: new Date(r.submittedAt),
  }));

  const navigation = useNavigation();
  const isCreatingReviews = navigation.state === "submitting" && navigation.formData?.get("intent") === "create-fake-reviews";

  return (
    <Page fullWidth title="Review Managements">
      <TitleBar title="Reviews" />
      <Layout>
        <Layout.Section>
          <Box paddingBlockStart="200">
            {reviews.length == 0 && (
              <Card roundedAbove="sm">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    Review Count: {reviews.length}
                  </Text>

                  <InlineStack align="end">
                    <Form method="post">
                      <input type="hidden" name="intent" value="create-fake-reviews" />
                      <Button variant="primary" submit loading={isCreatingReviews} accessibilityLabel="Create fake reviews">
                        {isCreatingReviews ? "Creating..." : "Create Fake Reviews"}
                      </Button>
                    </Form>
                  </InlineStack>
                </BlockStack>
              </Card>
            )}
            {reviews.length > 0 && <ReviewIndexTable data={parsedReviews} thumbnails={thumbnails} customers={customers}></ReviewIndexTable>}
          </Box>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
