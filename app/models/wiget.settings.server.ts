import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import { reviewWidgetSettingsSchema, type ReviewWidgetSettings } from "./schemas";

// Create metaobject definition
export async function createReviewWidgetSettingsMetaobjectDefinition(graphql: AdminGraphqlClient) {
  const mutation = `#graphql
      mutation createReviewWidgetSettingsMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
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
      type: "$app:review_widget_settings",
      name: "Review Widget Settings",
      description: "Widget Customization Settings",
      fieldDefinitions: [
        {
          key: "layout",
          name: "Layout",
          description: "Layout of the review card (e.g. Grid or List)",
          type: "single_line_text_field",
          required: true,
        },
        {
          key: "allowMedia",
          name: "Allow Media",
          description: "Allow customers to upload photos/videos",
          type: "boolean",
          required: true,
        },
        {
          key: "mediaSize",
          name: "Media Size",
          description: "Size of uploaded media (e.g. thumbnail, medium, large)",
          type: "single_line_text_field",
          required: true,
        },
        {
          key: "showSummary",
          name: "Show Summary",
          description: "Display an aggregate summary of the reviews",
          type: "boolean",
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
      throw new Error(
        "Failed to create review widget settings metaobject definition :" +
          JSON.stringify(result.data.metaobjectDefinitionCreate.userErrors, null, 2),
      );
    }

    console.log("Review widget settings metaobject definition created successfully:", result.data.metaobjectDefinitionCreate.metaobjectDefinition);
    return result.data.metaobjectDefinitionCreate.metaobjectDefinition;
  } catch (error) {
    console.error("Failed to create review widget settings metaobject definition:", error);
    throw error;
  }
}

// Check if definition already exists
export async function checkReviewWidgetSettingsMetaobjectDefinitionExists(graphql: AdminGraphqlClient): Promise<boolean> {
  const query = `#graphql
      query CheckReviewWidgetSettingsMetaobjectDefinition {
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
    return definitions.some((def: any) => def.type.endsWith("--review_widget_settings"));
  } catch (error) {
    console.error("Failed to check review widget settings metaobject definition:", error);
    return false;
  }
}

// Create metaobject definition if not exists
export async function createReviewWidgetSettingsDefinitionIfNotExists(graphql: AdminGraphqlClient) {
  const exists = await checkReviewWidgetSettingsMetaobjectDefinitionExists(graphql);
  if (!exists) {
    await createReviewWidgetSettingsMetaobjectDefinition(graphql);
  }
}

// Save or update review widget settings
export async function saveReviewWidgetSettings(graphql: AdminGraphqlClient, settings: ReviewWidgetSettings): Promise<ReviewWidgetSettings> {
  // Ensure metaobject definition exists
  const definitionExists = await checkReviewWidgetSettingsMetaobjectDefinitionExists(graphql);

  if (!definitionExists) {
    await createReviewWidgetSettingsMetaobjectDefinition(graphql);
  }

  // Check if review widget settings metaobject exists
  const existingSettings = await getExistingReviewWidgetSettings(graphql);

  let metaobjectId: string | null = null;

  if (existingSettings && existingSettings.nodes.length > 0) {
    metaobjectId = existingSettings.nodes[0].id;
  }

  try {
    if (metaobjectId) {
      // Update existing metaobject
      return await updateReviewWidgetSettings(graphql, metaobjectId, settings);
    } else {
      // Create new metaobject
      return await createReviewWidgetSettingsMetaobject(graphql, settings);
    }
  } catch (error) {
    console.error("Failed to save review widget settings:", error);
    throw new Error("Unable to save review widget settings: " + error);
  }
}

