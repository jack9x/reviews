import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getCustomerInfo, getReviews, updateReviewStatus } from "../models/review.server";
import { getProductAverageMetafield } from "../models/product.metafield.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, cors } = await authenticate.admin(request);
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  try {
    const allReviews = await getReviews(admin.graphql);

    let filtered = allReviews.filter((r: any) => r.productId === productId);

    for (const review of filtered) {
      const customer = await getCustomerInfo(admin.graphql, review.authorId);
      filtered = filtered.map((r: any) => ({
        ...r,
        customer: customer,
      }));
    }

    const productMetafield = await getProductAverageMetafield(admin.graphql, productId || "");
    const productInfo = productMetafield?.value ? JSON.parse(productMetafield.value) : null;

    return cors(
      new Response(JSON.stringify({ reviews: filtered, productInfo }), {
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  } catch (error) {
    console.error(error);

    return cors(
      new Response(JSON.stringify({ error: "Failed to fetch reviews" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  }
}

// POST: update review status
export async function action({ request }: ActionFunctionArgs) {
  const { admin, cors } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return cors(
      new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
  const { reviewId, status } = await request.json();

  if (!reviewId || !status) {
    return cors(
      new Response(JSON.stringify({ error: !reviewId ? "Missing review ID" : "Missing status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  try {
    await updateReviewStatus(admin.graphql, reviewId, status);

    return cors(
      new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  } catch (error) {
    console.error(error);
    return cors(
      new Response(JSON.stringify({ error: "Failed to update review" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
}
