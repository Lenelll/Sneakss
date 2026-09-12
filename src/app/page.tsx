import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { RatingStars } from "@/components/rating-stars";
import {
  EU_SIZE_SCALE,
  PRODUCT_CATEGORIES,
  formatGHS,
  getFeaturedProducts,
  type Product,
} from "@/lib";
import { getCommerceCatalog } from "@/lib/catalog-source";
import { REVIEW_FIT_LABELS } from "@/lib/reviews";
import { getRecentReviews, getReviewSummaries } from "@/lib/reviews/store";

const popularSizes = EU_SIZE_SCALE.filter(
  (size) => size >= 38 && size <= 45 && Number.isInteger(size),
);

const tickerItems = [
  "EU sizing",
  "Prices in Ghana cedis",
  "Live stock by size",
  "Secure Shopify checkout with Paystack",
  "Delivery across Ghana",
  "Customer reviews & photos",
];

const valueProps = [
  {
    number: "01",
    title: "Ghana cedi pricing",
    copy: "Every price on the storefront is shown in GHS, with no conversion surprises at checkout.",
  },
  {
    number: "02",
    title: "Tracked by size",
    copy: "Each EU size carries its own stock count, so what you see is what you can order.",
  },
  {
    number: "03",
    title: "Secure checkout",
    copy: "Pay through Shopify checkout with Paystack. Delivery is arranged by our partner.",
  },
];