// Get review widget settings
export async function getExistingReviewWidgetSettings(graphql: AdminGraphqlClient) {
  const query = `#graphql
            query GetReviewWidgetSettings {
              metaobjects(type: "$app:review_widget_settings", first: 1) {
                nodes {
                  id
                  fields {
                    key
                    value
                  }
                }
              }
            }
          `;

  try {
    const response = await graphql(query);
    const result = await response.json();
    if (!result.data?.metaobjects || result.data?.metaobjects.nodes.length === 0) {
      return null;
    }
    return result.data?.metaobjects;
  } catch (error) {
    console.error("Failed to get review widget settings:", error);
    throw error;
  }
}

export async function getReviewWidgetSettings(graphql: AdminGraphqlClient): Promise<ReviewWidgetSettings | null> {
  const existingSettings = await getExistingReviewWidgetSettings(graphql);
  if (existingSettings && existingSettings.nodes && existingSettings.nodes.length > 0) {
    return transformMetaobjectToReviewWidgetSettings(existingSettings.nodes[0]);
  }
  return null;
}

// Helper function to create review widget settings metaobject
async function createReviewWidgetSettingsMetaobject(graphql: AdminGraphqlClient, settings: ReviewWidgetSettings): Promise<ReviewWidgetSettings> {
  const mutation = `#graphql
      mutation CreateReviewWidgetSettingsMetaobject($metaobject: MetaobjectCreateInput!) {
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
      type: "$app:review_widget_settings", // Use app-reserved type
      handle: `review-widget-settings-${Date.now()}`,
      fields: [
        { key: "layout", value: settings.layout },
        { key: "allowMedia", value: String(settings.allowMedia) },
        { key: "mediaSize", value: settings.mediaSize },
        { key: "showSummary", value: String(settings.showSummary) },
      ],
    },
  };

  const response = await graphql(mutation, { variables });
  const result = await response.json();

  if (result.data?.metaobjectCreate?.userErrors?.length > 0) {
    console.error("Error creating review widget settings:", result.data.metaobjectCreate.userErrors);
    throw new Error(`Failed to create review widget settings metaobject: ${JSON.stringify(result.data.metaobjectUpdate.userErrors)}`);
  }

  if (result.data?.metaobjectCreate?.metaobject) {
    return transformMetaobjectToReviewWidgetSettings(result.data.metaobjectCreate.metaobject);
  }

  throw new Error("Failed to create settings");
}

// Helper function to update existing review widget settings metaobject
async function updateReviewWidgetSettings(
  graphql: AdminGraphqlClient,
  metaobjectId: string,
  settings: ReviewWidgetSettings,
): Promise<ReviewWidgetSettings> {
  const mutation = `#graphql
      mutation UpdateReviewWidgetSettingsMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject {
            id
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
    id: metaobjectId,
    metaobject: {
      fields: [
        { key: "layout", value: settings.layout },
        { key: "allowMedia", value: String(settings.allowMedia) },
        { key: "mediaSize", value: settings.mediaSize },
        { key: "showSummary", value: String(settings.showSummary) },
      ],
    },
  };

  const response = await graphql(mutation, { variables });
  const result = await response.json();

  if (result.data?.metaobjectUpdate?.userErrors?.length > 0) {
    console.error("Error updating review widget settings:", result.data.metaobjectUpdate.userErrors);
    throw new Error(`Failed to update review widget settings metaobject: ${JSON.stringify(result.data.metaobjectUpdate.userErrors)}`);
  }

  const updatedMetaobject = result.data.metaobjectUpdate.metaobject;
  return transformMetaobjectToReviewWidgetSettings(updatedMetaobject);
}

export function transformMetaobjectToReviewWidgetSettings(metaobject: any): ReviewWidgetSettings {
  const fields = metaobject.fields.reduce((acc: any, field: any) => {
    acc[field.key] = field.value;
    return acc;
  }, {});

  const reviewWidgetSettings = {
    layout: fields.layout,
    allowMedia: fields.allowMedia === "true" || fields.allowMedia === true,
    mediaSize: fields.mediaSize,
    showSummary: fields.showSummary === "true" || fields.showSummary === true,
  };

  return reviewWidgetSettingsSchema.parse(reviewWidgetSettings);
}
