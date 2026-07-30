import type { Metadata } from "next";
import {
  EU_SIZE_SCALE,
  type EuSize,
  type ProductSort,
} from "@/lib";
import { getCommerceCatalog } from "@/lib/catalog-source";

import { ShopCatalog } from "./shop-catalog";

export const metadata: Metadata = {
  title: "Shop sneakers",
  description:
    "Browse the Sneaker Vault GH demo catalogue by brand, category and EU size. Final inventory will be managed through Shopify.",
};

type ShopPageProps = {
  searchParams: Promise<{
    q?: string | string[];
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
  const catalog = await getCommerceCatalog();
  const params = await searchParams;
  const initialQuery = firstValue(params.q)?.trim() ?? "";
  const requestedSize = Number(firstValue(params.size));
  const initialSize = EU_SIZE_SCALE.includes(requestedSize as EuSize)
    ? (requestedSize as EuSize)
    : undefined;
  const requestedSort = firstValue(params.sort) as ProductSort | undefined;
  const initialSort =
    requestedSort && productSorts.includes(requestedSort)
      ? requestedSort
      : "featured";
  const catalogKey = `${initialQuery}|${initialSize ?? "all"}|${initialSort}`;

  return (
    <main className="min-h-screen bg-[#F5F2EA] text-[#151713]">
      <section className="border-b border-[#D8D8D0] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#E0B33D] px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-[#151713] uppercase">
              {catalog.source === "shopify"
                ? "Live catalogue"
                : "Preview catalogue"}
            </span>
            <span className="text-xs font-semibold tracking-[0.14em] text-[#686B64] uppercase">
              {catalog.source === "shopify"
                ? "Shopify inventory · EU sizing"
                : "Temporary products · EU sizing"}
            </span>
          </div>
          <h1 className="max-w-4xl text-5xl leading-[0.94] font-semibold tracking-[-0.055em] sm:text-7xl lg:text-8xl">
            Find your next pair.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-[#5A5E56] sm:text-lg">
            {catalog.source === "shopify"
              ? "Browse current pairs and live EU size availability from the Sneaker Vault GH inventory."
              : catalog.notice}
          </p>
        </div>
      </section>

      <ShopCatalog
        catalog={catalog.products}
        key={catalogKey}
        initialQuery={initialQuery}
        initialSize={initialSize}
        initialSort={initialSort}
      />
    </main>
  );
}
