"use client";

import { useMemo, useState } from "react";

import { ProductCard } from "@/components/product-card";
import {
  EU_SIZE_SCALE,
  PRODUCT_CATEGORIES,
  filterProducts,
  products,
  type AvailabilityFilter,
  type EuSize,
  type ProductCategory,
  type ProductSort,
} from "@/lib";

const SORT_OPTIONS: { label: string; value: ProductSort }[] = [
  { label: "Featured", value: "featured" },
  { label: "Newest", value: "newest" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Name: A–Z", value: "name-asc" },
];

type CategorySelection = ProductCategory | "all";
type SizeSelection = EuSize | "all";

type ShopCatalogProps = {
  initialQuery?: string;
  initialSize?: EuSize;
  initialSort?: ProductSort;
};

export function ShopCatalog({
  initialQuery = "",
  initialSize,
  initialSort = "featured",
}: ShopCatalogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategorySelection>("all");
  const [brand, setBrand] = useState("all");
  const [size, setSize] = useState<SizeSelection>(initialSize ?? "all");
  const [availability, setAvailability] =
    useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<ProductSort>(initialSort);

  const brands = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.brand))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [],
  );

  const stockedSizes = useMemo(
    () =>
      EU_SIZE_SCALE.filter((candidate) =>
        products.some((product) =>
          product.variants.some((variant) => variant.size === candidate),
        ),
      ),
    [],
  );

  const filteredProducts = useMemo(
    () =>
      filterProducts({
        query,
        categories: category === "all" ? undefined : [category],
        brands: brand === "all" ? undefined : [brand],
        sizes: size === "all" ? undefined : [size],
        availability,
        sort,
      }),
    [availability, brand, category, query, size, sort],
  );

  const hasActiveFilters =
    query.trim().length > 0 ||
    category !== "all" ||
    brand !== "all" ||
    size !== "all" ||
    availability !== "all";

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setBrand("all");
    setSize("all");
    setAvailability("all");
  }

  return (
    <section className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-4 border-b border-[#D8D8D0] pb-7 md:grid-cols-[minmax(0,1fr)_240px]">
          <label className="block">
            <span className="sr-only">Search the catalogue</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by style, brand or colour"
              className="h-14 w-full rounded-xl border border-[#C9CAC2] bg-white px-5 text-base text-[#151713] outline-none placeholder:text-[#85887F] focus:border-[#0E4E3E] focus:ring-2 focus:ring-[#0E4E3E]/20"
            />
          </label>

          <label className="block">
            <span className="sr-only">Sort products</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ProductSort)}
              className="h-14 w-full appearance-none rounded-xl border border-[#C9CAC2] bg-white px-5 text-sm font-semibold text-[#151713] outline-none focus:border-[#0E4E3E] focus:ring-2 focus:ring-[#0E4E3E]/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-10 pt-7 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <aside aria-label="Product filters" className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center justify-between border-b border-[#D8D8D0] pb-4">
              <h2 className="text-sm font-bold tracking-[0.14em] uppercase">
                Filter
              </h2>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-bold text-[#0E4E3E] underline decoration-1 underline-offset-4 hover:text-[#09382C] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E4E3E]"
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <FilterGroup title="Category">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                <FilterButton
                  active={category === "all"}
                  onClick={() => setCategory("all")}
                >
                  All categories
                </FilterButton>
                {PRODUCT_CATEGORIES.map((item) => (
                  <FilterButton
                    key={item}
                    active={category === item}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </FilterButton>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Brand">
              <label className="block">
                <span className="sr-only">Filter by brand</span>
                <select
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-[#C9CAC2] bg-white px-3 text-sm text-[#151713] outline-none focus:border-[#0E4E3E] focus:ring-2 focus:ring-[#0E4E3E]/20"
                >
                  <option value="all">All demo brands</option>
                  {brands.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </FilterGroup>

            <FilterGroup title="EU size">
              <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-4">
                <button
                  type="button"
                  aria-pressed={size === "all"}
                  onClick={() => setSize("all")}
                  className={`col-span-2 min-h-10 rounded-lg border px-2 text-xs font-bold transition-colors ${
                    size === "all"
                      ? "border-[#0E4E3E] bg-[#0E4E3E] text-white"
                      : "border-[#C9CAC2] bg-white hover:border-[#0E4E3E]"
                  }`}
                >
                  Any
                </button>
                {stockedSizes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={size === item}
                    onClick={() => setSize(item)}
                    className={`min-h-10 rounded-lg border px-1 text-xs font-bold transition-colors ${
                      size === item
                        ? "border-[#0E4E3E] bg-[#0E4E3E] text-white"
                        : "border-[#C9CAC2] bg-white hover:border-[#0E4E3E]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Availability">
              <div className="grid gap-2">
                {(
                  [
                    ["all", "All products"],
                    ["in-stock", "In stock"],
                    ["sold-out", "Sold out"],
                  ] as const
                ).map(([value, label]) => (
                  <FilterButton
                    key={value}
                    active={availability === value}
                    onClick={() => setAvailability(value)}
                  >
                    {label}
                  </FilterButton>
                ))}
              </div>
            </FilterGroup>
          </aside>

          <div>
            <div className="mb-6 flex min-h-7 flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#686B64]" aria-live="polite">
                <span className="font-bold text-[#151713]">
                  {filteredProducts.length}
                </span>{" "}
                {filteredProducts.length === 1 ? "style" : "styles"}
              </p>
              {size !== "all" ? (
                <p className="rounded-full border border-[#0E4E3E]/25 bg-[#E6EEE9] px-3 py-1 text-xs font-bold text-[#0E4E3E]">
                  Showing EU {size}
                </p>
              ) : null}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-12 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-[#D8D8D0] bg-white px-6 py-16 text-center sm:px-12">
                <p className="text-xs font-bold tracking-[0.16em] text-[#0E4E3E] uppercase">
                  Nothing here yet
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  Try a wider search.
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#686B64]">
                  No demo products match every selected filter. Clear the
                  filters and build a new combination.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-7 rounded-xl bg-[#0E4E3E] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#09382C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E4E3E]"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterGroup({
  children,
  title,
}: Readonly<{
  children: React.ReactNode;
  title: string;
}>) {
  return (
    <div className="border-b border-[#D8D8D0] py-5">
      <h3 className="mb-3 text-xs font-bold tracking-[0.12em] text-[#686B64] uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: Readonly<{
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-10 rounded-lg border px-3 text-left text-sm font-semibold transition-colors ${
        active
          ? "border-[#0E4E3E] bg-[#E6EEE9] text-[#0E4E3E]"
          : "border-[#D8D8D0] bg-white text-[#5A5E56] hover:border-[#0E4E3E] hover:text-[#151713]"
      }`}
    >
      {children}
    </button>
  );
}
