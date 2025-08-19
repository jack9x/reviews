import type { DiscountNodeEdge } from "app/types/discount";

export function fetchActiveOrScheduledCodeDiscounts(discounts: DiscountNodeEdge[]): DiscountNodeEdge[] {
  const activeCodeDiscounts = discounts.filter(({ node }) => {
    const typename = node.discount?.__typename || "";
    const status = node.discount?.status;
    return typename.startsWith("DiscountCode") && (status === "ACTIVE" || status === "SCHEDULED");
  });
  return activeCodeDiscounts;
}

export function generateDiscountCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = 12;
  const randomChars = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]);
  return randomChars.join("");
}
