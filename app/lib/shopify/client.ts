import { ApiVersion, shopifyApi } from "@shopify/shopify-api";
export type GraphQLClient = (query: string) => Promise<Response>;
export function createShopifyGraphQLClient(shop: string, accessToken: string): GraphQLClient {
  const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY!,
    apiSecretKey: process.env.SHOPIFY_API_SECRET!,
    scopes: process.env.SCOPES?.split(","),
    hostName: process.env.SHOPIFY_APP_URL!.replace(/^https?:\/\//, ""),
    apiVersion: ApiVersion.July24,
    isEmbeddedApp: false,
  });

  const client = new shopify.clients.Graphql({
    session: { shop, accessToken } as any,
  });

  return async (query: string) => {
    return { json: async () => await client.request(query) } as Response;
  };
}
