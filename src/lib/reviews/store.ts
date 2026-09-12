import "server-only";

import { EU_SIZE_SCALE, type EuSize } from "../types";
import { getReviewKv } from "./kv";
import { summarizeReviews } from "./summary";
import {
  REVIEW_FITS,
  REVIEW_LIMITS,
  type NewReviewInput,
  type ProductReview,
  type ReviewFit,
  type ReviewPhotoContentType,
  type ReviewStoreKind,
  type ReviewSummary,
} from "./types";

const REVIEW_KEY_PREFIX = "reviews:v1:";
const PHOTO_KEY_PREFIX = "review-photo:v1:";
const REVIEWER_KEY_PREFIX = "reviewer:v1:";
const REVIEWER_COOLDOWN_MS = 60_000;

/** Stored shape: the public review plus the private reviewer identifier. */
type StoredReview = ProductReview & { readonly reviewerId: string };

type StoredPhoto = {
  readonly contentType: ReviewPhotoContentType;
  readonly data: string;
};

export class ReviewValidationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ReviewValidationError";
    this.status = status;
  }
}

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */

const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,253}[a-z0-9])?$/;
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidReviewId(value: string): boolean {
  return ID_PATTERN.test(value);
}

function reviewKey(handle: string) {
  return `${REVIEW_KEY_PREFIX}${handle}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;

  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

/** Drops control characters except tab, newline and carriage return. */
function stripControlCharacters(value: string): string {
  let output = "";

  for (const character of value) {
    const code = character.charCodeAt(0);

    if ((code >= 32 && code !== 127) || code === 9 || code === 10 || code === 13) {
      output += character;
    }
  }

  return output;
}

function cleanText(value: string, max: number): string {
  return stripControlCharacters(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function toPublic(review: StoredReview): ProductReview {
  const { reviewerId: _reviewerId, ...publicReview } = review;
  void _reviewerId;
  return publicReview;
}

function isStoredReview(value: unknown): value is StoredReview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.productHandle === "string" &&
    typeof candidate.rating === "number" &&
    typeof candidate.title === "string" &&
    typeof candidate.body === "string" &&
    typeof candidate.authorName === "string" &&
    typeof candidate.createdAt === "string" &&
    Array.isArray(candidate.photos)
  );
}

async function readProductReviews(handle: string): Promise<StoredReview[]> {
  const kv = await getReviewKv();
  return parseReviewDocument(await kv.get(reviewKey(handle)));
}

function parseReviewDocument(raw: string | null): StoredReview[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredReview) : [];
  } catch {
    return [];
  }
}

function sortNewest(reviews: readonly StoredReview[]): StoredReview[] {
  return [...reviews].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export { summarizeReviews };

/* ---------------------------------------------------------------------- */
/* Reads                                                                   */
/* ---------------------------------------------------------------------- */

export async function getProductReviews(
  handle: string,
): Promise<{ reviews: ProductReview[]; summary: ReviewSummary }> {
  if (!HANDLE_PATTERN.test(handle)) {
    return { reviews: [], summary: summarizeReviews([]) };
  }

  try {
    const reviews = sortNewest(await readProductReviews(handle)).map(toPublic);
    return { reviews, summary: summarizeReviews(reviews) };
  } catch (error) {
    console.error("[reviews] Failed to read product reviews.", error);
    return { reviews: [], summary: summarizeReviews([]) };
  }
}

/**
 * Returns a summary for every handle that has at least one review.
 * Handles without reviews are omitted so callers can treat "missing" as
 * "no reviews yet".
 */
export async function getReviewSummaries(
  handles: readonly string[],
): Promise<Record<string, ReviewSummary>> {
  const validHandles = Array.from(
    new Set(handles.filter((handle) => HANDLE_PATTERN.test(handle))),
  );

  if (validHandles.length === 0) {
    return {};
  }

  try {
    const kv = await getReviewKv();
    const documents = await kv.getMany(validHandles.map(reviewKey));
    const summaries: Record<string, ReviewSummary> = {};

    documents.forEach((raw, index) => {
      const reviews = parseReviewDocument(raw);

      if (reviews.length > 0) {
        summaries[validHandles[index]] = summarizeReviews(reviews);
      }
    });

    return summaries;
  } catch (error) {
    console.error("[reviews] Failed to read review summaries.", error);
    return {};
  }
}

/** Newest reviews across the given products, for the home-page highlight. */
export async function getRecentReviews(
  handles: readonly string[],
  limit = 6,
): Promise<ProductReview[]> {
  const validHandles = Array.from(
    new Set(handles.filter((handle) => HANDLE_PATTERN.test(handle))),
  );

  if (validHandles.length === 0 || limit <= 0) {
    return [];
  }

  try {
    const kv = await getReviewKv();
    const documents = await kv.getMany(validHandles.map(reviewKey));
    const all = documents.flatMap(parseReviewDocument);
    // Photo reviews first, then newest.
    return sortNewest(all)
      .sort((a, b) => Number(b.photos.length > 0) - Number(a.photos.length > 0))
      .slice(0, limit)
      .map(toPublic);
  } catch (error) {
    console.error("[reviews] Failed to read recent reviews.", error);
    return [];
  }
}

export async function getReviewPhoto(
  id: string,
): Promise<{ contentType: ReviewPhotoContentType; bytes: Uint8Array } | null> {
  if (!isValidReviewId(id)) {
    return null;
  }

  try {
    const kv = await getReviewKv();
    const raw = await kv.get(`${PHOTO_KEY_PREFIX}${id}`);

    if (!raw) {
      return null;
    }

    const stored = JSON.parse(raw) as StoredPhoto;

    if (
      typeof stored.data !== "string" ||
      !["image/jpeg", "image/png", "image/webp"].includes(stored.contentType)
    ) {
      return null;
    }

    return { contentType: stored.contentType, bytes: base64ToBytes(stored.data) };
  } catch (error) {
    console.error("[reviews] Failed to read a review photo.", error);
    return null;
  }
}

export async function getReviewStoreKind(): Promise<ReviewStoreKind> {
  return (await getReviewKv()).kind;
}

/* ---------------------------------------------------------------------- */
/* Writes                                                                  */
/* ---------------------------------------------------------------------- */

export function normalizeFit(value: unknown): ReviewFit | null {
  return typeof value === "string" &&
    (REVIEW_FITS as readonly string[]).includes(value)
    ? (value as ReviewFit)
    : null;
}

export function normalizeSize(value: unknown): EuSize | null {
  const size = typeof value === "string" ? Number(value) : Number.NaN;
  return EU_SIZE_SCALE.includes(size as EuSize) ? (size as EuSize) : null;
}

export async function createReview(
  input: NewReviewInput,
): Promise<ProductReview> {
  if (!HANDLE_PATTERN.test(input.productHandle)) {
    throw new ReviewValidationError("That product could not be found.", 404);
  }

  const rating = Math.trunc(input.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ReviewValidationError("Choose a star rating from 1 to 5.");
  }

  const title = cleanText(input.title, REVIEW_LIMITS.titleMax);
  const body = cleanText(input.body, REVIEW_LIMITS.bodyMax);
  const authorName = cleanText(input.authorName, REVIEW_LIMITS.nameMax);

  if (title.length < REVIEW_LIMITS.titleMin) {
    throw new ReviewValidationError(
      `Give your review a short headline (at least ${REVIEW_LIMITS.titleMin} characters).`,
    );
  }

  if (body.length < REVIEW_LIMITS.bodyMin) {
    throw new ReviewValidationError(
      `Tell us a little more about the pair (at least ${REVIEW_LIMITS.bodyMin} characters).`,
    );
  }

  if (authorName.length < REVIEW_LIMITS.nameMin) {
    throw new ReviewValidationError("Add the name to show with your review.");
  }

  if (input.photos.length > REVIEW_LIMITS.maxPhotos) {
    throw new ReviewValidationError(
      `You can attach up to ${REVIEW_LIMITS.maxPhotos} photos.`,
    );
  }

  const kv = await getReviewKv();
  const reviewerKey = `${REVIEWER_KEY_PREFIX}${input.reviewerId}`;
  const lastReviewAt = Number((await kv.get(reviewerKey)) ?? 0);

  if (Date.now() - lastReviewAt < REVIEWER_COOLDOWN_MS) {
    throw new ReviewValidationError(
      "Please wait a moment before posting another review.",
      429,
    );
  }

  const existing = await readProductReviews(input.productHandle);

  if (existing.some((review) => review.reviewerId === input.reviewerId)) {
    throw new ReviewValidationError(
      "You have already reviewed this pair. Thank you!",
      409,
    );
  }

  const photos = [];

  for (const photo of input.photos) {
    const id = crypto.randomUUID();
    const stored: StoredPhoto = {
      contentType: photo.contentType,
      data: bytesToBase64(photo.bytes),
    };
    await kv.put(`${PHOTO_KEY_PREFIX}${id}`, JSON.stringify(stored));
    photos.push({
      id,
      width: Math.max(0, Math.trunc(photo.width)),
      height: Math.max(0, Math.trunc(photo.height)),
    });
  }

  const review: StoredReview = {
    id: crypto.randomUUID(),
    productHandle: input.productHandle,
    productTitle: cleanText(input.productTitle, 120),
    rating: rating as ProductReview["rating"],
    title,
    body,
    authorName,
    verified: input.verified,
    fit: input.fit,
    size: input.size,
    photos,
    createdAt: new Date().toISOString(),
    reviewerId: input.reviewerId,
  };

  await kv.put(
    reviewKey(input.productHandle),
    JSON.stringify([review, ...existing]),
  );
  await kv.put(reviewerKey, String(Date.now()));

  return toPublic(review);
}
