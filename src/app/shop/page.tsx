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
      {/*
        Compact masthead. The collection label doubles as the page heading so
        the grid starts near the top of the viewport instead of below a wall
        of display type.
      */}
      <section className="border-b border-line px-5 py-4 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="bg-ink px-3 py-1.5 text-[0.62rem] font-semibold tracking-[0.2em] text-white uppercase">
            Sneaker collection
          </h1>
          <span className="text-[0.62rem] font-semibold tracking-[0.18em] text-muted uppercase">
            {catalog.source === "shopify"
              ? "Shopify inventory · EU sizing"
              : "Sneaker-ready EU sizing"}
          </span>
          <p className="w-full text-sm leading-6 text-muted lg:w-auto lg:flex-1 lg:text-right">
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
