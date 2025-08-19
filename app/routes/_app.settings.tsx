import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { SaveBar, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { Banner, BlockStack, Box, Card, InlineStack, Link, Page, RadioButton, Text, TextField } from "@shopify/polaris";
import { authenticate } from "app/shopify.server";
import type { EmailSettings } from "app/models/schemas";
import { useEffect, useState } from "react";
import { getEmailSettings, saveEmailSettings } from "app/models/email.settings.server";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";

import { DEFAULT_EMAIL_SETTINGS, getDaySendState, useFormChangeHandler } from "app/lib/helpers/email.helper";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const emailSettings = (await getEmailSettings(admin.graphql)) ?? DEFAULT_EMAIL_SETTINGS;
  return { emailSettings };
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const formData = Object.fromEntries(await request.formData());
  if (formData.action === "save-email-settings") {
    try {
      const { action, ...settings } = formData;
      await saveEmailSettings(admin.graphql, settings as EmailSettings);
      return { success: true, message: "Settings saved" };
    } catch (error) {
      return { success: false, message: `Failed to save settings: ${error}` };
    }
  }

  return { success: false, message: "Invalid action" };
}

export default function SettingsPage() {
  const { emailSettings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const app = useAppBridge();
  const submit = useSubmit();
  const navigation = useNavigation();
  const { formState, onChange, discard, saveSuccess } = useFormChangeHandler({
    initialValues: emailSettings,
  });
  const [hasHandledSuccess, setHasHandledSuccess] = useState(false);
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
    const { daySendValue, customDay } = getDaySendState(formState.daySend || 5);
    setDaySendValue(daySendValue);
    setCustomDay(customDay);
  }, [formState.daySend]);

  // handle Save setting
  const isSavingSettings = navigation.state === "submitting" && navigation.formData?.get("action") === "save-email-settings";
  const handleSaveSettings = () => {
    submit({ action: "save-email-settings", ...formState }, { method: "post" });
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
    <Page title="Review request">
      <TitleBar title="Settings" />
      <SaveBar id="settings-save-bar">
        <button variant="primary" disabled={isSavingSettings} onClick={handleSaveSettings}></button>
        <button onClick={discard}></button>
      </SaveBar>
      <InlineStack>
        <Card>
          <BlockStack gap="300">
            <Text as="p" variant="headingSm">
              When should we send the review email?
            </Text>
            <BlockStack gap="0">
              <Text as="p" variant="bodyMd">
                After order fulfillment
              </Text>
              <RadioButton label="5 days (recommended)" checked={daySendValue === "5"} id="5" name="delay" onChange={handleDaySendChange} />
              <RadioButton label="7 days" checked={daySendValue === "7"} id="7" name="delay" onChange={handleDaySendChange} />
              <RadioButton label="14 days" checked={daySendValue === "14"} id="14" name="delay" onChange={handleDaySendChange} />
              <RadioButton label="Custom" checked={daySendValue === "custom"} id="custom" name="delay" onChange={handleDaySendChange} />
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
                .View <Link url="">all batches.</Link>
              </Text>
            </Banner>
          </BlockStack>
        </Card>
      </InlineStack>
    </Page>
  );
}
