import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import type { Session } from "@shopify/shopify-api";

/**
 * 1. Register webhook ORDERS_FULFILLED via GraphQL (requires PII)
 */
async function registerOrdersFulfilledWebhookGraphQL(admin: AdminApiContext, callbackUrl: string) {
  const mutation = `#graphql
    mutation {
      webhookSubscriptionCreate(
        topic: ORDERS_FULFILLED,
        webhookSubscription: {
          callbackUrl: "${callbackUrl}",
          format: JSON
        }
      ) {
        webhookSubscription { id topic }
        userErrors { field message }
      }
    }`;

  try {
    const res = await admin.graphql(mutation);
    const json = await res.json();
    console.log("GraphQL ORDERS_FULFILLED response:", JSON.stringify(json, null, 2));

    const errors = json.data?.webhookSubscriptionCreate?.userErrors || [];
    if (errors.length > 0) {
      console.error("Webhook ORDERS_FULFILLED failed:", errors);
      return false;
    }
    console.log(`Webhook ORDERS_FULFILLED registered with ID:`, json.data?.webhookSubscriptionCreate?.webhookSubscription?.id);
    return true;
  } catch (err) {
    console.error("GraphQL ORDERS_FULFILLED error:", err);
    return false;
  }
}

/**
 * 2. Register webhook fulfillments/create via REST API (fallback when no PII)
 */
async function registerFulfillmentsCreateWebhookREST(session: Session, callbackUrl: string) {
  const shop = session.shop;
  const token = session.accessToken;
  const apiVersion = "2025-07";
  const url = `https://${shop}/admin/api/${apiVersion}/webhooks.json`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": token || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook: {
          topic: "fulfillments/create",
          address: callbackUrl,
          format: "json",
        },
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      console.error("REST Webhook fulfillments/create failed:", json);
      return false;
    }

    console.log("REST Webhook fulfillments/create registered:", json);
    return true;
  } catch (err) {
    console.error("REST fetch error:", err);
    return false;
  }
}

/**
 * 3. Total function: Automatically select the appropriate method
 */
export async function registerOrderFulfilledWebhook(admin: AdminApiContext, session: Session) {
  const callbackUrl = `${process.env.SHOPIFY_APP_URL}/webhooks/orders-fulfilled`;

  if (process.env.SHOPIFY_USE_PII === "true") {
    const ok = await registerOrdersFulfilledWebhookGraphQL(admin, callbackUrl);
    if (!ok) {
      console.warn("Fallback to REST fulfillments/create...");
      await registerFulfillmentsCreateWebhookREST(session, callbackUrl);
    }
  } else {
    await registerFulfillmentsCreateWebhookREST(session, callbackUrl);
  }
}
