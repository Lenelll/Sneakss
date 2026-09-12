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
  const visibleSizes = availableVariants.slice(0, 4);
  const remainingSizes = availableVariants.length - visibleSizes.length;
  const lowStock =
    !isSoldOut &&
    availableVariants.reduce(
      (total, variant) => total + variant.inventoryQuantity,
      0,
    ) <= 4;

  return (
    <article className={`group min-w-0 ${className}`}>
      <Link
        href={`/products/${product.handle}`}
        className="relative block aspect-[4/4.65] overflow-hidden rounded-lg border border-line bg-surface-2 transition-shadow duration-300 group-hover:shadow-[0_24px_50px_-28px_rgba(39,80,214,0.45)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      >
        <Image
          src={product.images[0].src}
          alt={product.images[0].alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-500 ease-out group-hover:scale-[1.035]"
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {product.isDemo ? (
            <span className="rounded-full bg-white/92 px-3 py-1.5 text-[0.6rem] font-semibold tracking-[0.14em] text-muted uppercase shadow-sm backdrop-blur">
              Demo
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="flex flex-col items-end gap-1.5">
            {isSoldOut ? (
              <span className="rounded-full bg-ink px-3 py-1.5 text-[0.6rem] font-bold tracking-[0.14em] text-white uppercase">
                Sold out
              </span>
            ) : lowStock ? (
              <span className="rounded-full bg-white/92 px-3 py-1.5 text-[0.6rem] font-bold tracking-[0.14em] text-brand uppercase shadow-sm backdrop-blur">
                Low stock
              </span>
            ) : null}
          </span>
        </div>
        <div className="absolute inset-x-3 bottom-3 translate-y-2 rounded-xl bg-ink/88 px-3 py-2.5 text-white opacity-0 backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <p className="truncate text-[0.65rem] font-medium tracking-[0.05em]">
            {isSoldOut
              ? "SOLD OUT"
              : `EU ${visibleSizes.map((variant) => variant.size).join(" · ")}${
                  remainingSizes > 0 ? ` · +${remainingSizes} more` : ""
                }`}
          </p>
        </div>
      </Link>

      <div className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[0.64rem] font-semibold tracking-[0.16em] text-muted uppercase">
              {product.brand}
            </p>
            <h3 className="mt-1 truncate text-base font-semibold tracking-[-0.025em] text-ink">
              <Link
                href={`/products/${product.handle}`}
                className="transition-colors hover:text-brand"
              >
                {product.title}
              </Link>
            </h3>
            <p className="mt-1 truncate text-xs text-muted">
              {product.colorway}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-ink">
            {formatGHS(product.price)}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {product.colors.map((color) => (
              <span
                key={color.name}
                aria-label={color.name}
                title={color.name}
                className="h-3 w-3 rounded-full border border-black/12"
                style={{ backgroundColor: color.hex }}
              />
            ))}
            <span className="ml-1 text-[0.65rem] text-muted-soft">
              {product.category}
            </span>
          </div>
          {rating && rating.count > 0 ? (
            <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-ink">
              <RatingStars
                value={rating.average}
                size="sm"
                label={`Rated ${rating.average.toFixed(1)} out of 5 from ${rating.count} ${
                  rating.count === 1 ? "review" : "reviews"
                }`}
              />
              <span aria-hidden="true">
                {rating.average.toFixed(1)}{" "}
                <span className="font-normal text-muted-soft">
                  ({rating.count})
                </span>
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
