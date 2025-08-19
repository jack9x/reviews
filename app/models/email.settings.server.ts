import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import { type EmailSettings } from "./schemas";
import { buildMetaobjectEmailSettingsFields, transformMetaobjectToEmailSettings } from "app/lib/helpers/email.helper";

// Create metaobject definition
export async function createEmailSettingsMetaobjectDefinition(graphql: AdminGraphqlClient) {
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
      type: "$app:email_settings",
      name: "Email Settings",
      description: "Email Settings",
      fieldDefinitions: [
        {
          key: "daySend",
          name: "Day Send",
          description: "Day of the month to send the email",
          type: "number_integer",
        },
        {
          key: "emailSubject",
          name: "Email Subject",
          description: "Email subject",
          type: "single_line_text_field",
        },
        {
          key: "emailHeading",
          name: "Email Heading",
          description: "Email heading",
          type: "single_line_text_field",
        },
        {
          key: "emailContent",
          name: "Email Content",
          description: "Email content",
          type: "rich_text_field",
        },
        {
          key: "emailFooter",
          name: "Email Footer",
          description: "Email footer",
          type: "single_line_text_field",
        },
        {
          key: "reviewDiscountWhen",
          name: "Review Discount When",
          description: "Review discount when",
          type: "single_line_text_field",
        },
        {
          key: "reviewDiscountCode",
          name: "Review Discount Code",
          description: "Review discount code",
          type: "single_line_text_field",
        },
        {
          key: "emailSubjectDiscount",
          name: "Email Subject Discount",
          description: "Email subject discount",
          type: "single_line_text_field",
        },
        {
          key: "emailHeadingDiscount",
          name: "Email Heading Discount",
          description: "Email heading discount",
          type: "single_line_text_field",
        },
        {
          key: "emailContentDiscount",
          name: "Email Content Discount",
          description: "Email content discount",
          type: "rich_text_field",
        },
        {
          key: "emailFooterDiscount",
          name: "Email Footer Discount",
          description: "Email footer discount",
          type: "single_line_text_field",
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
        "Failed to create email settings metaobject definition :" + JSON.stringify(result.data.metaobjectDefinitionCreate.userErrors, null, 2),
      );
    }
    return result.data.metaobjectDefinitionCreate.metaobjectDefinition;
  } catch (error) {
    throw error;
  }
}

// Check if definition already exists
export async function checkEmailSettingsMetaobjectDefinitionExists(graphql: AdminGraphqlClient): Promise<boolean> {
  const query = `#graphql
      query CheckEmailSettingsMetaobjectDefinition {
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
    return definitions.some((def: any) => def.type.endsWith("--email_settings"));
  } catch (error) {
    console.error("Failed to check email settings metaobject definition:", error);
    return false;
  }
}

// Create metaobject definition if not exists
export async function createEmailSettingsDefinitionIfNotExists(graphql: AdminGraphqlClient) {
  const exists = await checkEmailSettingsMetaobjectDefinitionExists(graphql);
  if (!exists) {
    await createEmailSettingsMetaobjectDefinition(graphql);
  }
}

// Save or update review widget settings
export async function saveEmailSettings(graphql: AdminGraphqlClient, settings: EmailSettings): Promise<EmailSettings> {
  // Ensure metaobject definition exists
  const definitionExists = await checkEmailSettingsMetaobjectDefinitionExists(graphql);

  if (!definitionExists) {
    await createEmailSettingsMetaobjectDefinition(graphql);
  }

  // Check if review widget settings metaobject exists
  const existingSettings = await getExistingEmailSettings(graphql);

  let metaobjectId: string | null = null;

  if (existingSettings && existingSettings.nodes.length > 0) {
    metaobjectId = existingSettings.nodes[0].id;
  }

  try {
    if (metaobjectId) {
      // Update existing metaobject
      return await updateEmailSettings(graphql, metaobjectId, settings);
    } else {
      // Create new metaobject
      return await createEmailSettingsMetaobject(graphql, settings);
    }
  } catch (error) {
    throw new Error(`Unable to save email settings: ${error}`);
  }
}

// Get review widget settings
export async function getExistingEmailSettings(graphql: AdminGraphqlClient) {
  const query = `#graphql
            query GetEmailSettings {
              metaobjects(type: "$app:email_settings", first: 1) {
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

export async function getEmailSettings(graphql: AdminGraphqlClient): Promise<EmailSettings | null> {
  const existingSettings = await getExistingEmailSettings(graphql);
  if (existingSettings && existingSettings.nodes && existingSettings.nodes.length > 0) {
    return transformMetaobjectToEmailSettings(existingSettings.nodes[0]);
  }
  return null;
}

// Helper function to create review widget settings metaobject
async function createEmailSettingsMetaobject(graphql: AdminGraphqlClient, settings: EmailSettings): Promise<EmailSettings> {
  const mutation = `#graphql
      mutation CreateEmailSettingsMetaobject($metaobject: MetaobjectCreateInput!) {
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
      type: "$app:email_settings", // Use app-reserved type
      handle: `email-settings-${Date.now()}`,
      fields: buildMetaobjectEmailSettingsFields(settings),
    },
  };

  const response = await graphql(mutation, { variables });
  const result = await response.json();

  if (result.data?.metaobjectCreate?.userErrors?.length > 0) {
    const errors = result.data.metaobjectCreate.userErrors;
    throw new Error(`Failed to create email settings metaobject: ${JSON.stringify(errors)}`);
  }

  if (result.data?.metaobjectCreate?.metaobject) {
    return transformMetaobjectToEmailSettings(result.data.metaobjectCreate.metaobject);
  }

  throw new Error("Failed to create settings");
}

// Helper function to update existing review widget settings metaobject
async function updateEmailSettings(graphql: AdminGraphqlClient, metaobjectId: string, settings: EmailSettings): Promise<EmailSettings> {
  const mutation = `#graphql
      mutation UpdateEmailSettingsMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
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
      fields: buildMetaobjectEmailSettingsFields(settings),
    },
  };

  const response = await graphql(mutation, { variables });
  const result = await response.json();

  if (result.data?.metaobjectUpdate?.userErrors?.length > 0) {
    const errors = result.data.metaobjectUpdate.userErrors;
    throw new Error(`Failed to update email settings metaobject: ${JSON.stringify(errors)}`);
  }

  const updatedMetaobject = result.data.metaobjectUpdate.metaobject;
  return transformMetaobjectToEmailSettings(updatedMetaobject);
}
