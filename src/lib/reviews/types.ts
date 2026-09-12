import type { EuSize } from "../types";

export const REVIEW_FITS = ["small", "true", "large"] as const;

export type ReviewFit = (typeof REVIEW_FITS)[number];

export const REVIEW_FIT_LABELS: Readonly<Record<ReviewFit, string>> = {
  small: "Runs small",
  true: "True to size",
  large: "Runs large",
};

export const REVIEW_LIMITS = {
  maxPhotos: 3,
  /** Per-photo cap after client-side compression, with headroom. */
  maxPhotoBytes: 1_500_000,
  /** Whole multipart body. Kept under the Vercel 4.5 MB function limit. */
  maxBodyBytes: 4_000_000,
  titleMin: 3,
  titleMax: 80,
  bodyMin: 10,
  bodyMax: 1_200,
  nameMin: 2,
  nameMax: 40,
} as const;

export type ReviewPhotoContentType = "image/jpeg" | "image/png" | "image/webp";

export interface ReviewPhoto {
  readonly id: string;
  readonly width: number;
  readonly height: number;
}

export interface ProductReview {
  readonly id: string;
  readonly productHandle: string;
  readonly productTitle: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly title: string;
  readonly body: string;
  readonly authorName: string;
  /** True when the reviewer was signed in to a Shopify customer account. */
  readonly verified: boolean;
  readonly fit: ReviewFit | null;
  readonly size: EuSize | null;
  readonly photos: readonly ReviewPhoto[];
  readonly createdAt: string;
}

export interface ReviewSummary {
  readonly count: number;
  /** Average rating rounded to one decimal, or 0 when there are no reviews. */
  readonly average: number;
  /** Index 0 holds the number of 1-star reviews, index 4 the 5-star count. */
  readonly distribution: readonly [number, number, number, number, number];
  readonly photoCount: number;
  /** Share of reviewers who said the pair fits true to size, 0-100. */
  readonly trueToSizePercent: number | null;
}

export interface NewReviewPhoto {
  readonly contentType: ReviewPhotoContentType;
  readonly bytes: Uint8Array;
  readonly width: number;
  readonly height: number;
}

export interface NewReviewInput {
  readonly productHandle: string;
  readonly productTitle: string;
  readonly rating: number;
  readonly title: string;
  readonly body: string;
  readonly authorName: string;
  readonly verified: boolean;
  readonly fit: ReviewFit | null;
  readonly size: EuSize | null;
  readonly reviewerId: string;
  readonly photos: readonly NewReviewPhoto[];
}

export type ReviewStoreKind =
  | "redis-rest"
  | "cloudflare-kv"
  | "file"
  | "memory";
