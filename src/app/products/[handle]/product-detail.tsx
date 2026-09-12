"use client";

import Link from "next/link";
import { useState } from "react";

import { ProductGallery } from "@/components/product-gallery";
import { RatingStars } from "@/components/rating-stars";
import { useStore } from "@/components/store-provider";
import {
  formatGHS,
  getTotalInventory,
  type EuSize,
  type Product,
} from "@/lib";
import type { ReviewSummary } from "@/lib/reviews";

const MAX_LINE_QUANTITY = 10;

/** Approximate EU → UK / US (men's) conversion for the size guide. */
const SIZE_GUIDE: Readonly<Record<number, readonly [uk: number, us: number]>> = {
  36: [3.5, 4],
  37: [4, 5],
  38: [5, 6],
  39: [5.5, 6.5],
  40: [6, 7],
  41: [7, 8],
  42: [8, 9],
  43: [9, 10],
  44: [9.5, 10.5],
  45: [10.5, 11.5],
  46: [11, 12],
  47: [12, 13],
};

function convertSize(size: EuSize): { uk: string; us: string } {
  const base = Math.floor(size);
  const entry = SIZE_GUIDE[base];

  if (!entry) {
    return { uk: "–", us: "–" };
  }

  const half = size - base;
  return {
    uk: String(entry[0] + half),
    us: String(entry[1] + half),
  };
}

