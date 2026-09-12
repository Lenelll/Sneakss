import type { ProductReview, ReviewSummary } from "./types";

/** Aggregates a list of reviews. Shared by the server store and the client. */
export function summarizeReviews(
  reviews: readonly ProductReview[],
): ReviewSummary {
  const distribution: [number, number, number, number, number] = [
    0, 0, 0, 0, 0,
  ];
  let total = 0;
  let photoCount = 0;
  let fitAnswers = 0;
  let trueToSize = 0;

  for (const review of reviews) {
    distribution[review.rating - 1] += 1;
    total += review.rating;
    photoCount += review.photos.length;

    if (review.fit) {
      fitAnswers += 1;

      if (review.fit === "true") {
        trueToSize += 1;
      }
    }
  }

  return {
    count: reviews.length,
    average:
      reviews.length > 0 ? Math.round((total / reviews.length) * 10) / 10 : 0,
    distribution,
    photoCount,
    trueToSizePercent:
      fitAnswers > 0 ? Math.round((trueToSize / fitAnswers) * 100) : null,
  };
}
