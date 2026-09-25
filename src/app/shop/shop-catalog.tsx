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

const AVAILABILITY_OPTIONS: { label: string; value: AvailabilityFilter }[] = [
  { label: "All products", value: "all" },
  { label: "In stock", value: "in-stock" },
  { label: "Sold out", value: "sold-out" },
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
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<ProductSort>(initialSort);
  /* Sort and filters share one panel so neither eats space beside the grid. */
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (brand !== "all" ? 1 : 0) +
    (size !== "all" ? 1 : 0) +
    (availability !== "all" ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0 || query.trim().length > 0;

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setBrand("all");
    setSize("all");
    setAvailability("all");
  }

  return (
    <section className="px-5 py-5 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        {/* Controls: a short search field, the result count and one panel toggle. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="block w-full sm:w-[22rem]">
            <span className="sr-only">Search the catalogue</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by style, brand or colour"
              className="h-11 w-full border border-line-strong bg-white px-4 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-ink"
            />
          </label>

          <div className="flex items-center gap-4">
            <p className="text-sm text-muted" aria-live="polite">
              <span className="font-semibold text-ink">
                {filteredProducts.length}
              </span>{" "}
              {filteredProducts.length === 1 ? "style" : "styles"}
            </p>
            <button
              type="button"
              aria-expanded={isPanelOpen}
              aria-controls="shop-controls"
              onClick={() => setIsPanelOpen((open) => !open)}
              className="flex h-11 items-center gap-2 border border-line-strong px-5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase transition-colors hover:border-ink"
            >
              Sort &amp; filter
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center bg-brand px-1 text-[0.6rem] text-white">
                  {activeFilterCount}
                </span>
              ) : null}
              <span aria-hidden="true">{isPanelOpen ? "–" : "+"}</span>
            </button>
          </div>
        </div>

        {isPanelOpen ? (
          <div
            id="shop-controls"
            className="mt-4 border border-line-strong bg-surface p-5 sm:p-6"
          >
            <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
              <FilterGroup title="Sort by">
                <div className="grid gap-2">
                  {SORT_OPTIONS.map((option) => (
                    <FilterButton
                      key={option.value}
                      active={sort === option.value}
                      onClick={() => setSort(option.value)}
                    >
                      {option.label}
                    </FilterButton>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup title="Category">
                <div className="grid gap-2">
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

              <div className="flex flex-col gap-7">
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
                      <option value="all">All brands</option>
                      {brands.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </FilterGroup>

                <FilterGroup title="Availability">
                  <div className="grid gap-2">
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <FilterButton
                        key={option.value}
                        active={availability === option.value}
                        onClick={() => setAvailability(option.value)}
                      >
                        {option.label}
                      </FilterButton>
                    ))}
                  </div>
                </FilterGroup>
              </div>

              <FilterGroup title="EU size">
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    aria-pressed={size === "all"}
                    onClick={() => setSize("all")}
                    className={`col-span-2 min-h-10 border px-2 text-xs font-semibold transition-colors ${
                      size === "all"
                        ? "border-brand bg-brand text-white"
                        : "border-line-strong bg-white hover:border-ink"
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
                      className={`min-h-10 border px-1 text-xs font-semibold transition-colors ${
                        size === item
                          ? "border-brand bg-brand text-white"
                          : "border-line-strong bg-white hover:border-ink"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </FilterGroup>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="text-xs font-semibold text-brand underline decoration-1 underline-offset-4 disabled:text-muted-soft disabled:no-underline"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="bg-ink px-6 py-3 text-[0.68rem] font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-brand"
              >
                Show {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "style" : "styles"}
              </button>
            </div>
          </div>
        ) : null}

        {size !== "all" ? (
          <p className="mt-4 inline-flex border border-brand/30 bg-brand-tint px-3 py-1 text-xs font-semibold text-brand">
            Showing EU {size}
          </p>
        ) : null}

        {filteredProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 md:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                rating={ratings[product.handle]}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 border border-line bg-white px-6 py-16 text-center sm:px-12">
            <p className="text-[0.62rem] font-semibold tracking-[0.2em] text-muted uppercase">
              Nothing here yet
            </p>
            <h2 className="section-title mt-3">Try a wider search.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
              No products match every selected filter. Clear the filters and
              build a new combination.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-7 bg-ink px-6 py-3 text-[0.68rem] font-semibold tracking-[0.16em] text-white uppercase transition-colors hover:bg-brand"
            >
              Clear filters
            </button>
          </div>
        )}
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
    <div>
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
      className={`min-h-10 border px-3 text-left text-sm transition-colors ${
        active
          ? "border-brand bg-brand-tint font-semibold text-brand"
          : "border-line bg-white text-muted hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
