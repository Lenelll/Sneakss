import { NextRequest, NextResponse } from "next/server";

import { getCommerceProduct } from "@/lib/catalog-source";
import { getReviewerIdentity } from "@/lib/reviews/reviewer";
import {
  createReview,
  getProductReviews,
  normalizeFit,
  ReviewValidationError,
} from "@/lib/reviews/store";
import {
  REVIEW_LIMITS,
  type NewReviewPhoto,
  type ReviewPhotoContentType,
} from "@/lib/reviews/types";
import { getCustomerSessionState } from "@/lib/shopify/customer-auth";

export const dynamic = "force-dynamic";

const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,253}[a-z0-9])?$/;

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function errorResponse(message: string, status: number) {
  return noStore(NextResponse.json({ error: message }, { status }));
}

function detectImageType(bytes: Uint8Array): ReviewPhotoContentType | null {
  if (bytes.length < 12) {
    return null;
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);

  if (riff === "RIFF" && webp === "WEBP") {
    return "image/webp";
  }

  return null;
}

function fieldText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function fieldInt(formData: FormData, name: string): number {
  const value = Number.parseInt(fieldText(formData, name), 10);
  return Number.isFinite(value) ? value : 0;
}

async function readPhotos(formData: FormData): Promise<NewReviewPhoto[]> {
  const files = formData
    .getAll("photos")
    .filter(
      (entry): entry is File =>
        typeof entry === "object" && entry !== null && "arrayBuffer" in entry,
    )
    .filter((file) => file.size > 0);

  if (files.length > REVIEW_LIMITS.maxPhotos) {
    throw new ReviewValidationError(
      `You can attach up to ${REVIEW_LIMITS.maxPhotos} photos.`,
    );
  }

  const photos: NewReviewPhoto[] = [];

  for (const [index, file] of files.entries()) {
    if (file.size > REVIEW_LIMITS.maxPhotoBytes) {
      throw new ReviewValidationError(
        "One of your photos is too large. Please choose a smaller image.",
        413,
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = detectImageType(bytes);

    if (!contentType) {
      throw new ReviewValidationError(
        "Photos must be JPG, PNG or WebP images.",
        415,
      );
    }

    photos.push({
      contentType,
      bytes,
      width: fieldInt(formData, `photoWidth${index}`),
      height: fieldInt(formData, `photoHeight${index}`),
    });
  }

  return photos;
}

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle")?.trim() ?? "";

  if (!HANDLE_PATTERN.test(handle)) {
    return errorResponse("A product handle is required.", 400);
  }

  const payload = await getProductReviews(handle);
  return noStore(NextResponse.json(payload));
}

export async function POST(request: NextRequest) {
  const declaredLength = Number.parseInt(
    request.headers.get("content-length") ?? "0",
    10,
  );

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > REVIEW_LIMITS.maxBodyBytes
  ) {
    return errorResponse(
      "Your review is too large. Try fewer or smaller photos.",
      413,
    );
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.startsWith("multipart/form-data")) {
    return errorResponse("The review could not be read.", 415);
  }

  // Reviews are tied to the signed-in customer account.
  const sessionState = await getCustomerSessionState();

  if (sessionState.status !== "valid") {
    return errorResponse(
      sessionState.status === "refresh-required"
        ? "Your session needs a refresh. Reload the page and try again."
        : "Sign in to your account to post a review.",
      401,
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("The review could not be read.", 400);
  }

  // Honeypot: real visitors never see or fill this field.
  if (fieldText(formData, "website").trim().length > 0) {
    return errorResponse("The review could not be submitted.", 400);
  }

  const handle = fieldText(formData, "handle").trim();

  if (!HANDLE_PATTERN.test(handle)) {
    return errorResponse("That product could not be found.", 404);
  }

  const [{ product }, reviewer] = await Promise.all([
    getCommerceProduct(handle),
    getReviewerIdentity(sessionState.session),
  ]);

  if (!product) {
    return errorResponse("That product could not be found.", 404);
  }

  try {
    const photos = await readPhotos(formData);
    const review = await createReview({
      productHandle: product.handle,
      productTitle: product.title,
      rating: fieldInt(formData, "rating"),
      title: fieldText(formData, "title"),
      body: fieldText(formData, "body"),
      authorName: reviewer.displayName,
      verified: true,
      fit: normalizeFit(fieldText(formData, "fit")),
      size: null,
      reviewerId: reviewer.id,
      photos,
    });

    return noStore(NextResponse.json({ review }, { status: 201 }));
  } catch (error) {
    if (error instanceof ReviewValidationError) {
      return errorResponse(error.message, error.status);
    }

    console.error("[reviews] Failed to save a review.", error);
    return errorResponse(
      "Your review could not be saved right now. Please try again.",
      500,
    );
  }
}
