import { onboardingSettingsSchema, type OnboardingSettings } from "app/models/schemas";

export const DEFAULT_Onboarding_SETTINGS: OnboardingSettings = {
  currentStep: 0,
};
export const ONBOARDING_TOTAL_STEPS = 3;
export const DAYSEND_SELECT = [
  { label: "3 days", value: "3" },
  { label: "5 days", value: "5" },
  { label: "7 days", value: "7" },
  { label: "14 days", value: "14" },
];

export function buildMetaobjectOnboardingSettingsFields(settings: OnboardingSettings): { key: string; value: string }[] {
  return Object.entries(settings)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => ({
      key,
      value: String(value),
    }));
}

export function transformMetaobjectToOnboardingSettings(metaobject: any): OnboardingSettings {
  const fieldsObj = metaobject.fields.reduce((acc: any, field: any) => {
    if (!field.value) return acc;

    acc[field.key] = field.value;
    return acc;
  }, {});

  if (fieldsObj.currentStep !== undefined) {
    fieldsObj.currentStep = Number(fieldsObj.currentStep);
  }

  return onboardingSettingsSchema.parse(fieldsObj);
}

export function extractNumericId(gid: string): string | null {
  const match = gid.match(/\d+$/);
  return match ? match[0] : null;
}
