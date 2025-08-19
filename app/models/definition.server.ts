import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import { createProductReviewMetafieldIfNotExist } from "./product.metafield.server";

export async function createReviewMetaobjectDefinition(graphql: AdminGraphqlClient) {
  const mutation = `#graphql
      mutation CreateReviewMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition {
            id
            type
            name
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
    definition: {
      type: "$app:review",
      name: "Product Review",
      description: "Customer product reviews and ratings",
      fieldDefinitions: [
        {
          key: "rating",
          name: "Rating",
          description: "Review rating from 1 to 5 stars",
          type: "rating",
          required: true,
          validations: [
            {
              name: "scale_min",
              value: "1.0",
            },
            {
              name: "scale_max",
              value: "5.0",
            },
          ],
        },
        {
          key: "status",
          name: "Review Status",
          description: "Current status of the review",
          type: "single_line_text_field",
          required: true,
        },
        {
          key: "title",
          name: "Review Title",
          description: "Title of the review",
          type: "single_line_text_field",
          required: true,
        },
        {
          key: "body",
          name: "Review Body",
          description: "Review content/description",
          type: "multi_line_text_field",
          required: true,
        },
        {
          key: "merchantReply",
          name: "Merchant Reply",
          description: "Optional reply from merchant",
          type: "multi_line_text_field",
        },
        {
          key: "productId",
          name: "Product",
          description: "Reference to the reviewed product",
          type: "single_line_text_field",
          required: true,
        },
        {
          key: "orderId",
          name: "Order ID",
          description: "Order ID as text (order_reference not available for metaobjects)",
          type: "single_line_text_field",
        },
        {
          key: "authorId",
          name: "Customer",
          description: "Reference to the customer who wrote this review",
          type: "customer_reference",
          required: true,
        },
        {
          key: "fullName",
          name: "Customer Name",
          description: "Customer name review",
          type: "single_line_text_field",
          required: true,
        },
        {
          key: "email",
          name: "Customer Email",
          description: "Customer  review",
          type: "single_line_text_field",
          required: true,
        },
        {
          key: "shop",
          name: "Shop Domain",
          description: "Shop domain for multi-tenant support",
          type: "single_line_text_field",
          required: true,
        },
        {
          key: "submittedAt",
          name: "Submitted Date",
          description: "When the review was submitted by the customer",
          type: "date_time",
          required: true,
        },
      ],
      access: {
        admin: "MERCHANT_READ_WRITE",
        storefront: "PUBLIC_READ",
      },
    },
  };

  try {
    const response = await graphql(mutation, { variables });
    const result = await response.json();

    if (result.data?.metaobjectDefinitionCreate?.userErrors?.length > 0) {
      console.error("Error creating metaobject definition:", result.data.metaobjectDefinitionCreate.userErrors);
      throw new Error("Failed to create review metaobject definition");
    }

    console.log("Review metaobject definition created successfully:", result.data?.metaobjectDefinitionCreate?.metaobjectDefinition);
    return result.data?.metaobjectDefinitionCreate?.metaobjectDefinition.id;
  } catch (error) {
    console.error("Failed to create review metaobject definition:", error);
    throw error;
  }
}

export async function checkMetaobjectDefinitionExists(graphql: AdminGraphqlClient): Promise<string | null> {
  const query = `#graphql
      query CheckReviewMetaobjectDefinition {
        metaobjectDefinitions(first: 50) {
          nodes {
            type
            name
          }
        }
      }
    `;

  try {
    const response = await graphql(query);
    const result = await response.json();

    const definitions = result.data?.metaobjectDefinitions?.nodes || [];

    return definitions.find((def: any) => def.type.endsWith("--review"))?.id ?? null;
  } catch (error) {
    console.error("Failed to check metaobject definition:", error);
    return null;
  }
}

export async function createMetaobjectDefinitionIfNotExists(graphql: AdminGraphqlClient) {
  let definitionExists = await checkMetaobjectDefinitionExists(graphql);
  if (!definitionExists) {
    definitionExists = await createReviewMetaobjectDefinition(graphql);
  }
  await createProductReviewMetafieldIfNotExist(graphql, definitionExists as string);
}
