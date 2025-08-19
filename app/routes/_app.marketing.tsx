import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { SaveBar, TitleBar, useAppBridge } from "@shopify/app-bridge-react";

import { BlockStack, Page } from "@shopify/polaris";
import { authenticate } from "app/shopify.server";
import type { EmailSettings } from "app/models/schemas";
import { useEffect, useState } from "react";
import { getEmailSettings, saveEmailSettings } from "app/models/email.settings.server";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";

import { DEFAULT_EMAIL_SETTINGS, useFormChangeHandler } from "app/lib/helpers/email.helper";

import { fetchActiveOrScheduledCodeDiscounts } from "app/lib/helpers/discount.helper";

import { getAllDiscounts } from "app/models/discount.server";
import { ReviewDiscountSection } from "app/components/marketing/ReviewDiscountSection";
import { ReviewRequestSection } from "app/components/marketing/ReviewRequestSection";
import type { DiscountOption } from "app/types/discount";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const emailSettings = (await getEmailSettings(admin.graphql)) ?? DEFAULT_EMAIL_SETTINGS;
  const discountNodes = await getAllDiscounts(admin.graphql);
  const activeOrScheduledCodeDiscounts = fetchActiveOrScheduledCodeDiscounts(discountNodes || []);
  const discounts = [
    { label: "Select a discount code", value: "" },
    ...activeOrScheduledCodeDiscounts.map(({ node }) => {
      const { title } = node.discount;
      return {
        label: title,
        value: node.id,
      };
    }),
  ];
  return { emailSettings, discounts };
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

export default function MarketingPage() {
  const { emailSettings, discounts } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const app = useAppBridge();
  const submit = useSubmit();
  const navigation = useNavigation();
  const { formState, onChange, discard, saveSuccess } = useFormChangeHandler({
    initialValues: emailSettings,
  });
  const [hasHandledSuccess, setHasHandledSuccess] = useState(false);

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
    <Page title="Marketing">
      <TitleBar title="Marketing" />
      <SaveBar id="settings-save-bar">
        <button variant="primary" disabled={isSavingSettings} onClick={handleSaveSettings}></button>
        <button onClick={discard}></button>
      </SaveBar>
      <BlockStack gap="800">
        <ReviewRequestSection
          formState={formState as { [key: string]: string | boolean }}
          onChange={onChange as (key: keyof EmailSettings, value: number | string) => void}
        />
        <ReviewDiscountSection
          formState={formState as { [key: string]: string | boolean }}
          onChange={onChange as (key: string, value: string | boolean) => void}
          discounts={discounts as DiscountOption[]}
        />
      </BlockStack>
    </Page>
  );
}
