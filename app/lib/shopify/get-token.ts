import prisma from "app/db.server";

export async function getAccessToken(shopDomain: string): Promise<string | null> {
  const session = await prisma.session.findFirst({
    where: {
      shop: shopDomain,
    },
  });

  return (session && session.accessToken) || null;
}
