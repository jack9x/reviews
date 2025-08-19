import { postReview } from "./reviews-proxy.js";

// Handle Submit
const submitBtn = document.getElementById("submit-review");
const reviewForm = document.getElementById("review-form");

document.getElementById("submit-review")?.addEventListener("click", async () => {
  const productId = document.getElementById("reviews-root").dataset.productId;
  const authorId = document.getElementById("reviews-root").dataset.customerId ?? "";
  const shop = document.getElementById("reviews-root").dataset.shopDomain ?? "";
  const title = document.getElementById("review-title").value.trim();
  const body = document.getElementById("review-body").value.trim();
  const fullName = document.getElementById("review-name").value.trim();
  const email = document.getElementById("review-email").value.trim();
  const starContainer = document.querySelector(".star-rating");
  const rating = parseInt(starContainer.dataset.rating, 10) || 1;

  if (!title || !body || !rating || !fullName || !email) {
    alert("Please fill in all fields to review");
    return;
  }
  if (authorId == "") {
    alert("Please login to review");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.6";
    submitBtn.querySelector("span").textContent = "Submitting...";

    const result = await postReview({
      productId,
      rating,
      title,
      body,
      shop,
      authorId,
      fullName,
      email,
    });

    console.log("Result from postReview:", result);

    // reset form
    document.getElementById("review-title").value = "";
    document.getElementById("review-body").value = "";
    document.getElementById("review-name").value = "";
    document.getElementById("review-email").value = "";
    starContainer.dataset.rating = 0;
    createSuccessMessage();
  } catch (err) {
    console.error("Error submitting review:", err);
    alert("Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.style.opacity = "1";
    submitBtn.querySelector("span").textContent = "Submit review";
  }
});

function createSuccessMessage() {
  const successMsg = document.createElement("div");
  successMsg.style.cssText = "margin-top:12px; padding:10px; border-radius:6px; background:#B4FED2; color:#0a6e3b; font-size:14px;";
  successMsg.textContent = "Thank you! Your review has been submitted successfully.";

  reviewForm.appendChild(successMsg);

  setTimeout(() => {
    successMsg.style.transition = "opacity 0.5s ease";
    successMsg.style.opacity = "0";
    setTimeout(() => successMsg.remove(), 500);
  }, 5000);
}

// function onDataReady() {
//   const { filteredReviews = [], customers = {} } = window.__REVIEWS_DATA__ || {};
//   window.__REVIEW_STATS__ = {reviews: filteredReviews};
//   document.dispatchEvent(new CustomEvent("reviewStatsReady"));
// }

// if (window.__REVIEWS_DATA__) onDataReady();
// else document.addEventListener("reviewsDataLoaded", onDataReady, { once: true });
