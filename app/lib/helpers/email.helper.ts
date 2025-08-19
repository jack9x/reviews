import { useAppBridge } from "@shopify/app-bridge-react";
import { emailSettingsSchema, type EmailSettings } from "app/models/schemas";
import type { DiscountNode } from "app/types/discount";
import { useEffect, useRef, useState } from "react";

type UseFormChangeHandlerProps<T> = {
  initialValues: T;
  saveBarId?: string;
};

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  daySend: 5,
  emailSubject: "Reminder email for you",
  emailHeading: "What did you think?",
  emailContent: "<p>Hi {customer_name}, We want to check in and see how you are enjoying your shopping at {site_title} {review_products}</p>",
  emailFooter: "{site_title} — Built with YayReviews",
  reviewDiscountWhen: "5_star",
  reviewDiscountCode: "",
  emailSubjectDiscount: "Reward for you",
  emailHeadingDiscount: "Thank you for your review",
  emailContentDiscount:
    "<p>Thank you for reviewing {product_name}! As a token of our appreciation, we'd like to offer you a {discount_code} discount on your next purchase.</p>",
  emailFooterDiscount: "{site_title} — Built with YayReviews",
};

export const EmailContents = ["emailContent", "emailContentDiscount"];

export function convertToRichTextFormat(value: string): string {
  const richTextValue = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: value,
          },
        ],
      },
    ],
  };
  return JSON.stringify(richTextValue);
}

export function buildMetaobjectEmailSettingsFields(settings: EmailSettings): { key: string; value: string }[] {
  return Object.entries(settings)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (EmailContents.includes(key) && typeof value === "string") {
        const richTextValue = convertToRichTextFormat(value);
        return { key, value: richTextValue };
      }
      return { key, value: String(value) };
    });
}

export function transformMetaobjectToEmailSettings(metaobject: any): EmailSettings {
  const fieldsObj = metaobject.fields.reduce((acc: any, field: any) => {
    if (!field.value) return acc;
    if (EmailContents.includes(field.key) && field.value) {
      try {
        const parsed = JSON.parse(field.value);
        acc[field.key] = parsed.children?.[0]?.children?.[0]?.value || "";
      } catch (e) {
        acc[field.key] = field.value;
      }
    } else {
      acc[field.key] = field.value;
    }
    return acc;
  }, {});

  if (fieldsObj.daySend !== undefined) {
    fieldsObj.daySend = Number(fieldsObj.daySend);
  }

  return emailSettingsSchema.parse(fieldsObj);
}

const presets = [5, 7, 14];

export function getDaySendState(daySend: number) {
  const isPreset = presets.includes(daySend);
  return {
    daySendValue: isPreset ? String(daySend) : "custom",
    customDay: isPreset ? "" : String(daySend),
  };
}

export function useFormChangeHandler<T extends object>({ initialValues, saveBarId = "settings-save-bar" }: UseFormChangeHandlerProps<T>) {
  const app = useAppBridge();
  const [formState, setFormState] = useState<T>(initialValues);
  const [formIsDirty, setFormIsDirty] = useState(false);
  const initialRef = useRef<T>(structuredClone(initialValues));

  useEffect(() => {
    setFormState(initialValues);
    initialRef.current = structuredClone(initialValues);
    setFormIsDirty(false);
  }, [initialValues]);

  useEffect(() => {
    const isChanged = JSON.stringify(formState) !== JSON.stringify(initialRef.current);
    setFormIsDirty(isChanged);
    // console.log("formState changed?", isChanged);
    // console.log("current", formState);
    // console.log("initial", initialRef.current);
  }, [formState]);

  useEffect(() => {
    formIsDirty ? app.saveBar.show(saveBarId) : app.saveBar.hide(saveBarId);
  }, [formIsDirty, app, saveBarId]);

  const onChange = <K extends keyof T>(key: K, value: T[K]) => setFormState((prev) => ({ ...prev, [key]: value }));

  const discard = () => {
    setFormState(initialRef.current);
    setFormIsDirty(false);
  };

  const saveSuccess = (newValues?: T) => {
    const data = structuredClone(newValues ?? formState);
    initialRef.current = data;
    setFormState(data);
    setFormIsDirty(false);
  };

  return { formState, setFormState, onChange, formIsDirty, discard, saveSuccess };
}

export function getProductReviewSectionHTML(shopDomain: string, mode: "desktop" | "mobile") {
  const leaveReviewButton = `
    <a
      href="#leave-review"
      style="
        background: #000;
        color: #fff;
        padding: 8px 10px;
        text-decoration: none;
        border-radius: 8px;
        font-size: 0.8rem;
        display: inline-block;
        font-weight: 500;
      "
    >
      Leave a review
    </a>
  `;

  let productSectionHTML = "";

  [1, 2].forEach(() => {
    productSectionHTML += `
      <table cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #eee; border-radius: 8px; margin-bottom: 16px; max-width: 400px; width: 100%;">
        <tr>
          <td style="padding: 12px 5px; width: 60px;">
            <img src="/images/product-review.svg" alt="T-neck" width="60" height="60" style="display: block; border-radius: 6px;" />
          </td>

          <td style="padding: ${mode === "desktop" ? "5px" : "18px"}; vertical-align: middle;">
            <div style="font-weight: normal; font-size: 1rem;">T-neck</div>
            <div style="color: #FFAC70; font-size: 0.9rem; margin-top: 4px;">★★★★★</div>
            ${mode === "mobile" ? `<div style="margin: 5px 0px;">${leaveReviewButton}</div>` : ""}
          </td>

          ${
            mode === "desktop"
              ? `<td style="padding: 12px 7px; text-align: right; vertical-align: middle; width: 140px;">${leaveReviewButton}</td>`
              : ""
          }
        </tr>
      </table>
    `;
  });

  return productSectionHTML;
}

export function getDiscountSectionHTML(shopDomain: string, discountDetail: DiscountNode, mode: "desktop" | "mobile") {
  const summary = discountDetail?.discount?.summary || "Discount value";
  const code = discountDetail?.discount?.codes?.edges?.[0]?.node?.code || "";
  const hasDiscount = !!code;

  return `
<div>
  <div>
    <div>
      <div style="margin-top:20px;font-size:1.3rem;line-height:1.25;${!hasDiscount ? "border:1px dashed #ccc;" : ""}">
        <p style="margin:0;">${summary}</p>
      </div>
      <div style="margin-top:20px;font-size:0.95rem;line-height:1.5;${!hasDiscount ? "border:1px dashed #ccc;" : ""}">
        ${
          hasDiscount
            ? `<p style="margin:0;">Use code: <strong>${code}</strong> at checkout, or click the link below to automatically apply the discount to your order.</p>`
            : `<p style="margin:0;">Select a discount to feature.</p>`
        }
      </div>
    </div>
  </div>
  <div>
    <a
      style="padding:15px 20px;text-align:center;text-decoration:none;border-radius:8px;width:200px;word-break:break-word;background-color:#6366F1;color:#fff;display:block;margin:20px 0px;font-size:1rem;font-weight:bold;"
      href="${hasDiscount ? `https://${shopDomain}/discount/${code}?redirect=/cart` : ""}"
      target="_blank"
      rel="noreferrer"
    >
      Apply discount
    </a>
  </div>
</div>
  `.trim();
}
