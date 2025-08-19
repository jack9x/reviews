import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";

import type { ProductAverage, ProductMetafieldConfig, ProductReviewStatus } from "../types/product.metafield";
import { getDefaultProductAverage, updateAverageCalculation } from "app/lib/helpers/product.metafield.helper";

/*************************Definition********************************/

// check if metafield definition exists
export async function checkMetafieldDefinitionExists(graphql: AdminGraphqlClient, namespace: string, key: string): Promise<boolean> {
  const query = `#graphql
      query CheckProductMetafieldDefinition($namespace: String!, $key: String!) {
        metafieldDefinitions(ownerType: PRODUCT,namespace: $namespace, key: $key, first: 1) {
          nodes { id }
        }
      }
    `;

  const response = await graphql(query, { variables: { namespace, key } });
  const result = await response.json();
  return (result.data?.metafieldDefinitions?.nodes?.length ?? 0) > 0;
}

async function createMetafieldDefinition(graphql: AdminGraphqlClient, config: ProductMetafieldConfig) {
  const mutation = `#graphql
      mutation CreateProductMetafieldDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition {
            id
            name
            key
            namespace
            type { name }
            ownerType
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
      name: config.name,
      namespace: config.namespace,
      key: config.key,
      type: config.type,
      description: config.description ?? "",
      ownerType: config.ownerType,
      access: config.access ?? { storefront: "PUBLIC_READ" },
      validations: config.validations ?? [],
    },
  };

  const response = await graphql(mutation, { variables });
  const result = await response.json();

  const errors = result.data?.metafieldDefinitionCreate?.userErrors ?? [];
  if (errors.length > 0) {
    console.error("Error creating product metafield definition:", errors);
    throw new Error(errors.map((e: any) => e.message).join(", "));
  }

  return result.data?.metafieldDefinitionCreate?.createdDefinition;
}

export async function createProductMetafieldIfNotExist(graphql: AdminGraphqlClient, config: ProductMetafieldConfig) {
  const exists = await checkMetafieldDefinitionExists(graphql, config.namespace, config.key);
  if (!exists) {
    await createMetafieldDefinition(graphql, config);
  }
}

/*************************Average Metafield********************************/
export async function getProductAverageMetafield(graphql: AdminGraphqlClient, productId: string) {
  const query = `#graphql
    query GetProductAverage($productId: ID!) {
      product(id: $productId) {
        metafield(namespace: "product_review", key: "product_average") {
          id
          value
        }
      }
    }
  `;
  const res = await graphql(query, { variables: { productId } });
  const data = await res.json();
  return data.data?.product?.metafield || null;
}

export async function saveProductAverageMetafield(graphql: AdminGraphqlClient, productId: string, productAverage: ProductAverage) {
  const value = JSON.stringify(productAverage);

  const mutation = `#graphql
    mutation SaveProductAverage($productId: ID!, $value: String!) {
      metafieldsSet(metafields: [
        {
          namespace: "product_review",
          key: "product_average",
          type: "json",
          ownerId: $productId,
          value: $value
        }
      ]) {
        metafields { id value }
        userErrors { field message }
      }
    }
  `;

  const variables = { productId, value };

  const res = await graphql(mutation, { variables });
  const data = await res.json();

  if (data.data?.metafieldsSet?.userErrors?.length) {
    console.error("Error saving product_average:", data.data.metafieldsSet.userErrors);
    throw new Error(data.data.metafieldsSet.userErrors.map((e: any) => e.message).join(", "));
  }
}

export async function updateProductAverageRating(
  graphql: AdminGraphqlClient,
  productId: string,
  approvedRating: number,
  status: ProductReviewStatus,
) {
  // Ensure product average metafield definition exists
  await createProductMetafieldIfNotExist(graphql, {
    name: "Product Average Rating",
    namespace: "product_review",
    key: "product_average",
    type: "json",
    description: "Average rating data for this product",
    ownerType: "PRODUCT",
  });

  // Get current product average metafield
  const existing = await getProductAverageMetafield(graphql, productId);

  // Get current product average metafield value or default
  let productAverage: ProductAverage = existing?.value ? JSON.parse(existing.value) : getDefaultProductAverage();

  // Update product average metafield value
  productAverage = updateAverageCalculation(productAverage, approvedRating, status);

  // Save product average metafield value
  await saveProductAverageMetafield(graphql, productId, productAverage);
}
/*************************Review Metafield********************************/
export async function addReviewToProductMetafield(graphql: AdminGraphqlClient, productId: string, metaobjectId: string): Promise<void> {
  const query = `#graphql
    query GetProductMetafield($id: ID!) {
      product(id: $id) {
        metafield(namespace: "product_review", key: "reviews") {
          value
        }
      }
    }
  `;

  const variables = { id: productId };

  const response = await graphql(query, { variables });
  const result = await response.json();

  const currentValue = result.data?.product?.metafield?.value;

  let reviewsList: string[] = [];

  if (currentValue) {
    try {
      reviewsList = JSON.parse(currentValue);
    } catch (err) {
      console.error("Error parsing current metafield value:", currentValue);
      throw new Error("The current metafield value is invalid.");
    }
  }

  reviewsList.push(metaobjectId);

  const mutation = `#graphql
    mutation UpdateMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const updateVariables = {
    metafields: [
      {
        namespace: "product_review",
        key: "reviews",
        ownerId: productId,
        type: "list.metaobject_reference",
        value: JSON.stringify(reviewsList),
      },
    ],
  };

  const updateResponse = await graphql(mutation, { variables: updateVariables });
  const updateResult = await updateResponse.json();

  if (updateResult.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error("Error update metafield:", updateResult.data.metafieldsSet.userErrors);
    throw new Error("Unable to update metafield");
  }
}

export async function createProductReviewMetafieldIfNotExist(graphql: AdminGraphqlClient, metaobjectId: string) {
  await createProductMetafieldIfNotExist(graphql, {
    name: "Product Reviews",
    namespace: "product_review",
    key: "reviews",
    type: `list.metaobject_reference`,
    description: "List of reviews for this product",
    ownerType: "PRODUCT",
    access: {
      storefront: "PUBLIC_READ",
    },
    validations: [
      {
        name: "metaobject_definition_id",
        value: metaobjectId,
      },
    ],
  });
}
