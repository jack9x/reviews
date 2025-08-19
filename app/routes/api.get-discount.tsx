import type { ActionFunctionArgs } from "@remix-run/node";
import { getDiscountByCode } from "app/models/discount.server";

import { authenticate } from "app/shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const { codeId } = await request.json();

  if (!codeId) {
    return Response.json({ success: false, message: "codeId is required" });
  }

  const discount = await getDiscountByCode(admin.graphql, codeId);

  if (!discount) {
    return Response.json({ success: false, message: "Failed to get discount" });
  }
  return Response.json({ success: true, discount });
}
