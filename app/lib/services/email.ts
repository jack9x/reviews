import nodemailer from "nodemailer";
import { fetchOrderInfo } from "./orders";
import type { GraphQLClient } from "../shopify/client";
import { getEmailSettings } from "app/models/email.settings.server";

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: MailOptions): Promise<{ success: boolean; message?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT!) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "Your Store"}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("sendEmail error:", err);
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendMailTemplate(graphql: GraphQLClient, emailQueue: { shop: string; orderId: string }): Promise<void> {
  const emailSettings = await getEmailSettings(graphql as any);
  if (!emailSettings) {
    console.error("No email settings found for shop", emailQueue.shop);
    return;
  }

  const orderInfo = await fetchOrderInfo(graphql, emailQueue.orderId);
  const customerEmail = orderInfo?.customer?.defaultEmailAddress?.emailAddress || orderInfo?.email;
  const firstName = orderInfo?.customer?.firstName || "John";
  const lastName = orderInfo?.customer?.lastName || "Doe";
  const customerName = firstName + " " + lastName;
  let reviewProducts = "";
  if (orderInfo && orderInfo.lineItems.edges.length > 0) {
    reviewProducts = orderInfo.lineItems.edges
      .map(
        (item) => `
    <table width="50%" border="0" cellspacing="0" cellpadding="0" 
           style="border:1px solid #e5e5e5; border-radius:6px; margin:12px 0; font-family:Arial,sans-serif;">
      <tr>
        <!-- Image -->
        <td width="100" style="padding:10px;">
          <img src="${item.node.variant.product.media.edges[0].node.image.url}" alt="${item.node.variant.product.title}" 
               style="display:block; width:80px; height:80px; object-fit:cover; border-radius:4px;" />
        </td>
  
        <!-- Product info -->
        <td style="padding:10px; vertical-align:middle;">
          <div style="font-size:14px; font-weight:bold; color:#000;">${item.node.variant.product.title}</div>
          <div style="color:#FFA500; margin-top:4px;">★★★★★</div>
        </td>
  
        <!-- Button -->
        <td width="130" align="right" style="padding:10px;">
          <a href="https://${emailQueue.shop}/products/${item.node.variant.product.handle}"
             style="background:#000; color:#fff; text-decoration:none; 
                    padding:8px 14px; border-radius:4px; font-size:13px; display:inline-block;">
            Leave a review
          </a>
        </td>
      </tr>
    </table>
  `,
      )
      .join("");
  }
  const html = `
      <h2>${emailSettings.emailHeading}</h2>
      ${
        emailSettings.emailContent
          ? emailSettings.emailContent
              .replace("{customer_name}", customerName)
              .replace("{site_title}", emailQueue.shop)
              .replace("{review_products}", reviewProducts)
          : ""
      }
      <footer>${emailSettings.emailFooter?.replace("{site_title}", emailQueue.shop)}</footer>
    `;

  if (customerEmail) {
    const result = await sendMail({
      to: customerEmail,
      subject: emailSettings.emailSubject ?? "Reminder email for you to leave a review",
      html,
    });
    if (result.success) {
      console.log(`Email sent to ${customerEmail}`);
    } else {
      console.error(`Failed to send email to ${customerEmail}: ${result.message}`);
    }
  } else {
    console.warn("No customer email found, skipping send.");
  }
}
