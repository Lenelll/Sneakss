import type { Metadata } from "next";
import {
  EU_SIZE_SCALE,
  PRODUCT_CATEGORIES,
  type EuSize,
  type ProductCategory,
  type ProductSort,
} from "@/lib";
import { getCommerceCatalog } from "@/lib/catalog-source";
import { getReviewSummaries } from "@/lib/reviews/store";

import { ShopCatalog } from "./shop-catalog";

export const metadata: Metadata = {
  title: "Shop sneakers",
  description:
    "Browse the Sneaker Vault GH demo catalogue by brand, category and EU size. Final inventory will be managed through Shopify.",
};

type ShopPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    size?: string | string[];
    sort?: string | string[];
  }>;
};

const productSorts: readonly ProductSort[] = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "name-asc",
];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [catalog, params] = await Promise.all([
    getCommerceCatalog(),
    searchParams,
  ]);
  const ratings = await getReviewSummaries(
    catalog.products.map((product) => product.handle),
  );
  const initialQuery = firstValue(params.q)?.trim() ?? "";
  const requestedCategory = firstValue(params.category)?.trim();
  const initialCategory = PRODUCT_CATEGORIES.find(
    (category) => category.toLowerCase() === requestedCategory?.toLowerCase(),
  ) as ProductCategory | undefined;
  const requestedSize = Number(firstValue(params.size));
  const initialSize = EU_SIZE_SCALE.includes(requestedSize as EuSize)
    ? (requestedSize as EuSize)
    : undefined;
  const requestedSort = firstValue(params.sort) as ProductSort | undefined;
  const initialSort =
    requestedSort && productSorts.includes(requestedSort)
      ? requestedSort
      : "featured";
  const catalogKey = `${initialQuery}|${initialCategory ?? "all"}|${initialSize ?? "all"}|${initialSort}`;

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="border-b border-line px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-ink uppercase">
              Sneaker collection
            </span>
            <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              {catalog.source === "shopify"
                ? "Shopify inventory · EU sizing"
                : "Sneaker-ready EU sizing"}
            </span>
          </div>
          <h1 className="max-w-4xl text-5xl leading-[0.94] font-semibold tracking-[-0.055em] sm:text-7xl lg:text-8xl">
            Find your next pair.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            {catalog.source === "shopify"
              ? "Browse current pairs and live EU size availability from the Sneaker Vault GH inventory."
              : "Browse the collection and continue using the sample catalog while your final products sync from Shopify."}
          </p>
        </div>
      </section>

      <ShopCatalog
        catalog={catalog.products}
        ratings={ratings}
        key={catalogKey}
        initialQuery={initialQuery}
        initialCategory={initialCategory}
        initialSize={initialSize}
        initialSort={initialSort}
      />
    </main>
  );
}
