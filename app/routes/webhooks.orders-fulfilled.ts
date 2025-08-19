import type { ActionFunction } from "@remix-run/node";
import { getEmailSettings } from "app/models/email.settings.server";
import { createShopifyGraphQLClient } from "app/lib/shopify/client";
import { verifyWebhook } from "app/lib/shopify/webhook";
import prisma from "app/db.server";
import { getAccessToken } from "app/lib/shopify/get-token";

/**
 * Handles incoming Shopify webhooks for ORDERS_FULFILLED or FULFILLMENTS/CREATE.
 */
export const action: ActionFunction = async ({ request }) => {
  try {
    // Read raw body for HMAC validation
    const rawBody = Buffer.from(await request.arrayBuffer());
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    const topicHeader = request.headers.get("x-shopify-topic")?.toUpperCase();

    if (!topicHeader || !["ORDERS_FULFILLED", "FULFILLMENTS/CREATE"].includes(topicHeader)) {
      return new Response("Invalid topic", { status: 400 });
    }

    // Verify request authenticity
    if (!verifyWebhook(rawBody, hmacHeader || "")) {
      console.error("Invalid HMAC - rejecting webhook");
      return new Response("Unauthorized", { status: 401 });
    }

    const shopDomain = request.headers.get("x-shopify-shop-domain");
    if (!shopDomain) return new Response("No shop domain", { status: 400 });

    const accessToken = await getAccessToken(shopDomain);
    if (!accessToken) return new Response("No access token", { status: 400 });

    // Parse webhook payload
    const payload = JSON.parse(rawBody.toString("utf8"));
    // console.log(`Webhook received [${topicHeader}]`, payload);

    const graphqlClient = createShopifyGraphQLClient(shopDomain, accessToken);

    const emailSettings = await getEmailSettings(graphqlClient as any);

    if (!emailSettings) return new Response("No email settings", { status: 200 });

    // Create email queue
    const daysToAdd = emailSettings.daySend || 5;
    const fulfillmentAt = new Date();
    const sendScheduleAt = new Date(fulfillmentAt.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // add to email queue
    await prisma.emailQueue.create({
      data: {
        shop: shopDomain,
        orderId: payload.order_id.toString(),
        fulfillment_at: fulfillmentAt,
        send_schedule_at: sendScheduleAt,
      },
    });
    return new Response("Email queue created", { status: 200 });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response("Webhook error", { status: 500 });
  }
};
