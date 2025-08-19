import { Card, Layout } from "@shopify/polaris";
import { useState } from "react";
import { EmailTemplateForm } from "./common/EmailTemplateForm";
import { EmailTemplatePreview } from "./common/EmailTemplatePreview";
import type { EmailSectionProps } from "./EmailSection";
import { getProductReviewSectionHTML } from "app/lib/helpers/email.helper";
import { useShopDomain } from "app/contexts/ShopContext";

export function EmailReminder({ emailSettings, setFormState }: EmailSectionProps) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const shopDomain = useShopDomain();
  return (
    <Card>
      <Layout>
        <Layout.Section variant="oneThird">
          <EmailTemplateForm
            emailSettings={emailSettings}
            setFormState={setFormState}
            settingsKeys={{
              subject: "emailSubject",
              heading: "emailHeading",
              content: "emailContent",
              footer: "emailFooter",
            }}
            placeholders={["{customer_name} - Customer's name", "{site_title} - Your site title", "{review_products} - List products need review"]}
          />
        </Layout.Section>
        <Layout.Section>
          <EmailTemplatePreview
            mode={mode}
            setMode={setMode}
            emailSettings={emailSettings}
            settingsKeys={{
              subject: "emailSubject",
              heading: "emailHeading",
              content: "emailContent",
              footer: "emailFooter",
            }}
            replaceTokens={(content) =>
              content
                ?.replace("{customer_name}", "John Doe")
                .replace("{site_title}", "Demo Store")
                .replace("{review_products}", getProductReviewSectionHTML(shopDomain, mode)) || ""
            }
          />
        </Layout.Section>
      </Layout>
    </Card>
  );
}
