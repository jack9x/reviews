// (async () => {
//   const el = document.getElementById("reviews-root");
//   if (!el) {
//     console.warn("Not Found #reviews-root.");
//     return;
//   }

//   const productId = el.dataset.productId;
//   if (!productId) {
//     console.error("No productId found on #reviews-root");
//     return;
//   }

//   try {
//     const res = await fetch(`/apps/reviews?productId=${productId}`, {
//       method: "GET",
//       headers: { Accept: "application/json" },
//     });

//     if (!res.ok) {
//       console.error("Proxy request failed", res.status);
//       return;
//     }

//     const { filteredReviews, customers, error } = await res.json();
//     if (error) {
//       console.error("API error:", error);
//       return;
//     }

//     window.__REVIEWS_DATA__ = { filteredReviews, customers };
//     document.dispatchEvent(new CustomEvent("reviewsDataLoaded"));
//   } catch (err) {
//     console.error("Error fetching reviews:", err);
//   }
// })();
export async function postReview({ productId, rating, title, body, shop, authorId, fullName, email }) {
  try {
    const res = await fetch(`/apps/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        productId,
        rating,
        title,
        body,
        shop,
        authorId,
        fullName,
        email,
      }),
    });

    if (!res.ok) {
      console.error(" Post review failed:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    console.log("Review posted successfully:", data);
    return data;
  } catch (error) {
    console.error("Error posting review:", error);
    return null;
  }
}
