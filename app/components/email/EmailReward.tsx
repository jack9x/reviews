import { Card, Layout } from "@shopify/polaris";
import { useEffect, useState } from "react";
import { EmailTemplateForm } from "./common/EmailTemplateForm";
import { EmailTemplatePreview } from "./common/EmailTemplatePreview";
import type { EmailSectionProps } from "./EmailSection";
import { getDiscountSectionHTML } from "app/lib/helpers/email.helper";
import type { DiscountNode } from "app/types/discount";
import { useShopDomain } from "app/contexts/ShopContext";

export function EmailReward({ emailSettings, setFormState }: EmailSectionProps) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const shopDomain = useShopDomain();
  const { reviewDiscountCode } = emailSettings;
  const [discountDetail, setDiscountDetail] = useState<DiscountNode | null>(null);
  useEffect(() => {
    async function fetchDiscount() {
      const res = await fetch("/api/get-discount", {
        method: "POST",
        body: JSON.stringify({ codeId: reviewDiscountCode }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setDiscountDetail(data.discount as DiscountNode);
    }

    fetchDiscount();
  }, [reviewDiscountCode]);
  return (
    <Card>
      <Layout>
        <Layout.Section variant="oneThird">
          <EmailTemplateForm
            emailSettings={emailSettings}
            setFormState={setFormState}
            settingsKeys={{
              subject: "emailSubjectDiscount",
              heading: "emailHeadingDiscount",
              content: "emailContentDiscount",
              footer: "emailFooterDiscount",
            }}
            placeholders={[
              "{customer_name} - Customer's name",
              "{site_title} - Your site title",
              "{product_name} - Product name",
              "{discount_code} - Discount code",
              "{discount} - Discount section",
              "{discount_value} - Discount value",
            ]}
          />
        </Layout.Section>
        <Layout.Section>
          <EmailTemplatePreview
            mode={mode}
            setMode={setMode}
            emailSettings={emailSettings}
            settingsKeys={{
              subject: "emailSubjectDiscount",
              heading: "emailHeadingDiscount",
              content: "emailContentDiscount",
              footer: "emailFooterDiscount",
            }}
            replaceTokens={(content) =>
              content
                ?.replace("{customer_name}", "John Doe")
                .replace("{site_title}", "Demo Store")
                .replace("{product_name}", "T-neck")
                .replace("{discount_code}", "10% OFF")
                .replace("{discount}", getDiscountSectionHTML(shopDomain, discountDetail || ({} as DiscountNode), mode)) || ""
            }
          />
        </Layout.Section>
      </Layout>
    </Card>
  );
}