export function ProductDetail({
  product,
  reviewSummary,
}: Readonly<{ product: Product; reviewSummary: ReviewSummary }>) {
  const availableVariants = product.variants.filter(
    (variant) => variant.availableForSale,
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    availableVariants[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useStore();

  const selectedVariant = product.variants.find(
    (variant) => variant.id === selectedVariantId,
  );
  const isSoldOut = availableVariants.length === 0;
  const totalInventory = getTotalInventory(product);
  const maxQuantity = Math.min(
    MAX_LINE_QUANTITY,
    Math.max(1, selectedVariant?.inventoryQuantity ?? 1),
  );
  const boundedQuantity = Math.min(quantity, maxQuantity);

  function selectVariant(id: string) {
    setSelectedVariantId(id);
    setQuantity(1);
    setMessage("");
  }

  async function handleAddToBag() {
    if (!selectedVariant?.availableForSale) {
      setMessage("Choose an available EU size first.");
      return;
    }

    setIsAdding(true);

    try {
      const added = await addItem(product, selectedVariant, boundedQuantity);
      setMessage(
        added
          ? `${boundedQuantity > 1 ? `${boundedQuantity} × ` : ""}${selectedVariant.sizeLabel} added to your bag.`
          : "We could not add that size. Please try again.",
      );
    } finally {
      setIsAdding(false);
    }
  }

  const stockLine = isSoldOut
    ? "Sold out in every size"
    : selectedVariant && selectedVariant.inventoryQuantity <= 3
      ? `Only ${selectedVariant.inventoryQuantity} left in ${selectedVariant.sizeLabel}`
      : `In stock · ${availableVariants.length} of ${product.variants.length} sizes available`;

  return (
    <section className="px-5 pb-14 sm:px-8 sm:pb-20 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] lg:gap-14">
        <ProductGallery
          images={product.images}
          badge={
            product.isDemo ? "Demo product" : undefined
          }
        />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold tracking-[0.16em] text-brand uppercase">
              {product.brand}
              <span className="mx-2 text-line-strong" aria-hidden="true">
                ·
              </span>
              <span className="text-muted">{product.category}</span>
            </p>
            {reviewSummary.count > 0 ? (
              <a
                href="#reviews"
                className="flex items-center gap-2 text-xs font-semibold text-ink hover:text-brand"
              >
                <RatingStars value={reviewSummary.average} size="sm" />
                {reviewSummary.average.toFixed(1)}{" "}
                <span className="text-muted">
                  ({reviewSummary.count}{" "}
                  {reviewSummary.count === 1 ? "review" : "reviews"})
                </span>
              </a>
            ) : (
              <a
                href="#reviews"
                className="text-xs font-semibold text-muted underline decoration-line-strong underline-offset-4 hover:text-brand"
              >
                No reviews yet · be the first
              </a>
            )}
          </div>

          <h1 className="mt-3 text-4xl leading-[0.98] font-semibold tracking-[-0.05em] sm:text-6xl">
            {product.title}
          </h1>
          <p className="mt-3 text-sm text-muted">{product.colorway}</p>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="text-3xl font-semibold tracking-[-0.03em]">
              {formatGHS(product.price)}
            </p>
            <p
              className={`text-xs font-semibold ${
                isSoldOut
                  ? "text-error"
                  : selectedVariant && selectedVariant.inventoryQuantity <= 3
                    ? "text-brand"
                    : "text-accent-dark"
              }`}
            >
              {stockLine}
            </p>
          </div>

          <p className="mt-5 text-base leading-7 text-muted">
            {product.description}
          </p>

          <div className="mt-8 border-t border-line pt-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold">Select EU size</h2>
              <a
                href="#size-guide"
                className="text-xs font-bold text-brand underline decoration-1 underline-offset-4"
              >
                Size guide
              </a>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
              {product.variants.map((variant) => {
                const isSelected = selectedVariantId === variant.id;
                const low =
                  variant.availableForSale && variant.inventoryQuantity <= 3;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={!variant.availableForSale}
                    aria-pressed={isSelected}
                    aria-label={`${variant.sizeLabel}${
                      variant.availableForSale
                        ? low
                          ? `, only ${variant.inventoryQuantity} left`
                          : ""
                        : ", sold out"
                    }`}
                    onClick={() => selectVariant(variant.id)}
                    className={`relative flex min-h-13 flex-col items-center justify-center rounded-xl border text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      isSelected
                        ? "border-brand bg-brand text-white"
                        : variant.availableForSale
                          ? "border-line-strong bg-white hover:border-brand"
                          : "cursor-not-allowed border-line bg-surface-2 text-muted-soft line-through"
                    }`}
                  >
                    {variant.size}
                    {low ? (
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 text-[0.55rem] font-semibold tracking-[0.08em] uppercase ${
                          isSelected ? "text-white/80" : "text-brand"
                        }`}
                      >
                        {variant.inventoryQuantity} left
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-[7.5rem_1fr] gap-3">
              <div
                className="flex h-14 items-center justify-between rounded-xl border border-line-strong bg-white px-1"
                aria-label="Quantity"
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={boundedQuantity <= 1 || isSoldOut}
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="h-11 w-10 rounded-lg text-lg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>
                <span className="min-w-6 text-center text-sm font-bold" aria-live="polite">
                  {boundedQuantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={boundedQuantity >= maxQuantity || isSoldOut}
                  onClick={() =>
                    setQuantity((current) => Math.min(maxQuantity, current + 1))
                  }
                  className="h-11 w-10 rounded-lg text-lg transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                disabled={!selectedVariant?.availableForSale || isAdding}
                onClick={handleAddToBag}
                className="min-h-14 rounded-xl bg-brand px-6 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                {isAdding
                  ? "Adding…"
                  : selectedVariant?.availableForSale
                    ? `Add ${selectedVariant.sizeLabel} to bag`
                    : isSoldOut
                      ? "Sold out"
                      : "Select an available size"}
              </button>
            </div>

            <p
              aria-live="polite"
              className={`min-h-6 pt-3 text-center text-sm font-semibold ${
                message ? "text-accent-dark" : "text-transparent"
              }`}
            >
              {message || "No update"}
            </p>

            {isSoldOut ? (
              <p className="rounded-xl border border-line bg-white p-4 text-sm leading-6 text-muted">
                This pair is currently sold out.{" "}
                <Link href="/contact" className="font-semibold text-brand underline underline-offset-4">
                  Ask us about a restock
                </Link>
                .
              </p>
            ) : null}
          </div>

          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {[
              ["Secure checkout", "Shopify checkout with Paystack"],
              ["Ghana delivery", "Handled by our delivery partner"],
              ["Easy returns", "See our returns policy"],
            ].map(([title, copy]) => (
              <li
                key={title}
                className="rounded-xl border border-line bg-white px-3.5 py-3"
              >
                <p className="text-xs font-bold">{title}</p>
                <p className="mt-0.5 text-[0.7rem] leading-4 text-muted">{copy}</p>
              </li>
            ))}
          </ul>

          <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
            <details className="group border-b border-line px-5 py-4" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
                Details
                <Chevron />
              </summary>
              <div className="pt-3 text-sm leading-6 text-muted">
                <dl className="grid grid-cols-[6.5rem_1fr] gap-y-1.5">
                  <dt className="font-semibold text-ink">Colourway</dt>
                  <dd>{product.colorway}</dd>
                  <dt className="font-semibold text-ink">Category</dt>
                  <dd>{product.category}</dd>
                  <dt className="font-semibold text-ink">Sizing</dt>
                  <dd>EU · {product.variants[0]?.size}–{product.variants.at(-1)?.size}</dd>
                  <dt className="font-semibold text-ink">Stock</dt>
                  <dd>{totalInventory} units across all sizes</dd>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <span
                      key={color.name}
                      className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink"
                    >
                      <span
                        aria-hidden="true"
                        className="size-3 rounded-full border border-black/10"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name}
                    </span>
                  ))}
                </div>
              </div>
            </details>

            <details id="size-guide" className="group scroll-mt-32 border-b border-line px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
                Size guide &amp; fit
                <Chevron />
              </summary>
              <div className="pt-3 text-sm leading-6 text-muted">
                {reviewSummary.trueToSizePercent !== null ? (
                  <p className="mb-3 rounded-lg bg-accent-tint px-3 py-2 text-xs font-semibold text-accent-dark">
                    {reviewSummary.trueToSizePercent}% of reviewers say this pair
                    fits true to size.
                  </p>
                ) : null}
                <p>
                  We sell in EU sizes. UK and US equivalents below are
                  approximate and can vary by brand.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[16rem] text-left text-xs">
                    <thead>
                      <tr className="text-[0.65rem] font-bold tracking-[0.12em] text-muted uppercase">
                        <th className="py-1.5 pr-3 font-bold">EU</th>
                        <th className="py-1.5 pr-3 font-bold">UK</th>
                        <th className="py-1.5 font-bold">US</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant) => {
                        const converted = convertSize(variant.size);

                        return (
                          <tr key={variant.id} className="border-t border-line text-ink">
                            <td className="py-1.5 pr-3 font-semibold">
                              {variant.size}
                            </td>
                            <td className="py-1.5 pr-3">{converted.uk}</td>
                            <td className="py-1.5">{converted.us}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Link
                  href="/contact"
                  className="mt-3 inline-block text-xs font-bold text-brand underline decoration-1 underline-offset-4"
                >
                  Still unsure? Ask about sizing
                </Link>
              </div>
            </details>

            <details className={`group px-5 py-4 ${product.isDemo ? "border-b border-line" : ""}`}>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
                Delivery &amp; returns
                <Chevron />
              </summary>
              <div className="pt-3 text-sm leading-6 text-muted">
                <p>
                  Orders are paid securely through Shopify checkout with
                  Paystack. Delivery within Ghana is arranged by our delivery
                  partner after your order is confirmed.
                </p>
                <p className="mt-2">
                  Read the{" "}
                  <Link href="/policies/shipping" className="font-semibold text-brand underline underline-offset-4">
                    shipping policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/policies/returns" className="font-semibold text-brand underline underline-offset-4">
                    returns policy
                  </Link>
                  .
                </p>
              </div>
            </details>

            {product.isDemo ? (
              <details className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
                  About this catalogue
                  <Chevron />
                </summary>
                <p className="pt-3 text-sm leading-6 text-muted">
                  This is fictional development inventory. Official photos,
                  products, prices and stock will replace it when Shopify is
                  connected.
                </p>
              </details>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 6l4.5 4.5L12.5 6" />
    </svg>
  );
}
