import { useState } from "react";
import StarRating from "./star-rating";
import { Layout, Text, Button, TextField, Checkbox, FormLayout, DropZone, ProgressBar, Avatar, Divider, Box } from "@shopify/polaris";
import type { ReviewWidgetSettings } from "app/models/schemas";

interface Review {
  id: number;
  author: string;
  date: string;
  rating: number;
  content: string;
  media: { type: "image" | "video"; url: string }[];
}

// Static reviews with optional media
const mockReviews: Review[] = [
  {
    id: 1,
    author: "JohnDoe",
    date: "July 15, 2025",
    rating: 5,
    content: "This product exceeded my expectations! The quality is outstanding and it's exactly what I was looking for.",
    media: [
      { type: "image", url: "https://picsum.photos/seed/123/400/300" },
      { type: "video", url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
      { type: "image", url: "https://picsum.photos/seed/456/400/300" },
    ],
  },
  {
    id: 2,
    author: "JaneSmith",
    date: "July 10, 2025",
    rating: 4,
    content: "Great value for money. The material feels premium and durable. Would buy again!",
    media: [], // No media for this review
  },
  {
    id: 3,
    author: "AlexBrown",
    date: "July 5, 2025",
    rating: 3,
    content: "Not quite what I expected, but still a decent product. The color is slightly different from the photos.",
    media: [
      { type: "video", url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
      { type: "image", url: "https://picsum.photos/seed/1006/400/300" },
    ],
  },
  {
    id: 4,
    author: "SarahWilson",
    date: "June 30, 2025",
    rating: 5,
    content: "Absolutely love this! The design is beautiful and it fits perfectly. Fast shipping too!",
    media: [], // No media for this review
  },
];

const previewStyles = {
  desktop: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mobile: {
    width: "375px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

const mediaSizeOptions = {
  thumbnail: 50,
  medium: 60,
  large: 80,
};

export default function PreviewContent({ mode, reviewWidgetSettings }: { mode: "desktop" | "mobile"; reviewWidgetSettings: ReviewWidgetSettings }) {
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: "",
    name: "",
    email: "",
    content: "",
    saveInfo: false,
  });

  // Calculate rating statistics
  const totalReviews = mockReviews.length;
  const averageRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => mockReviews.filter((review) => review.rating === rating).length);
  const mediaSize = mediaSizeOptions[reviewWidgetSettings.mediaSize];

  return (
    <div style={previewStyles[mode]}>
      <Layout>
        {reviewWidgetSettings.showSummary && (
          <Layout.Section>
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "1rem",
                border: "1px solid #e0e0e0",
                padding: "1.25rem",
                borderRadius: "8px",
                maxWidth: "400px",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "40px", fontWeight: "600", lineHeight: "36px" }}>{averageRating.toFixed(2)}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}></div>
                <span style={{ fontSize: "16px", fontWeight: "400", lineHeight: "24px", whiteSpace: "pre" }}>{totalReviews} reviews</span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  flex: 1,
                }}
              >
                {[5, 4, 3, 2, 1].map((rating, index) => (
                  <div
                    key={rating}
                    style={{
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      color: "#555",
                    }}
                  >
                    <div
                      style={{
                        flexBasis: "40px",
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      <Text variant="bodySm" tone="subdued" as="span">
                        {rating} ★
                      </Text>
                    </div>
                    <div
                      style={{
                        flexGrow: 1,
                        backgroundColor: "#f0f0f0",
                        borderRadius: "5px",
                        height: "8px",
                      }}
                    >
                      <ProgressBar progress={totalReviews > 0 ? (ratingCounts[index] / totalReviews) * 100 : 0} size="small" />
                    </div>
                    <div
                      style={{
                        textAlign: "left",
                        flexShrink: 0,
                      }}
                    >
                      <Text variant="bodySm" tone="subdued" as="span">
                        {ratingCounts[index]}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Layout.Section>
        )}

        <Layout.Section variant="oneThird">
          {/* Customer Reviews */}
          <Box>
            <div>
              <Text variant="headingLg" as="h3">
                Customer reviews
              </Text>

              <div style={{ paddingTop: "18px", paddingRight: `${mode === "mobile" ? "0px" : "18px"}` }}>
                {mockReviews.map((review, index) => (
                  <div key={review.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <div style={{ display: "flex" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Avatar name={review.author} size="lg" />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: ".25rem" }}>
                          <div>
                            <Text variant="bodyMd" fontWeight="semibold" as="p">
                              {review.author}
                            </Text>
                          </div>
                          <div>
                            <StarRating rating={review.rating} size={12} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "18px" }}>
                        <Text variant="bodySm" tone="subdued" as="span">
                          {review.date}
                        </Text>
                      </div>
                    </div>
                    <div>
                      <Text variant="bodyMd" as="p">
                        {review.content}
                      </Text>
                      <div style={{ paddingTop: "18px", display: "flex", gap: "4px" }}>
                        {reviewWidgetSettings.allowMedia &&
                          review.media.map((item, i) =>
                            item.type === "video" ? (
                              <video
                                key={`video-${review.id}-${i}`}
                                width={mediaSize}
                                height={mediaSize}
                                controls
                                playsInline
                                style={{
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                  cursor: "pointer",
                                  border: "2px solid #f1f1f1",
                                  transition: "transform 0.2s ease",
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                              >
                                <source src={item.url} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <img
                                key={`image-${review.id}-${i}`}
                                src={item.url}
                                alt="Review media"
                                style={{
                                  width: mediaSize,
                                  height: mediaSize,
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                  cursor: "pointer",
                                  border: "2px solid #f1f1f1",
                                  transition: "transform 0.2s ease",
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                              />
                            ),
                          )}
                      </div>
                    </div>
                    {index < mockReviews.length - 1 && (
                      <div style={{ padding: "18px 0px" }}>
                        <Divider borderColor="border-secondary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Box>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          {/* Average Score */}
          <Box>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                marginTop: `${mode === "mobile" ? "30px" : "0px"}`,
              }}
            >
              <Text variant="headingLg" as="h3">
                Average score
              </Text>
              <div>
                <StarRating rating={averageRating} size={18} />
                <Text variant="bodyMd" tone="subdued" as="span">
                  {averageRating.toFixed(1)} out of 5
                </Text>
              </div>
            </div>
            <div style={{ paddingTop: "18px" }}>
              <Text variant="bodyMd" tone="subdued" as="p">
                Your email address will not be published. Required fields are marked *
              </Text>
              <FormLayout>
                {/* Rating */}
                <FormLayout.Group>
                  <div style={{ paddingTop: "18px" }}>
                    <Text variant="bodyMd" fontWeight="medium" as="p">
                      Your rating
                    </Text>
                    <div className="mt-2">
                      <StarRating
                        rating={newReview.rating}
                        interactive
                        onRatingChange={(rating) => setNewReview({ ...newReview, rating })}
                        size={30}
                      />
                    </div>
                  </div>
                </FormLayout.Group>

                {/* Title */}
                <TextField
                  label="Title (optional)"
                  value={newReview.title}
                  onChange={(value) => setNewReview({ ...newReview, title: value })}
                  placeholder="Maximum 60 characters"
                  autoComplete="off"
                />

                {/* Upload Media */}
                {reviewWidgetSettings.allowMedia && (
                  <FormLayout.Group>
                    <div>
                      <Text variant="bodyMd" fontWeight="medium" as="p">
                        Upload media
                      </Text>
                      <div style={{ width: "50%", margin: "10px 0px" }}>
                        <DropZone onDrop={() => { }} accept="image/*,video/*">
                          <DropZone.FileUpload />
                        </DropZone>
                      </div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        You can upload jpg/png & video (maximum 2000kbs)
                      </Text>
                    </div>
                  </FormLayout.Group>
                )}

                {/* Name */}
                <TextField
                  label="Name *"
                  value={newReview.name}
                  onChange={(value) => setNewReview({ ...newReview, name: value })}
                  placeholder="Enter your fullname"
                  autoComplete="name"
                />

                {/* Email */}
                <TextField
                  label="Email *"
                  type="email"
                  value={newReview.email}
                  onChange={(value) => setNewReview({ ...newReview, email: value })}
                  placeholder="Enter your email"
                  autoComplete="email"
                />

                {/* Review Content */}
                <TextField
                  label="Your review *"
                  value={newReview.content}
                  onChange={(value) => setNewReview({ ...newReview, content: value })}
                  placeholder="Write your review..."
                  multiline={6}
                  autoComplete="off"
                />

                {/* Save Info Checkbox */}
                <Checkbox
                  label="Save my name, email, and website in this browser for the next time I comment."
                  checked={newReview.saveInfo}
                  onChange={(checked) => setNewReview({ ...newReview, saveInfo: checked })}
                />

                {/* Submit Button */}
                <Button submit variant="primary">
                  Submit review
                </Button>
              </FormLayout>
            </div>
          </Box>
        </Layout.Section>
      </Layout>
    </div>
  );
}