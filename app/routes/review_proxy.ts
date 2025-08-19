import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

import { createReview, getCustomerInfo, getReviews } from "app/models/review.server";
import type { Review } from "app/models/schemas";
import { authenticate } from "app/shopify.server";

export function filterReviewsByProductId(reviews: Review[], productId: string): Review[] {
  return reviews.filter((review) => review.productId === productId);
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.public.appProxy(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId") ?? "";

  try {
    const reviews = await getReviews(admin.graphql);
    const filteredReviews = productId ? filterReviewsByProductId(reviews, productId) : reviews;
    const customers: Record<string, { firstName: string; lastName: string; emailAddress: string }> = {};

    await Promise.all(
      filteredReviews.map(async (review) => {
        if (!customers[review.authorId]) {
          customers[review.authorId] = await getCustomerInfo(admin.graphql, review.authorId);
        }
      }),
    );

    return Response.json({ filteredReviews, customers });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.public.appProxy(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const data = await request.json();

    if (!data.productId || !data.rating || !data.title || !data.body || !data.authorId || !data.shop) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newReview = await createReview(admin.graphql, {
      rating: data.rating,
      title: data.title,
      body: data.body,
      shop: data.shop,
      productId: data.productId,
      authorId: data.authorId,
      fullName: data.fullName,
      email: data.email,
    });

    return Response.json({ success: true, review: newReview });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
