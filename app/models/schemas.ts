import { z } from "zod";

const reviewStatusSchema = z.enum(["pending", "approved", "denied", "spam"]);

export const reviewSchema = z.object({
  id: z.string().min(1),
  handle: z.string(),
  rating: z.number().min(1.0).max(5.0),
  status: reviewStatusSchema,
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  merchantReply: z.string().optional(),
  shop: z.string().min(1),
  productId: z.string().min(1),
  orderId: z.string().optional(),
  authorId: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().min(1),
  submittedAt: z.date(),
});

export const reviewCreateSchema = reviewSchema.pick({
  rating: true,
  title: true,
  body: true,
  shop: true,
  productId: true,
  authorId: true,
  fullName: true,
  email: true,
});

// Review Widget Settings
export const reviewWidgetSettingsSchema = z.object({
  layout: z.enum(["grid", "list"]),
  allowMedia: z.boolean(),
  mediaSize: z.enum(["thumbnail", "medium", "large"]),
  showSummary: z.boolean(),
});

// Email Settings
export const emailSettingsSchema = z.object({
  daySend: z.number().min(1).max(30).optional(),
  emailSubject: z.string().optional(),
  emailHeading: z.string().optional(),
  emailContent: z.string().optional(),
  emailFooter: z.string().optional(),
  reviewDiscountWhen: z.enum(["5_star", "any"]).optional(),
  reviewDiscountCode: z.string().optional(),
  emailSubjectDiscount: z.string().optional(),
  emailHeadingDiscount: z.string().optional(),
  emailContentDiscount: z.string().optional(),
  emailFooterDiscount: z.string().optional(),
});

// Onboarding Settings
export const onboardingSettingsSchema = z.object({
  currentStep: z.number().optional(),
});
export const shopNameSchema = z.string();
export const themeIdSchema = z.string();

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ReviewWidgetSettings = z.infer<typeof reviewWidgetSettingsSchema>;
export type EmailSettings = z.infer<typeof emailSettingsSchema>;
export type OnboardingSettings = z.infer<typeof onboardingSettingsSchema>;
export type ShopName = z.infer<typeof shopNameSchema>;
export type ThemeId = z.infer<typeof themeIdSchema>;
