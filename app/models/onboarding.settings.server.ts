import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import type { OnboardingSettings, ShopName, ThemeId } from "./schemas";
import {
  buildMetaobjectOnboardingSettingsFields,
  extractNumericId,
  transformMetaobjectToOnboardingSettings,
} from "app/lib/helpers/onboarding.helper";

// Create metaobject definition
export async function createOnboardingSettingsMetaobjectDefinition(graphql: AdminGraphqlClient) {
  const mutation = `#graphql
      mutation createOnboardingSettingsMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
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
      type: "$app:onboarding_settings",
      name: "Onboarding Settings",
      description: "Onboarding Settings",
      fieldDefinitions: [
        {
          key: "currentStep",
          name: "Current Step",
          description: "Current step of onboarding wizard",
          type: "number_integer",
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
        "Failed to create onboarding settings metaobject definition :" + JSON.stringify(result.data.metaobjectDefinitionCreate.userErrors, null, 2),
      );
    }
    return result.data.metaobjectDefinitionCreate.metaobjectDefinition;
  } catch (error) {
    throw error;
  }
}

// Check if definition already exists
export async function checkOnboardingSettingsMetaobjectDefinitionExists(graphql: AdminGraphqlClient): Promise<boolean> {
  const query = `#graphql
      query CheckOnboardingSettingsMetaobjectDefinition {
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
    return definitions.some((def: any) => def.type.endsWith("--onboarding_settings"));
  } catch (error) {
    console.error("Failed to check onboarding settings metaobject definition:", error);
    return false;
  }
}

// Create metaobject definition if not exists
export async function createOnboardingSettingsDefinitionIfNotExists(graphql: AdminGraphqlClient) {
  const exists = await checkOnboardingSettingsMetaobjectDefinitionExists(graphql);
  if (!exists) {
    await createOnboardingSettingsMetaobjectDefinition(graphql);
  }
}

// Save or update onboarding settings
export async function saveOnboardingSettings(graphql: AdminGraphqlClient, settings: OnboardingSettings): Promise<OnboardingSettings> {
  // Ensure metaobject definition exists
  const definitionExists = await checkOnboardingSettingsMetaobjectDefinitionExists(graphql);

  if (!definitionExists) {
    await createOnboardingSettingsMetaobjectDefinition(graphql);
  }

  // Check if onboarding settings metaobject exists
  const existingSettings = await getExistingOnboardingSettings(graphql);

  let metaobjectId: string | null = null;

  if (existingSettings && existingSettings.nodes.length > 0) {
    metaobjectId = existingSettings.nodes[0].id;
  }

  try {
    if (metaobjectId) {
      // Update existing metaobject
      return await updateOnboardingSettings(graphql, metaobjectId, settings);
    } else {
      // Create new metaobject
      return await createOnboardingSettingsMetaobject(graphql, settings);
    }
  } catch (error) {
    throw new Error(`Unable to save onboarding settings: ${error}`);
  }
}

// Get onboarding settings
export async function getExistingOnboardingSettings(graphql: AdminGraphqlClient) {
  const query = `#graphql
            query GetOnboardingSettings {
              metaobjects(type: "$app:onboarding_settings", first: 1) {
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
    throw error;
  }
}

export async function getOnboardingSettings(graphql: AdminGraphqlClient): Promise<OnboardingSettings | null> {
  const existingSettings = await getExistingOnboardingSettings(graphql);
  if (existingSettings && existingSettings.nodes && existingSettings.nodes.length > 0) {
    return transformMetaobjectToOnboardingSettings(existingSettings.nodes[0]);
  }
  return null;
}

// Helper function to create onboarding settings metaobject
async function createOnboardingSettingsMetaobject(graphql: AdminGraphqlClient, settings: OnboardingSettings): Promise<OnboardingSettings> {
  const mutation = `#graphql
      mutation CreateOnboardingSettingsMetaobject($metaobject: MetaobjectCreateInput!) {
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
      type: "$app:onboarding_settings", // Use app-reserved type
      handle: `onboarding-settings-${Date.now()}`,
      fields: buildMetaobjectOnboardingSettingsFields(settings),
    },
  };

  const response = await graphql(mutation, { variables });
  const result = await response.json();

  if (result.data?.metaobjectCreate?.userErrors?.length > 0) {
    const errors = result.data.metaobjectCreate.userErrors;
    throw new Error(`Failed to create Onboarding settings metaobject: ${JSON.stringify(errors)}`);
  }

  if (result.data?.metaobjectCreate?.metaobject) {
    return transformMetaobjectToOnboardingSettings(result.data.metaobjectCreate.metaobject);
  }

  throw new Error("Failed to create settings");
}

// Helper function to update existing review widget settings metaobject
async function updateOnboardingSettings(
  graphql: AdminGraphqlClient,
  metaobjectId: string,
  settings: OnboardingSettings,
): Promise<OnboardingSettings> {
  const mutation = `#graphql
      mutation UpdateOnboardingSettingsMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
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
      fields: buildMetaobjectOnboardingSettingsFields(settings),
    },
  };

  const response = await graphql(mutation, { variables });
  const result = await response.json();

  if (result.data?.metaobjectUpdate?.userErrors?.length > 0) {
    const errors = result.data.metaobjectUpdate.userErrors;
    throw new Error(`Failed to update onboarding settings metaobject: ${JSON.stringify(errors)}`);
  }

  const updatedMetaobject = result.data.metaobjectUpdate.metaobject;
  return transformMetaobjectToOnboardingSettings(updatedMetaobject);
}

// Get shop name
export async function getShopName(graphql: AdminGraphqlClient): Promise<ShopName | null> {
  const query = `#graphql
    query GetShopName {
      shop {
        name
      }
    }
    `;

  try {
    const response = await graphql(query);
    const result = await response.json();
    if (!result.data?.shop?.name) {
      return null;
    }
    return result.data?.shop?.name;
  } catch (error) {
    throw error;
  }
}
// Get theme id
export async function getThemeId(graphql: AdminGraphqlClient): Promise<ThemeId | null> {
  const query = `#graphql
          query GetThemeId {
            themes(first: 1, roles: [MAIN]) {
              nodes {
                id
              }
            }
          }
          `;

  try {
    const response = await graphql(query);
    const result = await response.json();
    if (!result.data?.themes?.nodes?.[0] || !result.data?.themes?.nodes?.[0].id) {
      return null;
    }
    return extractNumericId(result.data?.themes?.nodes?.[0].id);
  } catch (error) {
    throw error;
  }
}
