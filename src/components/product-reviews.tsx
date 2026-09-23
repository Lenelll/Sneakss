"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  REVIEW_FIT_LABELS,
  REVIEW_FITS,
  REVIEW_LIMITS,
  summarizeReviews,
  type ProductReview,
  type ReviewFit,
  type ReviewSummary,
} from "@/lib/reviews";
import {
  ACCEPTED_PHOTO_TYPES,
  formatReviewDate,
  preparePhoto,
  type PreparedPhoto,
} from "@/lib/reviews/client";

import { RatingStars, StarIcon } from "./rating-stars";

export function reviewPhotoUrl(id: string) {
  return `/api/reviews/photos/${id}`;
}

type LightboxItem = {
  readonly photoId: string;
  readonly caption: string;
  readonly author: string;
};

export type ReviewerInfo = {
  readonly displayName: string;
};

function mergeReviews(
  serverReviews: readonly ProductReview[],
  localReviews: readonly ProductReview[],
): ProductReview[] {
  const seen = new Set(serverReviews.map((review) => review.id));
  const missing = localReviews.filter((review) => !seen.has(review.id));
  return [...missing, ...serverReviews];
}

export function ProductReviews({
  productHandle,
  productTitle,
  initialReviews,
  initialSummary,
  reviewer,
  signInHref,
  storageWarning = false,
}: {
  productHandle: string;
  productTitle: string;
  initialReviews: readonly ProductReview[];
  initialSummary: ReviewSummary;
  /** Signed-in customer, or null when signed out. */
  reviewer: ReviewerInfo | null;
  signInHref: string;
  /** True when the server has no durable review store configured. */
  storageWarning?: boolean;
}) {
  // Reviews created in this session. They are kept even if a server refresh
  // has not caught up yet, so a freshly posted review never disappears.
  const [localReviews, setLocalReviews] = useState<readonly ProductReview[]>(
    [],
  );
  const [photosOnly, setPhotosOnly] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxItem[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  const reviews = useMemo(
    () => mergeReviews(initialReviews, localReviews),
    [initialReviews, localReviews],
  );
  const summary = useMemo(
    () =>
      reviews.length === initialReviews.length
        ? initialSummary
        : summarizeReviews(reviews),
    [initialReviews.length, initialSummary, reviews],
  );

  const allPhotos = useMemo<LightboxItem[]>(
    () =>
      reviews.flatMap((review) =>
        review.photos.map((photo) => ({
          photoId: photo.id,
          caption: review.title,
          author: review.authorName,
        })),
      ),
    [reviews],
  );

  const visibleReviews = photosOnly
    ? reviews.filter((review) => review.photos.length > 0)
    : reviews;

  function openLightbox(items: LightboxItem[], index: number) {
    setLightbox(items);
    setLightboxIndex(index);
  }

  function openForm() {
    setIsFormOpen(true);
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleCreated(review: ProductReview) {
    setLocalReviews((current) => [review, ...current]);
    setIsFormOpen(false);
  }

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="scroll-mt-28 border-t border-line px-5 py-14 sm:px-8 sm:py-20 lg:px-12"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          {/* Summary column */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-bold tracking-[0.16em] text-brand uppercase">
              Customer reviews
            </p>
            <h2
              id="reviews-heading"
              className="mt-2 section-title"
            >
              {summary.count > 0 ? "Worn and rated." : "Be the first to review."}
            </h2>

            {summary.count > 0 ? (
              <div className="mt-7 rounded-none border border-line bg-white p-6">
                <div className="flex flex-wrap items-end gap-5">
                  <p className="text-6xl leading-none font-light tracking-[-0.03em]">
                    {summary.average.toFixed(1)}
                  </p>
                  <div className="pb-1">
                    <RatingStars value={summary.average} size="lg" />
                    <p className="mt-2 text-sm text-muted">
                      Based on {summary.count}{" "}
                      {summary.count === 1 ? "review" : "reviews"}
                      {summary.photoCount > 0
                        ? ` · ${summary.photoCount} customer ${
                            summary.photoCount === 1 ? "photo" : "photos"
                          }`
                        : ""}
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-2" aria-label="Rating breakdown">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = summary.distribution[stars - 1];
                    const percent =
                      summary.count > 0
                        ? Math.round((count / summary.count) * 100)
                        : 0;

                    return (
                      <li
                        key={stars}
                        className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3 text-xs font-semibold"
                      >
                        <span className="flex items-center gap-1 text-muted">
                          {stars}
                          <StarIcon className="h-3 w-3 text-brand" />
                        </span>
                        <span className="h-2 overflow-hidden rounded-full bg-surface-2">
                          <span
                            className="block h-full rounded-full bg-ink"
                            style={{ width: `${percent}%` }}
                          />
                        </span>
                        <span className="text-right text-muted">{count}</span>
                      </li>
                    );
                  })}
                </ul>

                {summary.trueToSizePercent !== null ? (
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="text-[0.65rem] font-bold tracking-[0.16em] text-muted uppercase">
                      Fit feedback
                    </p>
                    <p className="mt-2 text-sm">
                      <span className="font-semibold text-ink">
                        {summary.trueToSizePercent}%
                      </span>{" "}
                      of reviewers say this pair fits true to size.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-5 max-w-md text-base leading-7 text-muted">
                Share how the {productTitle} fits, feels and looks. Add a photo
                if you like. Photos are optional.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {reviewer ? (
                <>
                  <button
                    type="button"
                    onClick={openForm}
                    className="inline-flex min-h-12 items-center justify-center rounded-none bg-ink px-6 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  >
                    Write a review
                  </button>
                  <span className="inline-flex items-center gap-2 rounded-full bg-brand-tint px-3 py-1.5 text-xs font-semibold text-brand">
                    <CheckIcon />
                    Posting as {reviewer.displayName}
                  </span>
                </>
              ) : (
                <>
                  <Link
                    href={signInHref}
                    className="inline-flex min-h-12 items-center justify-center rounded-none bg-ink px-6 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  >
                    Sign in to write a review
                  </Link>
                  <span className="text-xs text-muted">
                    Reviews are posted under your account name.
                  </span>
                </>
              )}
            </div>

            {storageWarning ? (
              <p
                role="status"
                className="mt-5 rounded-none border border-line-strong bg-surface-2 p-4 text-xs leading-5 text-ink-soft"
              >
                Review storage is not configured on this deployment yet, so
                reviews posted now will not be kept. Set the review store
                environment variables and redeploy.
              </p>
            ) : null}
          </div>

          {/* Reviews column */}
          <div>
            {isFormOpen && reviewer ? (
              <div ref={formRef} className="scroll-mt-28">
                <ReviewForm
                  productHandle={productHandle}
                  reviewer={reviewer}
                  onCancel={() => setIsFormOpen(false)}
                  onCreated={handleCreated}
                />
              </div>
            ) : null}

            {allPhotos.length > 0 ? (
              <div className={isFormOpen ? "mt-10" : ""}>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold tracking-[0.12em] uppercase">
                    Customer photos
                  </h3>
                  <p className="text-xs text-muted">{allPhotos.length} total</p>
                </div>
                <ul className="mt-3 flex gap-2 overflow-x-auto pb-2">
                  {allPhotos.map((item, index) => (
                    <li key={item.photoId} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => openLightbox(allPhotos, index)}
                        aria-label={`Open customer photo ${index + 1} of ${allPhotos.length}`}
                        className="relative block aspect-square w-24 overflow-hidden rounded-none border border-line bg-surface-2 transition hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-28"
                      >
                        <Image
                          src={reviewPhotoUrl(item.photoId)}
                          alt=""
                          fill
                          unoptimized
                          sizes="112px"
                          className="object-cover"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {reviews.length > 0 ? (
              <div
                className={`flex flex-wrap items-center justify-between gap-3 ${
                  allPhotos.length > 0 || isFormOpen ? "mt-8" : ""
                }`}
              >
                <p className="text-sm text-muted" aria-live="polite">
                  Showing{" "}
                  <span className="font-bold text-ink">
                    {visibleReviews.length}
                  </span>{" "}
                  of {reviews.length}
                </p>
                {summary.photoCount > 0 ? (
                  <button
                    type="button"
                    aria-pressed={photosOnly}
                    onClick={() => setPhotosOnly((current) => !current)}
                    className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                      photosOnly
                        ? "border-brand bg-brand text-white"
                        : "border-line-strong bg-white text-ink hover:border-brand"
                    }`}
                  >
                    With photos
                  </button>
                ) : null}
              </div>
            ) : null}

            <ul className="mt-5 space-y-5">
              {visibleReviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-none border border-line bg-white p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <RatingStars
                        value={review.rating}
                        label={`${review.rating} out of 5 stars`}
                      />
                      <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
                        {review.title}
                      </h3>
                    </div>
                    <p className="text-xs text-muted">
                      {formatReviewDate(review.createdAt)}
                    </p>
                  </div>

                  <p className="mt-3 text-sm leading-6 whitespace-pre-line text-muted">
                    {review.body}
                  </p>

                  {review.photos.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {review.photos.map((photo, index) => {
                        const items = review.photos.map((entry) => ({
                          photoId: entry.id,
                          caption: review.title,
                          author: review.authorName,
                        }));

                        return (
                          <li key={photo.id}>
                            <button
                              type="button"
                              onClick={() => openLightbox(items, index)}
                              aria-label={`Open photo ${index + 1} from ${review.authorName}`}
                              className="relative block aspect-square w-20 overflow-hidden rounded-none border border-line bg-surface-2 transition hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            >
                              <Image
                                src={reviewPhotoUrl(photo.id)}
                                alt=""
                                fill
                                unoptimized
                                sizes="80px"
                                className="object-cover"
                              />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs">
                    <p className="font-semibold text-ink">
                      {review.authorName}
                    </p>
                    {review.verified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-2.5 py-1 font-semibold text-brand">
                        <CheckIcon />
                        Verified account
                      </span>
                    ) : null}
                    {review.size ? (
                      <span className="rounded-full bg-surface-2 px-2.5 py-1 font-semibold text-muted">
                        Wears EU {review.size}
                      </span>
                    ) : null}
                    {review.fit ? (
                      <span className="rounded-full bg-surface-2 px-2.5 py-1 font-semibold text-muted">
                        {REVIEW_FIT_LABELS[review.fit]}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            {reviews.length > 0 && visibleReviews.length === 0 ? (
              <p className="mt-5 rounded-none border border-line bg-white p-6 text-sm text-muted">
                No reviews with photos yet.
              </p>
            ) : null}

            {reviews.length === 0 && !isFormOpen ? (
              <div className="rounded-none border border-dashed border-line-strong bg-white/60 p-8 text-center">
                <p className="text-sm font-semibold">No reviews yet</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                  Bought this pair? Your review helps other customers pick the
                  right size.
                </p>
                {reviewer ? (
                  <button
                    type="button"
                    onClick={openForm}
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-none border border-brand px-5 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white"
                  >
                    Write the first review
                  </button>
                ) : (
                  <Link
                    href={signInHref}
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-none border border-brand px-5 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white"
                  >
                    Sign in to write the first review
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <PhotoLightbox
        items={lightbox}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightbox(null)}
      />
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* Review form                                                             */
/* ---------------------------------------------------------------------- */

function ReviewForm({
  productHandle,
  reviewer,
  onCancel,
  onCreated,
}: {
  productHandle: string;
  reviewer: ReviewerInfo;
  onCancel: () => void;
  onCreated: (review: ProductReview) => void;
}) {
  const router = useRouter();
  const baseId = useId();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [fit, setFit] = useState<ReviewFit | "">("");
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    },
    // Only revoke on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    setError("");
    const room = REVIEW_LIMITS.maxPhotos - photos.length;
    const files = Array.from(fileList).slice(0, Math.max(0, room));

    if (fileList.length > room) {
      setError(`You can attach up to ${REVIEW_LIMITS.maxPhotos} photos.`);
    }

    if (files.length === 0) {
      return;
    }

    setIsPreparing(true);

    try {
      const prepared: PreparedPhoto[] = [];

      for (const file of files) {
        try {
          prepared.push(await preparePhoto(file));
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "One of the photos could not be read.",
          );
        }
      }

      setPhotos((current) => [...current, ...prepared]);
    } finally {
      setIsPreparing(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((photo) => photo.id !== id);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (rating === 0) {
      setError("Choose a star rating first.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("handle", productHandle);
    formData.set("rating", String(rating));
    formData.set("fit", fit);
    formData.delete("photos");
    photos.forEach((photo, index) => {
      formData.append("photos", photo.file, photo.file.name);
      formData.set(`photoWidth${index}`, String(photo.width));
      formData.set(`photoHeight${index}`, String(photo.height));
    });

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | { review?: ProductReview; error?: string }
        | null;

      if (!response.ok || !payload?.review) {
        setError(
          payload?.error ??
            "Your review could not be saved right now. Please try again.",
        );
        return;
      }

      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      onCreated(payload.review);
      router.refresh();
    } catch {
      setError("Your review could not be sent. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;
  const ratingWords = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby={`${baseId}-title`}
      className="rounded-none border border-brand/30 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(39,80,214,0.5)] sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3
            id={`${baseId}-title`}
            className="text-xl font-semibold tracking-[-0.03em]"
          >
            Write a review
          </h3>
          <p className="mt-1 text-sm text-muted">
            Posting as <span className="font-semibold text-ink">{reviewer.displayName}</span>.
            Photos are optional.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors hover:border-ink"
        >
          Cancel
        </button>
      </div>

      {/* Honeypot: hidden from people, tempting for bots. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-bold">Your rating</legend>
        <div className="mt-2 flex items-center gap-3">
          <div
            role="radiogroup"
            aria-label="Star rating"
            className="flex gap-1"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onFocus={() => setHoverRating(value)}
                onBlur={() => setHoverRating(0)}
                className="h-10 w-10 rounded-none p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <StarIcon
                  className={
                    value <= displayRating ? "text-brand" : "text-line-strong"
                  }
                />
              </button>
            ))}
          </div>
          <p className="min-w-16 text-sm font-semibold text-muted" aria-live="polite">
            {ratingWords[displayRating]}
          </p>
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5">
        <label className="block">
          <span className="text-sm font-bold">Headline</span>
          <input
            name="title"
            required
            minLength={REVIEW_LIMITS.titleMin}
            maxLength={REVIEW_LIMITS.titleMax}
            placeholder="Sum it up in a few words"
            className="mt-2 h-12 w-full rounded-none border border-line-strong bg-white px-4 text-base outline-none placeholder:text-muted-soft focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold">Your review</span>
          <textarea
            name="body"
            required
            minLength={REVIEW_LIMITS.bodyMin}
            maxLength={REVIEW_LIMITS.bodyMax}
            rows={5}
            placeholder="How does it fit? How does it feel after a few wears?"
            className="mt-2 w-full rounded-none border border-line-strong bg-white px-4 py-3 text-base leading-6 outline-none placeholder:text-muted-soft focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>

        <fieldset>
          <legend className="text-sm font-bold">
            How does it fit?{" "}
            <span className="font-normal text-muted">(optional)</span>
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {REVIEW_FITS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={fit === value}
                onClick={() => setFit((current) => (current === value ? "" : value))}
                className={`min-h-11 rounded-none border px-2 text-xs font-bold transition-colors sm:text-sm ${
                  fit === value
                    ? "border-brand bg-brand-tint text-brand"
                    : "border-line-strong bg-white text-muted hover:border-brand hover:text-ink"
                }`}
              >
                {REVIEW_FIT_LABELS[value]}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="text-sm font-bold">
            Add photos{" "}
            <span className="font-normal text-muted">
              (optional · up to {REVIEW_LIMITS.maxPhotos})
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square w-24 overflow-hidden rounded-none border border-line bg-surface-2"
              >
                <Image
                  src={photo.previewUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="96px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  aria-label="Remove photo"
                  className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/85 text-sm leading-none text-white transition hover:bg-error"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < REVIEW_LIMITS.maxPhotos ? (
              <label className="flex aspect-square w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-none border border-dashed border-line-strong bg-canvas text-center text-[0.7rem] font-semibold text-muted transition hover:border-brand hover:text-brand focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand">
                <span aria-hidden="true" className="text-2xl leading-none">
                  +
                </span>
                {isPreparing ? "Preparing…" : "Add photo"}
                <input
                  ref={fileInputRef}
                  type="file"
                  name="photos"
                  accept={ACCEPTED_PHOTO_TYPES.join(",")}
                  multiple
                  disabled={isPreparing || isSubmitting}
                  onChange={(event) => void handleFiles(event.target.files)}
                  className="sr-only"
                />
              </label>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-muted">
            JPG, PNG or WebP. Photos are resized in your browser before upload.
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-5 rounded-none border border-error/30 bg-[#fff2f0] px-4 py-3 text-sm font-semibold text-error">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || isPreparing}
          className="inline-flex min-h-12 items-center justify-center rounded-none bg-ink px-6 text-sm font-bold text-white transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:bg-muted-soft"
        >
          {isSubmitting ? "Posting…" : "Post review"}
        </button>
        <p className="text-xs text-muted">
          By posting you agree it may be shown on this site.
        </p>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* Lightbox                                                                */
/* ---------------------------------------------------------------------- */

function PhotoLightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: LightboxItem[] | null;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = items !== null && items.length > 0;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const current = items?.[Math.min(index, (items?.length ?? 1) - 1)];

  function step(direction: 1 | -1) {
    if (!items) {
      return;
    }

    onIndexChange((index + direction + items.length) % items.length);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Customer photo"
      className="m-auto w-[min(96vw,64rem)] max-w-none rounded-none bg-ink p-0 text-white shadow-2xl backdrop:bg-ink/80"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          step(1);
        } else if (event.key === "ArrowLeft") {
          step(-1);
        }
      }}
    >
      {current ? (
        <div className="flex flex-col">
          <div className="relative aspect-[4/3] w-full bg-black/40 sm:aspect-[16/10]">
            <Image
              key={current.photoId}
              src={reviewPhotoUrl(current.photoId)}
              alt={`${current.caption} — photo by ${current.author}`}
              fill
              unoptimized
              sizes="(min-width: 1024px) 64rem, 96vw"
              className="object-contain"
            />
            {items && items.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() => step(-1)}
                  className="absolute top-1/2 left-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white"
                >
                  <span aria-hidden="true" className="text-lg leading-none">
                    ‹
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => step(1)}
                  className="absolute top-1/2 right-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white"
                >
                  <span aria-hidden="true" className="text-lg leading-none">
                    ›
                  </span>
                </button>
              </>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{current.caption}</p>
              <p className="text-xs text-white/70">
                Photo by {current.author}
                {items && items.length > 1
                  ? ` · ${index + 1} of ${items.length}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition hover:bg-white hover:text-ink"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}
