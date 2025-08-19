import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
import { createDiscount } from "app/models/discount.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const { discountValue, unit, oneUsePerCustomer } = await request.json();

  if (!discountValue) {
    return Response.json({ success: false, message: "discount value is required" });
  }

  const discount = await createDiscount(admin.graphql, { discountValue, unit, oneUsePerCustomer });

  if (!discount) {
    return Response.json({ success: false, message: "Failed to create discount" });
  }
  return Response.json({ success: true, id: discount.id, code: discount.code });
}
