import { SaveBar, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { CalloutCard, BlockStack, Card, InlineStack, Layout, Page, Text, Checkbox, Select, Box, Grid, Divider } from "@shopify/polaris";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import LivePreview from "../components/widget/live-preview";
import { authenticate } from "app/shopify.server";
import { getReviewWidgetSettings, saveReviewWidgetSettings } from "app/models/wiget.settings.server";
import type { ReviewWidgetSettings } from "app/models/schemas";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFormChangeHandler } from "app/lib/helpers/email.helper";

const DEFAULT_REVIEW_WIDGET_SETTINGS: ReviewWidgetSettings = {
  layout: "grid",
  allowMedia: true,
  mediaSize: "thumbnail",
  showSummary: true,
};

const PHOTO_SIZE_OPTIONS = [
  { label: "Thumbnail", value: "thumbnail" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const LAYOUT_STYLES = ["grid", "list"] as const;

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const reviewWidgetSettings = (await getReviewWidgetSettings(admin.graphql)) ?? DEFAULT_REVIEW_WIDGET_SETTINGS;
  return { reviewWidgetSettings };
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  const formData = await request.formData();
  const data = {
    ...Object.fromEntries(formData),
    shop,
    allowMedia: formData.get("allowMedia") === "true",
    showSummary: formData.get("showSummary") === "true",
  };

  if (data && "action" in data && data.action === "save-settings") {
    try {
      // shopify.toast.show('Settings saved');
      await saveReviewWidgetSettings(admin.graphql, data as unknown as ReviewWidgetSettings);
      return { success: true, message: `Settings saved` };
    } catch (error) {
      return { success: false, message: `Failed to save settings: ${error}` };
    }
  }

  return { success: false, message: "Invalid action" };
}

export default function WidgetCustomizePage() {
  const { reviewWidgetSettings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const app = useAppBridge();
  const { formState, onChange, discard, saveSuccess } = useFormChangeHandler({
    initialValues: reviewWidgetSettings,
  });
  const [hasHandledSuccess, setHasHandledSuccess] = useState(false);

  const isSavingSettings = navigation.state === "submitting" && navigation.formData?.get("action") === "save-settings";

  const handleSaveSettings = () => {
    submit(
      {
        action: "save-settings",
        layout: formState.layout,
        allowMedia: formState.allowMedia,
        mediaSize: formState.mediaSize,
        showSummary: formState.showSummary,
      },
      { method: "post" },
    );
  };

  const handleLayoutChange = (layout: "grid" | "list") => {
    onChange("layout", layout);
  };

  const handleAllowMediaChange = () => {
    onChange("allowMedia", !formState.allowMedia);
  };

  const handleMediaSizeChange = (value: "thumbnail" | "medium" | "large") => {
    onChange("mediaSize", value);
  };

  const handleShowSummaryChange = () => {
    onChange("showSummary", !formState.showSummary);
  };

  //handle show Toast
  useEffect(() => {
    if (actionData?.success) {
      if (navigation.state === "idle" && !hasHandledSuccess) {
        app.toast.show(actionData.message);
        saveSuccess();
        setHasHandledSuccess(true);
      }
    } else if (actionData?.success === false) {
      app.toast.show(actionData.message, { isError: true });
      setHasHandledSuccess(false);
    }
  }, [actionData, navigation, app, saveSuccess, hasHandledSuccess]);

  useEffect(() => {
    if (isSavingSettings) {
      setHasHandledSuccess(false);
    }
  }, [isSavingSettings]);

  return (
    <>
      <TitleBar title="Widget customization"></TitleBar>
      <Page
        title="Widget customization"
        primaryAction={{
          content: "Save settings",
          loading: isSavingSettings,
          disabled: isSavingSettings,
          onAction: handleSaveSettings,
        }}
      >
        <SaveBar id="settings-save-bar">
          <button variant="primary" loading={isSavingSettings} disabled={isSavingSettings} onClick={handleSaveSettings}></button>
          <button onClick={discard}></button>
        </SaveBar>
        <Box paddingBlock="500">
          <Layout>
            <Layout.Section variant="fullWidth">
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 4 }}>
                  {/* Review Widget Card */}
                  <CalloutCard
                    title={
                      <Text variant="headingMd" as="h2">
                        Review widget
                      </Text>
                    }
                    illustration="/images/review_preview.svg"
                    primaryAction={{
                      content: "Customize",
                      url: "#",
                    }}
                  >
                    <p>Added to your theme.</p>
                  </CalloutCard>
                </Grid.Cell>
              </Grid>
            </Layout.Section>
          </Layout>
          {/* Settings */}
          <Box paddingBlock="300">
            <Box paddingBlockStart="400">
              <Text variant="headingMd" as="h2">
                Settings
              </Text>
            </Box>
          </Box>
          <Layout>
            <Layout.Section variant="oneThird">
              <Card>
                {/* Layout Card */}
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    Layout
                  </Text>
                  <InlineStack gap="200">
                    {LAYOUT_STYLES.map((layoutStyle) => (
                      <div
                        key={layoutStyle}
                        style={{
                          backgroundColor: "#E3E3E3",
                          padding: "16px",
                          borderRadius: "8px",
                          border: formState.layout === layoutStyle ? "2px solid #0284c7" : "1px solid #e2e8f0",
                          width: "48%",
                          height: "85px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        onClick={() => handleLayoutChange(layoutStyle as "grid" | "list")}
                      >
                        <Box padding="100">
                          <Text as="p" variant="bodyMd" fontWeight="bold" tone="subdued">
                            {layoutStyle === "grid" ? "Grid" : "List"}
                          </Text>
                        </Box>
                      </div>
                    ))}
                  </InlineStack>
                </BlockStack>
                <Box paddingBlock="400">
                  <Divider borderColor="border" />
                </Box>

                {/* Media Card */}
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    Media
                  </Text>
                  <Checkbox
                    label="Allow customers to attach photos/videos"
                    checked={formState.allowMedia}
                    onChange={handleAllowMediaChange}
                    helpText="Increases trust but requires extra storage and moderation."
                  />
                  <Select label="Photo/video size" options={PHOTO_SIZE_OPTIONS} value={formState.mediaSize} onChange={handleMediaSizeChange} />
                </BlockStack>
                <Box paddingBlock="400">
                  <Divider borderColor="border" />
                </Box>
                {/* Reviews Summary Card */}
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    Reviews summary
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Show an aggregate snapshot of your product's reviews
                  </Text>
                  <InlineStack align="space-between">
                    <Checkbox label="Show summary" checked={formState.showSummary} onChange={handleShowSummaryChange} />
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>
            <Layout.Section>
              {/* Live Preview */}
              <LivePreview props={{ reviewWidgetSettings: formState }} />
            </Layout.Section>
          </Layout>
        </Box>
      </Page>
    </>
  );
}
