import { useState, useEffect } from "react";
import { SaveBar, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { Page, Box } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getEmailSettings, saveEmailSettings } from "../models/email.settings.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";

import type { EmailSettings } from "app/models/schemas";
import { EmailSection } from "app/components/email/EmailSection";
import { DEFAULT_EMAIL_SETTINGS, useFormChangeHandler } from "app/lib/helpers/email.helper";
import { ShopContext } from "app/contexts/ShopContext";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  return {
    shopDomain: session.shop,
    emailSettings: (await getEmailSettings(admin.graphql)) ?? DEFAULT_EMAIL_SETTINGS,
  };
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

export default function EmailTemplatesPage() {
  const { emailSettings, shopDomain } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const { state, formData } = useNavigation();
  const app = useAppBridge();
  const { formState, setFormState, discard, saveSuccess } = useFormChangeHandler({
    initialValues: emailSettings,
  });
  const [hasHandledSuccess, setHasHandledSuccess] = useState(false);

  const isSaving = state === "submitting" && formData?.get("action") === "save-email-settings";

  const handleSave = () => submit({ action: "save-email-settings", ...formState }, { method: "post" });

  //handle show Toast
  useEffect(() => {
    if (actionData?.success) {
      if (state === "idle" && !hasHandledSuccess) {
        app.toast.show(actionData.message);
        saveSuccess();
        setHasHandledSuccess(true);
      }
    } else if (actionData?.success === false) {
      app.toast.show(actionData.message, { isError: true });
      setHasHandledSuccess(false);
    }
  }, [actionData, state, app, saveSuccess, hasHandledSuccess]);

  useEffect(() => {
    if (isSaving) {
      setHasHandledSuccess(false);
    }
  }, [isSaving]);

  return (
    <ShopContext.Provider value={{ shopDomain }}>
      <TitleBar title="Email templates" />
      <SaveBar id="settings-save-bar">
        <button variant="primary" loading={isSaving} disabled={isSaving} onClick={handleSave}></button>
        <button onClick={discard}></button>
      </SaveBar>
      {/* <Page title="Email templates" primaryAction={{ content: "Save settings", loading: isSaving, disabled: isSaving, onAction: handleSave }}> */}
      <Page>
        <Box padding="0">
          <EmailSection emailSettings={formState} setFormState={setFormState} />
        </Box>
      </Page>
    </ShopContext.Provider>
  );
}
