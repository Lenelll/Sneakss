import Image from "next/image";
import Link from "next/link";

import { formatGHS, type Product } from "@/lib";

export function ProductCard({
  product,
  priority = false,
  className = "",
}: {
  product: Product;
  priority?: boolean;
  className?: string;
}) {
  const availableVariants = product.variants.filter(
    (variant) => variant.availableForSale,
  );
  const isSoldOut = availableVariants.length === 0;
  const visibleSizes = availableVariants.slice(0, 4);
  const remainingSizes = availableVariants.length - visibleSizes.length;

  return (
    <article className={`group min-w-0 ${className}`}>
      <Link
        href={`/products/${product.handle}`}
        className="relative block aspect-[4/4.65] overflow-hidden rounded-[1.25rem] bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E4E3E]"
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
            <span className="rounded-full bg-white/92 px-3 py-1.5 text-[0.6rem] font-semibold tracking-[0.14em] text-[#686B64] uppercase shadow-sm backdrop-blur">
              Demo
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          {product.isNewArrival && (
            <span className="rounded-full bg-[#0E4E3E] px-3 py-1.5 text-[0.6rem] font-semibold tracking-[0.14em] text-white uppercase">
              New
            </span>
          )}
        </div>
        <div className="absolute inset-x-3 bottom-3 translate-y-2 rounded-xl bg-[#151713]/88 px-3 py-2.5 text-white opacity-0 backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <p className="truncate text-[0.65rem] font-medium tracking-[0.05em]">
            {isSoldOut
              ? "SOLD OUT"
              : `${visibleSizes.map((variant) => variant.size).join(" · ")}${
                  remainingSizes > 0 ? ` · +${remainingSizes}` : ""
                } EU`}
          </p>
        </div>
      </Link>

      <div className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[0.64rem] font-semibold tracking-[0.16em] text-[#686B64] uppercase">
              {product.brand}
            </p>
            <h3 className="mt-1 truncate text-base font-semibold tracking-[-0.025em] text-[#151713]">
              <Link
                href={`/products/${product.handle}`}
                className="transition-colors hover:text-[#0E4E3E]"
              >
                {product.title}
              </Link>
            </h3>
            <p className="mt-1 truncate text-xs text-[#686B64]">
              {product.colorway}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-[#151713]">
            {formatGHS(product.price)}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {product.colors.map((color) => (
            <span
              key={color.name}
              aria-label={color.name}
              title={color.name}
              className="h-3 w-3 rounded-full border border-black/12 ring-1 ring-transparent ring-offset-1"
              style={{ backgroundColor: color.hex }}
            />
          ))}
          <span className="ml-1 text-[0.65rem] text-[#8B8D86]">
            {product.category}
          </span>
        </div>
      </div>
    </article>
  );
}
