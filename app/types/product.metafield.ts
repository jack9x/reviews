export type ProductMetafieldConfig = {
  name: string;
  namespace: string;
  key: string;
  type: string;
  description?: string;
  ownerType: "PRODUCT";
  access?: { storefront?: "PUBLIC_READ" | "NONE" };
  validations?: { name: string; value: string }[];
};

export type ProductAverage = {
  averageRating: number;
  count: {
    totalReviews: number;
    rating: Record<"1" | "2" | "3" | "4" | "5", number>;
  };
};

export type ProductReviewStatus = "approved" | "denied" | "spam" | "pending";
