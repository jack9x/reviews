import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useLocation, useNavigate, useSubmit } from "@remix-run/react";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { Badge, BlockStack, Box, Button, ButtonGroup, Card, InlineStack, Layout, Link, Page, Select, Text } from "@shopify/polaris";
import { CompleteStep } from "app/components/onboarding/CompleteStep";
import { WelcomeStep } from "app/components/onboarding/WelcomeStep";
import { DEFAULT_EMAIL_SETTINGS } from "app/lib/helpers/email.helper";
import { DAYSEND_SELECT, DEFAULT_Onboarding_SETTINGS, ONBOARDING_TOTAL_STEPS } from "app/lib/helpers/onboarding.helper";
import { saveEmailSettings } from "app/models/email.settings.server";
import { getShopName, getThemeId, saveOnboardingSettings } from "app/models/onboarding.settings.server";
import type { EmailSettings, OnboardingSettings } from "app/models/schemas";
import { authenticate } from "app/shopify.server";
import { useCallback, useEffect, useState } from "react";

interface ActionResponse {
  success: boolean;
  message: string;
  actionType?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const shopName = (await getShopName(admin.graphql)) ?? "store_handle";
  const themeId = (await getThemeId(admin.graphql)) ?? "123456789";
  return { shopName, themeId, apiKey: process.env.SHOPIFY_API_KEY || "" };
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  const formData = Object.fromEntries(await request.formData());

  if (formData.action === "save-email-settings") {
    try {
      const { action, ...settings } = formData;
      await saveEmailSettings(admin.graphql, settings as EmailSettings);
      return { success: true, message: "Settings saved", actionType: "email" };
    } catch (error) {
      return { success: false, message: `Failed to save settings: ${error}` };
    }
  }

  if (formData.action === "save-onboarding-settings") {
    try {
      const { action, ...settings } = formData;
      await saveOnboardingSettings(admin.graphql, settings as OnboardingSettings);
      return { success: true, message: "Settings saved", actionType: "onboarding" };
    } catch (error) {
      return { success: false, message: `Failed to save settings: ${error}` };
    }
  }

  return { success: false, message: "Invalid action" };
}

