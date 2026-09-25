import Image from "next/image";
import Link from "next/link";

import { formatGHS, type Product } from "@/lib";
import type { ReviewSummary } from "@/lib/reviews";

import { RatingStars } from "./rating-stars";

export type ProductCardRating = Pick<ReviewSummary, "average" | "count">;

export function ProductCard({
  product,
  rating,
  priority = false,
  className = "",
}: {
  product: Product;
  rating?: ProductCardRating;
  priority?: boolean;
  className?: string;
}) {
  const availableVariants = product.variants.filter(
    (variant) => variant.availableForSale,
  );
  const isSoldOut = availableVariants.length === 0;
  const visibleSizes = availableVariants.slice(0, 6);
  const remainingSizes = availableVariants.length - visibleSizes.length;
  const lowStock =
    !isSoldOut &&
    availableVariants.reduce(
      (total, variant) => total + variant.inventoryQuantity,
      0,
    ) <= 4;
  const colorCount = product.colors.length;

  /*
    Sizes can carry different prices. `product.price` is the cheapest, so say
    "From" rather than implying one flat price for the style.
  */
  const pricedVariants =
    availableVariants.length > 0 ? availableVariants : product.variants;
  const hasPriceRange =
    pricedVariants.length > 1 &&
    Math.max(...pricedVariants.map((variant) => variant.price)) >
      Math.min(...pricedVariants.map((variant) => variant.price));

  return (
    <article className={`group min-w-0 ${className}`}>
      {/*
        Image tile: flat grey field, square corners, no border. The whole
        tile is the hit target, matching a dense catalogue grid.
      */}
      <Link
        href={`/products/${product.handle}`}
        className="relative block aspect-square overflow-hidden bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Image
          src={product.images[0].src}
          alt={product.images[0].alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] ${
            isSoldOut ? "opacity-60" : ""
          }`}
        />

        {/* Flag rail: plain uppercase labels, no pills. */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="flex flex-col items-start gap-1">
            {product.isDemo ? (
              <span className="bg-white px-2 py-1 text-[0.58rem] font-semibold tracking-[0.16em] text-muted uppercase">
                Demo
              </span>
            ) : null}
            {!isSoldOut && lowStock ? (
              <span className="bg-ink px-2 py-1 text-[0.58rem] font-semibold tracking-[0.16em] text-white uppercase">
                Low stock
              </span>
            ) : null}
          </span>
          {isSoldOut ? (
            <span className="bg-ink px-2 py-1 text-[0.58rem] font-semibold tracking-[0.16em] text-white uppercase">
              Sold out
            </span>
          ) : null}
        </div>

        {/* Size rail slides up on hover — the quick-scan detail when browsing. */}
        {!isSoldOut ? (
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-white/95 px-3 py-2.5 backdrop-blur transition-transform duration-300 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0">
            <p className="truncate text-[0.62rem] font-semibold tracking-[0.12em] text-ink uppercase">
              EU {visibleSizes.map((variant) => variant.size).join("  ")}
              {remainingSizes > 0 ? `  +${remainingSizes}` : ""}
            </p>
          </div>
        ) : null}
      </Link>

      {/* Information block: price leads, then name, then metadata. */}
      <div className="pt-3">
        <p className="truncate text-[0.6rem] font-semibold tracking-[0.18em] text-muted uppercase">
          {product.brand}
        </p>
        <p className="mt-1.5 text-[0.95rem] font-semibold tracking-[-0.01em] text-ink">
          {hasPriceRange ? (
            <span className="mr-1 text-[0.7rem] font-normal text-muted">
              From
            </span>
          ) : null}
          {formatGHS(product.price)}
        </p>
        <h3 className="mt-0.5 truncate text-sm leading-6 font-normal text-ink">
          <Link
            href={`/products/${product.handle}`}
            className="transition-colors hover:text-brand"
          >
            {product.title}
          </Link>
        </h3>
        <p className="truncate text-sm leading-6 text-muted">
          {product.category}
        </p>

        <div className="mt-2 flex min-h-5 items-center justify-between gap-3">
          {colorCount > 0 ? (
            <span className="flex items-center gap-1.5">
              {product.colors.map((color) => (
                <span
                  key={color.name}
                  aria-label={color.name}
                  title={color.name}
                  className="h-3 w-3 rounded-full border border-black/15"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
              <span className="text-[0.7rem] text-muted-soft">
                {colorCount} {colorCount === 1 ? "colour" : "colours"}
              </span>
            </span>
          ) : (
            <span />
          )}

          {rating && rating.count > 0 ? (
            <span className="flex shrink-0 items-center gap-1.5 text-[0.7rem] text-muted">
              <RatingStars
                value={rating.average}
                size="sm"
                label={`Rated ${rating.average.toFixed(1)} out of 5 from ${rating.count} ${
                  rating.count === 1 ? "review" : "reviews"
                }`}
              />
              <span aria-hidden="true">({rating.count})</span>
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
