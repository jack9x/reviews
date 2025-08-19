import type { GraphQLClient } from "../shopify/client";

interface OrderInfo {
  id: string;
  name: string;
  email: string;
  customer: {
    id: string;
    defaultEmailAddress: {
      emailAddress: string;
    };
    firstName: string;
    lastName: string;
  };
  lineItems: {
    edges: {
      node: {
        id: string;
        variant: {
          id: string;
          product: {
            id: string;
            title: string;
            handle: string;
            media: {
              edges: {
                node: {
                  image: {
                    id: string;
                    url: string;
                    altText: string;
                  };
                };
              }[];
            };
          };
        };
      };
    }[];
  };
}

export const fetchOrderInfo = async (graphql: GraphQLClient, orderId: string): Promise<OrderInfo | null> => {
  const query = `#graphql
        query FetchOrderInfo {
          order(id: "gid://shopify/Order/${orderId}") {
            id
            name
            email
            customer {
                id
                defaultEmailAddress{
                  emailAddress
                }
                firstName
                lastName
            }
            lineItems(first: 100) {
                edges{
                    node{
                        id
                        variant {
                            product {
                                id
                                title
                                handle
                                media(first: 1, sortKey: POSITION) {
                                    edges {
                                        node {
                                            ... on MediaImage {
                                                image {
                                                    id
                                                    url
                                                    altText
                                                }
                                            }
                                        }
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

    return result.data.order || null;
  } catch (err) {
    console.error("Failed to fetch order info", err);
    return null;
  }
};
