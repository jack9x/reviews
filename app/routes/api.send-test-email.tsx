import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
import { sendMail } from "app/lib/services/email";
export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);

  try {
    const payload = await request.json();
    const to = Array.isArray(payload.to) ? payload.to : [payload.to];
    const subject: string = payload.subject ?? "Test email";
    const html: string = payload.html ?? "";

    if (!to.length) {
      return Response.json({ success: false, message: "No recipient provided" }, { status: 400 });
    }

    const result = await sendMail({
      to: to,
      subject: subject,
      html: html,
    });
    if (result.success) {
      return Response.json({ success: true, message: "Email sent successfully" });
    } else {
      return Response.json({ success: false, message: result.message || "Failed to send" }, { status: 500 });
    }
  } catch (err) {
    console.error("send-test-email action error:", err);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
