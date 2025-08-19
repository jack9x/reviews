import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";

import type { DiscountNodeEdge } from "app/types/discount";
import { generateDiscountCode } from "app/lib/helpers/discount.helper";

// Get all discounts
export async function getAllDiscounts(graphql: AdminGraphqlClient): Promise<DiscountNodeEdge[] | null> {
  const query = `#graphql
              query getAllDiscounts{
  discountNodes(first: 100) {
    edges {
      node {
        id
        discount {
          __typename

          ... on DiscountCodeBasic {
            
            title
            summary
            status
            startsAt
            endsAt
            usageLimit
            
            codes(first: 10) {
              edges {
                node {
                  id
                  code
                  
                }
              }
            }
          }

          ... on DiscountCodeBxgy {
            
            title
            summary
            status
            startsAt
            endsAt
            usageLimit
            
            codes(first: 10) {
              edges {
                node {
                  id
                  code
                  
                }
              }
            }
          }

          ... on DiscountCodeFreeShipping {
            
            title
            summary
            status
            startsAt
            endsAt
            usageLimit
            
            codes(first: 10) {
              edges {
                node {
                  id
                  code
                }
              }
            }
          }

        }
      }
    }
  }
}
 `;

  try {
    const response = await graphql(query);
    const result = await response.json();
    if (!result.data?.discountNodes || result.data?.discountNodes.edges.length === 0) {
      return null;
    }
    return result.data?.discountNodes.edges as DiscountNodeEdge[];
  } catch (error) {
    console.error("Failed to fetch discounts:", error);
    throw error;
  }
}

// get discount by code
export async function getDiscountByCode(graphql: AdminGraphqlClient, codeId: string): Promise<DiscountNodeEdge | null> {
  const query = `#graphql
    query GetDiscountCodeNode($id: ID!) {
  discountNode(id: $id) {
    id
    discount {
      __typename
      ... on DiscountCodeFreeShipping {
        title
        summary
        status
        startsAt
        endsAt
        usageLimit
        codes(first: 10) {
          edges {
            node {
              id
              code
            }
          }
        }
      }
      ... on DiscountCodeBasic {
        title
        summary
        status
        startsAt
        endsAt
        usageLimit
        codes(first: 10) {
          edges {
            node {
              id
              code
            }
          }
        }
      }
      ... on DiscountCodeBxgy {
        title
        summary
        status
        startsAt
        endsAt
        usageLimit
        codes(first: 10) {
          edges {
            node {
              id
              code
            }
          }
        }
      }
    }
  }
} `;

  try {
    const response = await graphql(query, { variables: { id: codeId } });
    const result = await response.json();
    const discountNode = result?.data?.discountNode;

    if (discountNode) {
      return discountNode as DiscountNodeEdge;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch discount:", error);
    throw error;
  }
}

// create discount
export async function createDiscount(
  graphql: AdminGraphqlClient,
  discountInput: {
    discountValue: string;
    unit: "percentage" | "fixed";
    oneUsePerCustomer: boolean;
  },
) {
  const randomCode = `CODE_${generateDiscountCode()}`;

  const mutation = `#graphql
      mutation CreateBasicDiscount($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

  const value =
    discountInput.unit === "percentage"
      ? { percentage: parseFloat(discountInput.discountValue) / 100 }
      : { discountAmount: { amount: parseFloat(discountInput.discountValue), appliesOnEachItem: false } };

  const variables = {
    basicCodeDiscount: {
      title: randomCode,
      startsAt: new Date().toISOString(),
      appliesOncePerCustomer: discountInput.oneUsePerCustomer,
      customerSelection: { all: true },
      customerGets: {
        items: { all: true },
        value: value,
      },
      code: randomCode,
    },
  };

  try {
    const response = await graphql(mutation, { variables });
    const result = await response.json();

    const errors = result.data?.discountCodeBasicCreate?.userErrors;
    if (errors?.length > 0) {
      throw new Error(`Error creating discount: ${errors[0].message}`);
    }

    return {
      id: result.data?.discountCodeBasicCreate?.codeDiscountNode?.id,
      code: randomCode,
    };
  } catch (error) {
    throw new Error(`Failed to create discount: ${error}`);
  }
}
