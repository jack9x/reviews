import cron from "node-cron";
import prisma from "app/db.server";

import { sendMailTemplate } from "app/lib/services/email";
import { getAccessToken } from "app/lib/shopify/get-token";
import { createShopifyGraphQLClient } from "app/lib/shopify/client";

// Cron runs daily at 01:00 AM
cron.schedule("0 1 * * *", async () => {
  console.log(`[CRON] Running every minute at ${new Date().toISOString()}`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // start of day
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1); // end of day

  const emailsQueue = await prisma.emailQueue.findMany({
    where: {
      send_schedule_at: {
        gte: today,
        lt: tomorrow,
      },
      status: "PENDING",
    },
  });

  for (const emailQueue of emailsQueue) {
    try {
      const accessToken = await getAccessToken(emailQueue.shop);
      if (!accessToken) return new Response("No access token", { status: 400 });
      const graphqlClient = createShopifyGraphQLClient(emailQueue.shop, accessToken);
      await sendMailTemplate(graphqlClient, emailQueue);
      await prisma.emailQueue.update({
        where: { id: emailQueue.id },
        data: { status: "SENT" },
      });
      console.log(`Email sent for order ${emailQueue.orderId}`);
    } catch (error) {
      console.error(`Error sending email for order ${emailQueue.orderId}:`, error);
      await prisma.emailQueue.update({
        where: { id: emailQueue.id },
        data: { status: "FAILED" },
      });
    }
  }
});
