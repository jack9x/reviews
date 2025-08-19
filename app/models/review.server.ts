import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import { randCatchPhrase, randEmail, randFullName, randNumber, randQuote } from "@ngneat/falso";
import { reviewSchema } from "./schemas";
import type { ReviewCreateInput, Review } from "./schemas";
import { createMetaobjectDefinitionIfNotExists } from "./definition.server";
import { addReviewToProductMetafield, updateProductAverageRating } from "./product.metafield.server";
import type { ProductReviewStatus } from "app/types/product.metafield";

export async function getReviews(graphql: AdminGraphqlClient, first: number = 20, after?: string): Promise<Review[]> {
  const query = `#graphql
    query GetReviews($first: Int!, $after: String) {
      metaobjects(type: "$app:review", first: $first, after: $after) {
        edges {
          node {
            id
            handle
            fields {
              key
              value
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const variables: { first: number; after?: string } = { first };
  if (after) {
    variables.after = after;
  }

  try {
    const response = await graphql(query, { variables });
    const result = await response.json();

    if (!result.data?.metaobjects) {
      throw new Error("Failed to fetch reviews");
    }

    const metaobjects = result.data?.metaobjects?.edges?.map((edge: any) => edge.node) || [];

    return metaobjects.map((metaobject: any) => transformMetaobjectToReview(metaobject));
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    throw error;
  }
}

export async function createReview(graphql: AdminGraphqlClient, review: ReviewCreateInput): Promise<Review> {
  const mutation = `#graphql
    mutation CreateReview($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject {
          id
          handle
          fields {
            key
            value
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const variables = {
    metaobject: {
      type: "$app:review",
      handle: `review-${Date.now()}-${review.productId.split("/").pop()}-${review.authorId.split("/").pop()}`,
      fields: [
        {
          key: "rating",
          value: JSON.stringify({
            scale_min: 1,
            scale_max: 5,
            value: Number(review.rating.toFixed(1)),
          }),
        },
        { key: "status", value: "pending" },
        { key: "title", value: review.title },
        { key: "body", value: review.body },
        { key: "merchantReply", value: "" },
        { key: "productId", value: review.productId },
        { key: "authorId", value: review.authorId },
        { key: "fullName", value: review.fullName },
        { key: "email", value: review.email },
        { key: "shop", value: review.shop },
        { key: "submittedAt", value: new Date().toISOString() },
      ],
    },
  };

  const response = await graphql(mutation, { variables });
  const result = await response.json();

  if (result.data?.metaobjectCreate?.userErrors?.length > 0) {
    console.error("Error creating review:", result.data.metaobjectCreate.userErrors);
    throw new Error("Failed to create review");
  }

  if (result.data?.metaobjectCreate?.metaobject) {
    return transformMetaobjectToReview(result.data.metaobjectCreate.metaobject);
  }

  throw new Error("Failed to create review");
}

export function transformMetaobjectToReview(metaobject: any): Review {
  const fields = metaobject.fields.reduce((acc: any, field: any) => {
    acc[field.key] = field.value;
    return acc;
  }, {});

  let rating = NaN;
  try {
    const parsedRating = JSON.parse(fields.rating);
    rating = parseFloat(parsedRating?.value);
  } catch (err) {
    console.error("Failed to parse rating field:", fields.rating);
  }

  const review = {
    id: metaobject.id,
    handle: metaobject.handle,
    rating,
    status: fields.status,
    title: fields.title,
    body: fields.body,
    merchantReply: fields.merchantReply || undefined,
    shop: fields.shop,
    productId: fields.productId,
    orderId: fields.orderId || undefined,
    authorId: fields.authorId,
    fullName: fields.fullName,
    email: fields.email,
    submittedAt: new Date(fields.submittedAt),
  };

  return reviewSchema.parse(review);
}

export async function updateReviewStatus(graphql: AdminGraphqlClient, id: string, status: ProductReviewStatus): Promise<void> {
  const mutation = `#graphql
    mutation UpdateReviewStatus($id: ID!, $status: String!) {
      metaobjectUpdate(
        id: $id,
        metaobject: {
          fields: [
            { key: "status", value: $status }
          ]
        }) {
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = { id, status };

  try {
    const response = await graphql(mutation, { variables });
    const result = await response.json();

    if (!result) {
      throw new Error("Failed to update review status: No response from server");
    }
    const userErrors = result.data?.metaobjectUpdate?.userErrors;

    if (userErrors?.length > 0) {
      console.error("User errors:", userErrors);
      throw new Error("Failed to update review status:", userErrors.map((e: any) => e.message).join(", "));
    }

    // update product average rating if review is approved
    if (status === "approved") {
      const { productId, rating } = await getReviewInfo(graphql, id);
      await addReviewToProductMetafield(graphql, productId, id);
      await updateProductAverageRating(graphql, productId, rating, status);
    }
  } catch (error) {
    console.error("Failed to update review status:", error);
    throw error;
  }
}

export async function getProductThumbnail(graphql: AdminGraphqlClient, id: string): Promise<string> {
  const query = `#graphql
    query getProductThumbnail($id: ID!) {
  product(id: $id) {
    media(first: 1) {
      edges {
        node {
          ... on MediaImage {
            image {
              url
            }
          }
        }
      }
    }
  }
}
  `;

  try {
    const response = await graphql(query, { variables: { id } });
    const result = await response.json();
    const edges = result?.data?.product?.media?.edges;

    if (Array.isArray(edges) && edges.length > 0 && edges[0].node?.image?.url) {
      return edges[0].node.image.url;
    }
    return "";
  } catch (error) {
    console.error("Failed to fetch product:", error);
    throw error;
  }
}

export async function getCustomerInfo(
  graphql: AdminGraphqlClient,
  id: string,
): Promise<{ firstName: string; lastName: string; emailAddress: string }> {
  const query = `#graphql 
  query getCustomer($id: ID!){
  customer(id: $id) {
      firstName,
      lastName,
      email
  }
}
  `;

  try {
    const response = await graphql(query, { variables: { id } });
    const result = await response.json();

    if (!result.data?.customer) {
      throw new Error("Failed to fetch customer info");
    }

    const customer = result.data?.customer;

    return {
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      emailAddress: customer.email || "",
    };
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    throw error;
  }
}

export async function getReviewInfo(graphql: AdminGraphqlClient, id: string): Promise<{ productId: string; rating: number }> {
  const query = `#graphql
    query getReviewMetaobject($id: ID!) {
      metaobject(id: $id) {
        fields {
          key
          value
        }
      }
    }
  `;

  const res = await graphql(query, { variables: { id } });
  const data = await res.json();
  const fields = data.data?.metaobject?.fields;

  if (!fields) throw new Error("Failed to fetch review info");

  const fieldMap = Object.fromEntries(fields.map((f: any) => [f.key, f.value]));

  if (!fieldMap.productId || !fieldMap.rating) {
    throw new Error("Missing productId or rating");
  }

  return {
    productId: fieldMap.productId,
    rating: Number(JSON.parse(fieldMap.rating).value),
  };
}
/** Debugging */

export async function getShopId(graphql: AdminGraphqlClient): Promise<string> {
  const query = `#graphql
    query GetShop {
      shop {
        id
      }
    }
  `;

  const response = await graphql(query);
  const result = await response.json();

  if (!result.data?.shop?.id) {
    throw new Error("Failed to get shop ID");
  }

  return result.data.shop.id;
}

export async function getRecentOrders(graphql: AdminGraphqlClient): Promise<{ orderId: string; customerId: string; productId: string }[]> {
  const query = `#graphql
    query GetOrders {
      orders(first: 15, reverse: true) {
        edges {
          node {
            id
            customer {
              id
            }
            lineItems(first: 1) {
              edges {
                node {
                  product {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await graphql(query);
  const result = await response.json();

  const orders = result.data?.orders?.edges || [];

  return orders
    .map((edge: any) => {
      const node = edge.node;
      const customerId = node.customer?.id ?? null;
      const productId = node.lineItems?.edges?.[0]?.node?.product?.id ?? null;

      return {
        orderId: node.id,
        customerId,
        productId,
      };
    })
    .filter((order: any) => order.customerId && order.productId);
}

export async function fake10Reviews(graphql: AdminGraphqlClient): Promise<Review[]> {
  const shop = await getShopId(graphql);
  const orders = await getRecentOrders(graphql);

  await createMetaobjectDefinitionIfNotExists(graphql);
  const reviews: Review[] = [];

  for (const order of orders) {
    const fakeReviewInput: ReviewCreateInput = {
      rating: randNumber({ min: 1, max: 5 }),
      title: randCatchPhrase(),
      body: randQuote(),
      shop,
      productId: order.productId,
      authorId: order.customerId,
      fullName: randFullName(),
      email: randEmail(),
    };

    const review = await createReview(graphql, fakeReviewInput);

    reviews.push(review);
  }

  return reviews;
}