export default function OnboardingPage() {
  const { shopName, themeId, apiKey } = useLoaderData<typeof loader>();
  const location = useLocation();
  const onboardingSettingsDB = location.state?.onboardingSettings ?? DEFAULT_Onboarding_SETTINGS;
  const actionData = useActionData<ActionResponse>();
  const app = useAppBridge();
  const submit = useSubmit();
  const navigate = useNavigate();

  //handle day send
  const [formEmailState, setFormEmailState] = useState(DEFAULT_EMAIL_SETTINGS);
  const [selected, setSelected] = useState(String(formEmailState.daySend));
  const handleSelectChange = (value: string) => {
    setSelected(value);
    setFormEmailState((prev) => ({ ...prev, daySend: Number(value) }));
  };
  //handle current step
  const [formOnboardingState, setFormOnboardingState] = useState(onboardingSettingsDB);
  const isLastStep = formOnboardingState.currentStep == ONBOARDING_TOTAL_STEPS;
  const [isSavingSubmit, setIsSavingSubmit] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleNext = useCallback(() => {
    if (!isLastStep) {
      setFormOnboardingState((prev: any) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  }, [isLastStep]);

  const handleSaveEmailSettings = () => {
    setIsSavingSubmit(true);
    setLastAction("save-email-settings");
    submit({ action: "save-email-settings", ...formEmailState }, { method: "post" });
  };

  const handleSaveCurrentStep = () => {
    setIsSavingSubmit(true);
    setLastAction("save-onboarding-settings");
    submit(
      {
        action: "save-onboarding-settings",
        currentStep: formOnboardingState.currentStep + 1,
      },
      { method: "post" },
    );
  };

  useEffect(() => {
    if (!actionData || isSavingSubmit === false) return;

    if (actionData.success) {
      if (actionData.actionType !== "onboarding" && lastAction !== "save-onboarding-settings") {
        setLastAction("save-onboarding-settings");
        submit(
          {
            action: "save-onboarding-settings",
            currentStep: formOnboardingState.currentStep + 1,
          },
          { method: "post" },
        );
      } else if (actionData.actionType === "onboarding" && lastAction === "save-onboarding-settings") {
        handleNext();
        setIsSavingSubmit(false);
        setLastAction(null);
      }
    } else {
      app.toast.show(actionData.message, { isError: true });
      setIsSavingSubmit(false);
      setLastAction(null);
    }
  }, [actionData, handleNext, app, submit, isSavingSubmit, formOnboardingState.currentStep, lastAction]);

  //handle render ui
  useEffect(() => {
    const imageSteps = ["/images/onboarding_step_0.svg", "/images/onboarding_step_1.svg", "/images/onboarding_step_2.svg"];
    imageSteps.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const renderStep = () => {
    if (formOnboardingState.currentStep < 0 || formOnboardingState.currentStep > ONBOARDING_TOTAL_STEPS) {
      console.error(`Invalid onboarding step: ${formOnboardingState.currentStep}. Resetting to step 0.`);
      setFormOnboardingState((prev: any) => ({ ...prev, currentStep: 0 }));
      navigate("/onboarding", {
        replace: true,
        state: { currentStep: 0 },
      });
      return null;
    }

    switch (formOnboardingState.currentStep) {
      case 0:
        return (
          <WelcomeStep
            image="/images/onboarding_step_0.svg"
            currentStep={formOnboardingState.currentStep}
            totalSteps={ONBOARDING_TOTAL_STEPS}
            handleNext={handleNext}
          />
        );
      case 1:
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">
              Add widget
            </Text>
            <Box width="400px">
              <img
                src="/images/onboarding_step_1.svg"
                alt="Onboarding illustration"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
            <Text as="p" variant="bodyMd" fontWeight="medium">
              Add{" "}
              <Link
                url={`https://admin.shopify.com/store/${shopName}/themes/${themeId}/editor?template=product&addAppBlockId=${apiKey}/seed_review&target=sectionId:product-information`}
                target="_blank"
              >
                SeedReviews widget
              </Link>{" "}
              to your theme.
            </Text>
            <InlineStack align="space-between">
              <Box>
                <Badge tone="new">{`${String(formOnboardingState.currentStep)}/${String(ONBOARDING_TOTAL_STEPS - 1)}`}</Badge>
              </Box>
              <ButtonGroup>
                <Button onClick={() => {}} accessibilityLabel="Check">
                  Check
                </Button>
                <Button
                  variant="primary"
                  loading={isSavingSubmit}
                  disabled={isSavingSubmit}
                  onClick={() => {
                    handleSaveCurrentStep();
                  }}
                  accessibilityLabel="Set up review request"
                >
                  Set up review request
                </Button>
              </ButtonGroup>
            </InlineStack>
          </BlockStack>
        );
      case 2:
        return (
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">
              Request-review email
            </Text>
            <Box width="400px">
              <img
                src="/images/onboarding_step_2.svg"
                alt="Onboarding illustration"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
            <BlockStack gap="150">
              <Text as="p" variant="bodyMd">
                Send request to customers
              </Text>
              <InlineStack gap="200" blockAlign="center">
                <Box width="97px">
                  <Select labelHidden label="Day send" options={DAYSEND_SELECT} onChange={handleSelectChange} value={selected} />
                </Box>
                <Box paddingInlineStart="050">
                  <Text as="p" variant="bodyMd">
                    after order fulfillment.
                  </Text>
                </Box>
              </InlineStack>
            </BlockStack>
            <InlineStack align="space-between">
              <Box>
                <Badge tone="new">{`${String(formOnboardingState.currentStep)}/${String(ONBOARDING_TOTAL_STEPS - 1)}`}</Badge>
              </Box>
              <Button
                variant="primary"
                loading={isSavingSubmit}
                disabled={isSavingSubmit}
                onClick={() => {
                  handleSaveEmailSettings();
                }}
                accessibilityLabel="Finish setup"
              >
                Finish setup
              </Button>
            </InlineStack>
          </BlockStack>
        );
      case ONBOARDING_TOTAL_STEPS:
        return <CompleteStep navigate={navigate} />;
    }
  };
  return (
    <Page narrowWidth>
      <TitleBar title="Onboarding" />
      <Layout>
        <Layout.Section>
          <Box width="450px">
            <Card>{renderStep()}</Card>
          </Box>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
