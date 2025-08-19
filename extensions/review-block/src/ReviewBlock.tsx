import { BlockStack, Box, Button, InlineStack, Text, Badge, Image, Divider, Icon, ProgressIndicator } from "@shopify/ui-extensions-react/admin";
import { useEffect, useState } from "react";
import type { Review } from "../../../app/models/schemas";
import type { ProductAverage, ProductReviewStatus } from "../../../app/types/product.metafield";

const COL = { AVA: 156, BODY: 200, STARS: 100, ACT: 141 };
const TOTAL = COL.AVA + COL.BODY + COL.STARS + COL.ACT;
const ROW_H = 48;

export function getBadgeTone(status: string) {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "info";
    case "denied":
      return "warning";
    case "spam":
      return "critical";
    default:
      return "info";
  }
}

interface ReviewWithCustomer extends Review {
  customer: { firstName: string; lastName: string; emailAddress: string };
}

export default function ReviewBlock({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ReviewWithCustomer[] | undefined>();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [productAverageInfo, setProductAverageInfo] = useState<ProductAverage | undefined>();
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${productId}`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const { reviews, productInfo } = await res.json();
        setReviews(reviews);
        setProductAverageInfo(productInfo);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    })();
  }, [productId]);
  console.log({ productAverageInfo });
  const handleStatusChange = async (id: string, status: ProductReviewStatus) => {
    setOpenMenuId(null);
    setLoadingId(id);
    try {
      setReviews((prev) => prev?.map((r) => (r.id === id ? { ...r, status } : r)));
      const res = await fetch(`/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: id, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      console.error("Failed to update review");
    } finally {
      setLoadingId(null);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const filled = Math.floor(rating);
    for (let i = 0; i < filled; i++) stars.push(<Icon key={`sf-${i}`} name="StarFilledMinor" />);
    for (let i = filled; i < 5; i++) stars.push(<Icon key={`so-${i}`} name="StarOutlineMinor" />);
    return stars;
  };

  if (!reviews) {
    return (
      <Box blockSize="100%" inlineSize="100%">
        <ProgressIndicator size="small-200" tone="default" />
      </Box>
    );
  }

  return (
    <Box maxInlineSize="100%" maxBlockSize="100%">
      {reviews.map((review, idx) => {
        const isOpen = openMenuId === review.id;

        return (
          <Box key={review.id} padding="base">
            <Box maxInlineSize="100%">
              <Box minInlineSize={TOTAL}>
                <InlineStack gap="none" inlineAlignment="start" blockAlignment="center">
                  <Box inlineSize={COL.AVA} minInlineSize={COL.AVA} blockSize={ROW_H} paddingInlineEnd="base">
                    <InlineStack gap="base" blockAlignment="center" minInlineSize={0}>
                      <Box inlineSize={35} blockSize={35}>
                        <Image src="https://cdn-icons-png.flaticon.com/512/847/847969.png" alt={review.customer.firstName} />
                      </Box>
                      <BlockStack gap="none" minInlineSize={120}>
                        <Text fontWeight="bold" textOverflow="ellipsis">
                          {review.customer.firstName} {review.customer.lastName}
                        </Text>
                        <Box minInlineSize={0}>
                          <Text textOverflow="ellipsis">{review.customer.emailAddress}</Text>
                        </Box>
                      </BlockStack>
                    </InlineStack>
                  </Box>

                  <Box inlineSize={COL.BODY} minInlineSize={COL.BODY} blockSize={ROW_H} paddingInlineEnd="base">
                    <BlockStack gap="none" minInlineSize={0}>
                      <InlineStack gap="none" blockAlignment="center" minInlineSize={0}>
                        <Box minInlineSize={120}>
                          <Text fontWeight="bold" textOverflow="ellipsis">
                            {review.title}
                          </Text>
                        </Box>
                        <Box minInlineSize={72}>
                          <Badge size="small-100" tone={getBadgeTone(review.status)}>
                            {review.status}
                          </Badge>
                        </Box>
                      </InlineStack>
                      <Box minInlineSize={0}>
                        <Text textOverflow="ellipsis">{review.body}</Text>
                      </Box>
                    </BlockStack>
                  </Box>

                  {/* 3) Stars */}
                  <Box inlineSize={COL.STARS} minInlineSize={COL.STARS} blockSize={ROW_H} paddingInlineEnd="base">
                    <InlineStack gap="none" blockAlignment="center">
                      {renderStars(review.rating)}
                    </InlineStack>
                  </Box>

                  {/* 4) Buttons */}
                  <Box inlineSize={COL.ACT} minInlineSize={COL.ACT} blockSize={ROW_H}>
                    <InlineStack gap="base" inlineAlignment="end" blockAlignment="center">
                      {review.status === "pending" && (
                        <Button
                          tone="default"
                          accessibilityLabel="Approve"
                          onPress={() => handleStatusChange(review.id, "approved")}
                          disabled={loadingId === review.id}
                        >
                          Approve
                        </Button>
                      )}

                      <Button
                        disabled={review.status === "spam" || review.status === "denied"}
                        variant="secondary"
                        accessibilityLabel="More actions"
                        onPress={() => setOpenMenuId((prev) => (prev === review.id ? null : review.id))}
                      >
                        <Icon name="HorizontalDotsMinor" tone="inherit" />
                      </Button>
                    </InlineStack>
                  </Box>
                </InlineStack>
              </Box>
            </Box>

            {isOpen && review.status !== "spam" && (
              <InlineStack inlineAlignment="end">
                <BlockStack gap="small" inlineAlignment="end">
                  {review.status === "pending" && (
                    <Button
                      variant="tertiary"
                      accessibilityLabel="Denied"
                      onPress={() => handleStatusChange(review.id, "denied")}
                      disabled={loadingId === review.id}
                    >
                      Denied
                    </Button>
                  )}
                  <Button
                    variant="tertiary"
                    accessibilityLabel="Mark as spam"
                    onPress={() => handleStatusChange(review.id, "spam")}
                    disabled={loadingId === review.id}
                  >
                    Mark as spam
                  </Button>
                  <Box blockSize={10} />
                </BlockStack>
              </InlineStack>
            )}

            {idx < reviews.length - 1 && <Divider />}
          </Box>
        );
      })}

      {reviews.length === 0 && (
        <Box>
          <Text>No reviews found</Text>
        </Box>
      )}

      <Box blockSize="100%" inlineSize="100%">
        <Button variant="primary" onPress={() => console.log("Add review")}>
          Add review
        </Button>
      </Box>
    </Box>
  );
}
