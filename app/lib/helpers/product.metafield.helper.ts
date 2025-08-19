import type { ProductAverage, ProductReviewStatus } from "../../types/product.metafield";

export function getDefaultProductAverage(): ProductAverage {
  return {
    averageRating: 0,
    count: {
      totalReviews: 0,
      rating: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    },
  };
}

export function updateAverageCalculation(productAverage: ProductAverage, rating: number, status: ProductReviewStatus): ProductAverage {
  if (status !== "approved") return productAverage;

  const star = String(rating) as "1" | "2" | "3" | "4" | "5";
  productAverage.count.rating[star] = (productAverage.count.rating[star] || 0) + 1;
  productAverage.count.totalReviews += 1;

  const totalStars = Object.entries(productAverage.count.rating).reduce((sum, [star, count]) => sum + Number(star) * count, 0);

  productAverage.averageRating = totalStars / productAverage.count.totalReviews;

  return productAverage;
}
