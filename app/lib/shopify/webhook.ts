import { createHmac, timingSafeEqual } from "crypto";

export function verifyWebhook(rawBody: Buffer, hmacHeader: string): boolean {
  if (!hmacHeader) return false;
  const secret = process.env.SHOPIFY_API_SECRET!;
  const generatedHmac = createHmac("sha256", secret).update(rawBody).digest("base64");
  return (
    Buffer.from(generatedHmac, "utf8").length === Buffer.from(hmacHeader, "utf8").length &&
    timingSafeEqual(Buffer.from(generatedHmac, "utf8"), Buffer.from(hmacHeader, "utf8"))
  );
}