export default async function HomePage() {
  const catalog = await getCommerceCatalog();
  const activeProducts = catalog.products.filter(
    (product) => product.status === "active",
  );
  const taggedFeatured = getFeaturedProducts(4, catalog.products);
  const featuredProducts =
    taggedFeatured.length > 0 ? taggedFeatured : activeProducts.slice(0, 4);
  const heroProduct =
    featuredProducts[0] ?? activeProducts[0] ?? null;
  const heroImage =
    heroProduct?.images[0] ?? {
      id: "hero-fallback",
      src: "/images/products/demo-terrace-forest.png",
      alt: "Sneaker on a neutral background",
    };
  const inStockCount = activeProducts.filter((product) =>
    product.variants.some((variant) => variant.availableForSale),
  ).length;
  const brandCount = new Set(activeProducts.map((product) => product.brand))
    .size;

  const shownHandles = Array.from(
    new Set(
      [...featuredProducts, heroProduct]
        .filter((product): product is Product => product !== null)
        .map((product) => product.handle),
    ),
  );
  const [ratings, recentReviews] = await Promise.all([
    getReviewSummaries(shownHandles),
    getRecentReviews(
      activeProducts.map((product) => product.handle),
      6,
    ),
  ]);
  const heroRating = heroProduct ? ratings[heroProduct.handle] : undefined;

  const categoryCounts = PRODUCT_CATEGORIES.map((category) => ({
    category,
    count: activeProducts.filter((product) => product.category === category)
      .length,
  })).filter((entry) => entry.count > 0);

  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="page-shell pt-4 pb-6 sm:pt-6 sm:pb-8">
        <div className="hero-panel relative grid min-h-[44rem] overflow-hidden rounded-[1.75rem] text-white lg:grid-cols-[1.02fr_0.98fr]">
          <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />

          <div className="relative z-10 flex flex-col justify-between gap-14 p-6 sm:p-10 lg:p-14">
            <div className="reveal-up flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              <p className="eyebrow text-white/75">
                Accra, Ghana · Live sneaker collection
              </p>
            </div>

            <div className="reveal-up-delayed max-w-[46rem]">
              <h1 className="display-type text-balance">
                Find your next pair.
                <span className="mt-2 block text-accent">Sized right.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
                A focused sneaker edit with live EU size availability, prices
                in Ghana cedis and secure checkout. From first look to your
                door.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex min-h-13 items-center justify-center rounded-xl bg-accent px-7 text-sm font-bold tracking-[0.13em] text-ink uppercase transition-colors hover:bg-white"
                >
                  Shop all pairs
                </Link>
                <Link
                  href="#categories"
                  className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/35 px-7 text-sm font-bold tracking-[0.13em] uppercase transition-colors hover:border-white hover:bg-white hover:text-brand-deep"
                >
                  Browse categories
                </Link>
              </div>
            </div>

            <dl className="reveal-up-late grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-6 sm:grid-cols-4">
              {[
                [String(inStockCount), "styles in stock"],
                [String(brandCount), brandCount === 1 ? "brand" : "brands"],
                ["EU 36–47", "size range"],
                ["GHS", "all pricing"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-[0.62rem] font-bold tracking-[0.18em] text-white/55 uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative z-10 flex min-h-[30rem] items-center justify-center p-6 sm:p-10 lg:min-h-full lg:p-12">
            <div className="float-slow relative w-full max-w-[34rem]">
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-[2.5rem] bg-accent/20 blur-3xl"
              />
              <div className="relative aspect-[4/4.2] overflow-hidden rounded-[2rem] border border-white/15 bg-surface-2 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.65)] lg:-rotate-2">
                <Image
                  src={heroImage.src}
                  alt={heroImage.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 44vw, 100vw"
                  className="object-cover"
                />
                {heroRating ? (
                  <span className="absolute top-5 right-5 flex items-center gap-2 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-ink backdrop-blur">
                    <RatingStars value={heroRating.average} size="sm" />
                    {heroRating.average.toFixed(1)}
                  </span>
                ) : null}
              </div>

              {heroProduct ? (
                <Link
                  href={`/products/${heroProduct.handle}`}
                  className="group absolute -bottom-5 left-4 flex w-[calc(100%-2rem)] items-center justify-between gap-4 rounded-2xl bg-white p-4 text-ink shadow-[0_24px_60px_rgba(12,18,48,0.35)] transition hover:-translate-y-0.5 sm:left-6 sm:w-[22rem]"
                >
                  <div className="min-w-0">
                    <p className="eyebrow text-brand">{heroProduct.brand}</p>
                    <p className="mt-1 truncate text-lg font-semibold tracking-[-0.03em]">
                      {heroProduct.title}
                    </p>
                    <p className="text-xs text-muted">
                      {formatGHS(heroProduct.price)} ·{" "}
                      {
                        heroProduct.variants.filter(
                          (variant) => variant.availableForSale,
                        ).length
                      }{" "}
                      sizes in stock
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors group-hover:bg-accent group-hover:text-ink">
                    <span aria-hidden="true" className="text-lg leading-none">
                      →
                    </span>
                    <span className="sr-only">View {heroProduct.title}</span>
                  </span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {catalog.notice ? (
          <p className="mt-4 text-xs leading-5 text-muted">{catalog.notice}</p>
        ) : null}
      </section>

      {/* Ticker */}
      <div className="overflow-hidden border-y border-line bg-accent text-ink" aria-hidden="true">
        <div className="ticker-track py-3">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center">
              {tickerItems.map((item) => (
                <li
                  key={`${copy}-${item}`}
                  className="flex items-center gap-6 pr-6 text-[0.68rem] font-bold tracking-[0.2em] whitespace-nowrap uppercase"
                >
                  {item}
                  <span className="h-1.5 w-1.5 rounded-full bg-ink/60" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* Categories + sizes */}
      <section id="categories" className="page-shell scroll-mt-24 py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow text-brand">Browse by category</p>
            <h2 className="section-title mt-3">Built for how you move.</h2>
            <ul className="mt-8 grid gap-2 sm:grid-cols-2">
              {categoryCounts.map(({ category, count }) => (
                <li key={category}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(category)}`}
                    className="group flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4 transition hover:border-brand hover:shadow-[0_20px_40px_-30px_rgba(39,80,214,0.6)]"
                  >
                    <span className="text-base font-semibold tracking-[-0.02em]">
                      {category}
                    </span>
                    <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-bold text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                      {count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.75rem] bg-surface-2 p-6 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-brand">Shop your size</p>
                <p className="mt-2 text-sm text-muted">
                  Tap a size to see only pairs in stock for you.
                </p>
              </div>
              <Link
                href="/shop"
                className="text-xs font-bold text-brand underline decoration-1 underline-offset-4"
              >
                All sizes
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-4 xl:grid-cols-8">
              {popularSizes.map((size) => (
                <Link
                  key={size}
                  href={`/shop?size=${size}`}
                  aria-label={`Shop EU size ${size}`}
                  className="flex min-h-14 items-center justify-center rounded-xl border border-line bg-surface text-base font-semibold transition-colors hover:border-brand hover:bg-brand hover:text-white"
                >
                  {size}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">
              Half sizes and EU 36–47 available on the shop page.
            </p>
          </div>
        </div>
      </section>

      {/* Feature band */}
      <section className="page-shell pb-20 sm:pb-28">
        <div className="grid overflow-hidden rounded-[1.75rem] bg-brand text-white lg:grid-cols-2">
          <div className="relative min-h-[26rem] overflow-hidden lg:min-h-[32rem]">
            <Image
              src="/images/products/demo-runner-blue.png"
              alt="Lifestyle runner in dusty blue"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-between gap-14 p-7 sm:p-12 lg:p-16">
            <p className="eyebrow text-accent">A better way to browse</p>
            <div>
              <h2 className="section-title max-w-xl">
                Your size, without the guesswork.
              </h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/75">
                Every size is tied to live inventory, so sold-out options
                never make it to checkout. Reviews tell you whether a pair
                runs small, true or large before you order.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex min-h-13 items-center justify-center rounded-xl bg-accent px-7 text-sm font-bold tracking-[0.13em] text-ink uppercase transition-colors hover:bg-white"
                >
                  Browse by EU size
                </Link>
                <Link
                  href="/about"
                  className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/40 px-7 text-sm font-bold tracking-[0.13em] uppercase transition-colors hover:bg-white hover:text-brand"
                >
                  Our approach
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer reviews */}
      {recentReviews.length > 0 ? (
        <section className="border-y border-line bg-surface">
          <div className="page-shell py-20 sm:py-28">
            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow text-brand">From our customers</p>
                <h2 className="section-title mt-3">Worn, rated, shared.</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted">
                Real reviews and photos from people wearing these pairs.
              </p>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recentReviews.map((review) => (
                <li
                  key={review.id}
                  className="flex flex-col rounded-[1.5rem] border border-line bg-canvas p-6"
                >
                  {review.photos.length > 0 ? (
                    <div className="mb-5 flex gap-2">
                      {review.photos.slice(0, 3).map((photo) => (
                        <span
                          key={photo.id}
                          className="relative aspect-square w-20 overflow-hidden rounded-xl border border-line bg-surface-2"
                        >
                          <Image
                            src={`/api/reviews/photos/${photo.id}`}
                            alt=""
                            fill
                            unoptimized
                            sizes="80px"
                            className="object-cover"
                          />
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <RatingStars
                    value={review.rating}
                    label={`${review.rating} out of 5 stars`}
                  />
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em]">
                    {review.title}
                  </h3>
                  <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted">
                    {review.body}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-5 text-xs">
                    <span className="font-semibold text-ink">
                      {review.authorName}
                    </span>
                    {review.fit ? (
                      <span className="text-muted">
                        {REVIEW_FIT_LABELS[review.fit]}
                      </span>
                    ) : null}
                    <Link
                      href={`/products/${review.productHandle}#reviews`}
                      className="ml-auto font-bold text-brand underline decoration-1 underline-offset-4"
                    >
                      {review.productTitle}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Value props */}
      <section className={recentReviews.length > 0 ? "" : "border-y border-line bg-surface"}>
        <div className="page-shell grid divide-y divide-line py-4 md:grid-cols-3 md:divide-x md:divide-y-0">
          {valueProps.map(({ number, title, copy }) => (
            <article
              key={number}
              className="py-8 md:px-8 md:first:pl-0 md:last:pr-0"
            >
              <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint font-mono text-xs font-bold text-brand">
                {number}
              </p>
              <h2 className="mt-6 text-xl font-semibold tracking-[-0.03em]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="page-shell py-20 sm:py-28">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-brand">Selected for you</p>
            <h2 className="section-title mt-3">Inside the edit.</h2>
          </div>
          <Link
            href="/shop"
            className="w-fit border-b border-ink pb-1 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            Shop the full catalogue
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-7 sm:gap-x-3 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              rating={ratings[product.handle]}
            />
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="page-shell pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-ink px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-brand/60 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-accent/30 blur-3xl"
          />
          <div className="relative">
            <p className="eyebrow text-accent">Ready when you are</p>
            <h2 className="section-title mx-auto mt-4 max-w-3xl">
              Your next pair is a few taps away.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/shop"
                className="inline-flex min-h-13 items-center justify-center rounded-xl bg-accent px-7 text-sm font-bold tracking-[0.13em] text-ink uppercase transition-colors hover:bg-white"
              >
                Shop now
              </Link>
              <Link
                href="/account"
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/35 px-7 text-sm font-bold tracking-[0.13em] uppercase transition-colors hover:border-white hover:bg-white hover:text-ink"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
