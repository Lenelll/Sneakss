"use client";

import { useMemo, useState } from "react";

import { ProductCard, type ProductCardRating } from "@/components/product-card";
import {
  EU_SIZE_SCALE,
  PRODUCT_CATEGORIES,
  filterProducts,
  type AvailabilityFilter,
  type EuSize,
  type Product,
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
  catalog: readonly Product[];
  ratings?: Readonly<Record<string, ProductCardRating>>;
  initialQuery?: string;
  initialCategory?: ProductCategory;
  initialSize?: EuSize;
  initialSort?: ProductSort;
};

export function ShopCatalog({
  catalog,
  ratings = {},
  initialQuery = "",
  initialCategory,
  initialSize,
  initialSort = "featured",
}: ShopCatalogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategorySelection>(
    initialCategory ?? "all",
  );
  const [brand, setBrand] = useState("all");
  const [size, setSize] = useState<SizeSelection>(initialSize ?? "all");
  const [availability, setAvailability] =
    useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<ProductSort>(initialSort);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const brands = useMemo(
    () =>
      Array.from(new Set(catalog.map((product) => product.brand))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [catalog],
  );

  const stockedSizes = useMemo(
    () =>
      EU_SIZE_SCALE.filter((candidate) =>
        catalog.some((product) =>
          product.variants.some((variant) => variant.size === candidate),
        ),
      ),
    [catalog],
  );

  const filteredProducts = useMemo(
    () =>
      filterProducts(
        {
          query,
          categories: category === "all" ? undefined : [category],
          brands: brand === "all" ? undefined : [brand],
          sizes: size === "all" ? undefined : [size],
          availability,
          sort,
        },
        catalog,
      ),
    [availability, brand, catalog, category, query, size, sort],
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
        <div className="grid gap-4 border-b border-line pb-7 md:grid-cols-[minmax(0,1fr)_240px]">
          <label className="block">
            <span className="sr-only">Search the catalogue</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by style, brand or colour"
              className="h-14 w-full border border-line-strong bg-white px-5 text-base text-ink outline-none placeholder:text-muted-soft focus:border-ink"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Sort products</span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-xs text-muted"
            >
              ▾
            </span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ProductSort)}
              className="h-14 w-full appearance-none border border-line-strong bg-white pr-10 pl-5 text-sm text-ink outline-none focus:border-ink"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/*
          Below desktop the filter column is collapsed behind a toggle so the
          grid is the first thing in reach.
        */}
        <div className="pt-7 lg:hidden">
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="shop-filters"
            onClick={() => setFiltersOpen((open) => !open)}
            className="flex w-full items-center justify-between border border-line-strong px-5 py-4 text-[0.68rem] font-semibold tracking-[0.2em] uppercase transition-colors hover:border-ink"
          >
            <span>
              Filter
              {hasActiveFilters ? (
                <span className="ml-2 font-normal text-brand normal-case">
                  active
                </span>
              ) : null}
            </span>
            <span aria-hidden="true">{filtersOpen ? "–" : "+"}</span>
          </button>
        </div>

        <div className="grid gap-10 pt-7 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <aside
            id="shop-filters"
            aria-label="Product filters"
            className={`lg:sticky lg:top-28 lg:block lg:self-start ${
              filtersOpen ? "" : "hidden"
            }`}
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="text-[0.68rem] font-semibold tracking-[0.2em] uppercase">
                Filter
              </h2>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-bold text-brand underline decoration-1 underline-offset-4 hover:text-brand-dark focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
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
              <label className="relative block">
                <span className="sr-only">Filter by brand</span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted"
                >
                  ▾
                </span>
                <select
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className="h-11 w-full appearance-none border border-line-strong bg-white pr-8 pl-3 text-sm text-ink outline-none focus:border-ink"
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
                  className={`col-span-2 min-h-10 rounded-none border px-2 text-xs font-bold transition-colors ${
                    size === "all"
                      ? "border-brand bg-brand text-white"
                      : "border-line-strong bg-white hover:border-brand"
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
                    className={`min-h-10 rounded-none border px-1 text-xs font-bold transition-colors ${
                      size === item
                        ? "border-brand bg-brand text-white"
                        : "border-line-strong bg-white hover:border-brand"
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
              <p className="text-sm text-muted" aria-live="polite">
                <span className="font-bold text-ink">
                  {filteredProducts.length}
                </span>{" "}
                {filteredProducts.length === 1 ? "style" : "styles"}
              </p>
              {size !== "all" ? (
                <p className="border border-brand/30 bg-brand-tint px-3 py-1 text-xs font-semibold text-brand">
                  Showing EU {size}
                </p>
              ) : null}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    rating={ratings[product.handle]}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-none border border-line bg-white px-6 py-16 text-center sm:px-12">
                <p className="text-xs font-bold tracking-[0.16em] text-brand uppercase">
                  Nothing here yet
                </p>
                <h2 className="mt-3 section-title">
                  Try a wider search.
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
                  No demo products match every selected filter. Clear the
                  filters and build a new combination.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-7 rounded-none bg-ink px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
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
    <div className="border-b border-line py-5">
      <h3 className="mb-3 text-[0.62rem] font-semibold tracking-[0.2em] text-muted uppercase">
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
      className={`min-h-10 rounded-none border px-3 text-left text-sm font-semibold transition-colors ${
        active
          ? "border-brand bg-brand-tint text-brand"
          : "border-line bg-white text-muted hover:border-brand hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
