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
  const taggedFeatured = getFeaturedProducts(8, catalog.products);
  const featuredProducts =
    taggedFeatured.length > 0 ? taggedFeatured : activeProducts.slice(0, 8);
  const heroProduct = featuredProducts[0] ?? activeProducts[0] ?? null;
  const heroImage = heroProduct?.images[0] ?? {
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
    <main className="overflow-hidden bg-canvas">
      {/*
        Hero: one full-bleed photograph, a centred light headline and a
        single outlined call to action. Nothing else competes with it.
      */}
      <section className="hero-media flex min-h-[38rem] items-center justify-center lg:min-h-[44rem]">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="hero-scrim absolute inset-0 -z-10" aria-hidden="true" />

        <div className="page-shell reveal-up w-full py-24 text-center text-white">
          <p className="eyebrow text-white/70">Accra, Ghana</p>
          <h1 className="display-type mx-auto mt-6 max-w-4xl text-balance">
            Browse our latest pairs
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-white/80">
            A focused sneaker edit with live EU size availability, prices in
            Ghana cedis and secure checkout.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/shop" className="btn btn-ghost-light">
              Shop all
            </Link>
            <Link
              href="#categories"
              className="min-h-13 px-4 py-4 text-xs font-semibold tracking-[0.14em] text-white/80 uppercase underline decoration-1 underline-offset-8 transition-colors hover:text-white"
            >
              Browse categories
            </Link>
          </div>
        </div>
      </section>

      {/* Marquee: monochrome, hairline-bounded. */}
      <div
        className="overflow-hidden border-b border-line bg-ink text-white"
        aria-hidden="true"
      >
        <div className="ticker-track py-3">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center">
              {tickerItems.map((item) => (
                <li
                  key={`${copy}-${item}`}
                  className="flex items-center gap-8 pr-8 text-[0.66rem] font-medium tracking-[0.22em] whitespace-nowrap uppercase"
                >
                  {item}
                  <span className="h-1 w-1 rounded-full bg-white/45" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* Quiet facts row — the hero stats, moved off the photograph. */}
      <section className="page-shell border-b border-line py-8">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          {[
            [String(inStockCount), "styles in stock"],
            [String(brandCount), brandCount === 1 ? "brand" : "brands"],
            ["EU 36–47", "size range"],
            ["GHS", "all pricing"],
          ].map(([value, label]) => (
            <div key={label}>
              <dd className="text-2xl font-light tracking-[-0.02em] text-ink">
                {value}
              </dd>
              <dt className="mt-1 text-[0.62rem] font-semibold tracking-[0.18em] text-muted uppercase">
                {label}
              </dt>
            </div>
          ))}
        </dl>
        {catalog.notice ? (
          <p className="mt-6 text-xs leading-5 text-muted">{catalog.notice}</p>
        ) : null}
      </section>

      {/* Featured grid sits high on the page, as on a supply-house storefront. */}
      <section className="page-shell py-14 sm:py-20">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-2xl font-light tracking-[-0.02em] sm:text-3xl">
            Featured products
          </h2>
          <Link
            href="/shop"
            className="text-xs font-semibold tracking-[0.14em] text-ink uppercase underline decoration-1 underline-offset-8 transition-colors hover:text-brand"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 lg:grid-cols-4">
          {featuredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              rating={ratings[product.handle]}
              priority={index < 2}
            />
          ))}
        </div>
      </section>

      {/* Categories + sizes */}
      <section
        id="categories"
        className="border-t border-line bg-surface-2 scroll-mt-24"
      >
        <div className="page-shell py-14 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
            <div>
              <p className="section-label text-muted">Browse by category</p>
              <h2 className="section-title mt-4">Built for how you move.</h2>
              <ul className="mt-8 border-t border-line-strong">
                {categoryCounts.map(({ category, count }) => (
                  <li key={category}>
                    <Link
                      href={`/shop?category=${encodeURIComponent(category)}`}
                      className="group flex items-center justify-between border-b border-line-strong py-4 transition-colors hover:text-brand"
                    >
                      <span className="text-base tracking-[-0.01em]">
                        {category}
                      </span>
                      <span className="text-xs font-semibold text-muted transition-colors group-hover:text-brand">
                        {count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface p-6 sm:p-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-label text-muted">Shop your size</p>
                  <p className="mt-3 text-sm text-muted">
                    Tap a size to see only pairs in stock for you.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="shrink-0 text-xs font-semibold tracking-[0.12em] text-brand uppercase underline decoration-1 underline-offset-4"
                >
                  All sizes
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-4 xl:grid-cols-8">
                {popularSizes.map((size) => (
                  <Link
                    key={size}
                    href={`/shop?size=${size}`}
                    aria-label={`Shop EU size ${size}`}
                    className="flex min-h-14 items-center justify-center border border-line-strong text-base transition-colors hover:border-ink hover:bg-ink hover:text-white"
                  >
                    {size}
                  </Link>
                ))}
              </div>
              <p className="mt-5 text-xs text-muted">
                Half sizes and EU 36–47 available on the shop page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial band: photograph against black, no colour block. */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[24rem] lg:min-h-[34rem]">
          <Image
            src="/images/products/demo-runner-blue.png"
            alt="Lifestyle runner in dusty blue"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center gap-8 bg-ink px-6 py-16 text-white sm:px-12 lg:px-16 lg:py-20">
          <p className="section-label text-white/55">A better way to browse</p>
          <h2 className="section-title max-w-xl">
            Your size, without the guesswork.
          </h2>
          <p className="max-w-lg text-base leading-7 text-white/70">
            Every size is tied to live inventory, so sold-out options never make
            it to checkout. Reviews tell you whether a pair runs small, true or
            large before you order.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-ghost-light">
              Browse by EU size
            </Link>
            <Link
              href="/about"
              className="min-h-13 px-4 py-4 text-xs font-semibold tracking-[0.14em] text-white/75 uppercase underline decoration-1 underline-offset-8 transition-colors hover:text-white"
            >
              Our approach
            </Link>
          </div>
        </div>
      </section>

      {/* A single featured pair, pulled forward from the edit. */}
      {heroProduct ? (
        <section className="page-shell border-b border-line py-14 sm:py-20">
          <Link
            href={`/products/${heroProduct.handle}`}
            className="group grid items-center gap-8 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] sm:gap-12"
          >
            <span className="relative block aspect-square overflow-hidden bg-surface-2">
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                sizes="(min-width: 640px) 20rem, 100vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
            </span>
            <span className="block">
              <span className="section-label block text-muted">
                Pair of the moment
              </span>
              <span className="mt-4 block text-[0.62rem] font-semibold tracking-[0.18em] text-muted uppercase">
                {heroProduct.brand}
              </span>
              <span className="section-title mt-2 block">
                {heroProduct.title}
              </span>
              <span className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
                <span className="text-base font-semibold text-ink">
                  {formatGHS(heroProduct.price)}
                </span>
                <span>
                  {
                    heroProduct.variants.filter(
                      (variant) => variant.availableForSale,
                    ).length
                  }{" "}
                  sizes in stock
                </span>
                {heroRating ? (
                  <span className="flex items-center gap-2">
                    <RatingStars value={heroRating.average} size="sm" />
                    {heroRating.average.toFixed(1)}
                  </span>
                ) : null}
              </span>
              <span className="mt-7 inline-flex text-xs font-semibold tracking-[0.14em] text-ink uppercase underline decoration-1 underline-offset-8 transition-colors group-hover:text-brand">
                View this pair
              </span>
            </span>
          </Link>
        </section>
      ) : null}

      {/* Customer reviews */}
      {recentReviews.length > 0 ? (
        <section className="border-b border-line bg-surface">
          <div className="page-shell py-14 sm:py-20">
            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-label text-muted">From our customers</p>
                <h2 className="section-title mt-4">Worn, rated, shared.</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted">
                Real reviews and photos from people wearing these pairs.
              </p>
            </div>
            <ul className="grid gap-px bg-line md:grid-cols-2 xl:grid-cols-3">
              {recentReviews.map((review) => (
                <li
                  key={review.id}
                  className="flex flex-col bg-surface p-7"
                >
                  {review.photos.length > 0 ? (
                    <div className="mb-5 flex gap-2">
                      {review.photos.slice(0, 3).map((photo) => (
                        <span
                          key={photo.id}
                          className="relative aspect-square w-20 overflow-hidden bg-surface-2"
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
                  <h3 className="mt-4 text-base font-semibold tracking-[-0.01em]">
                    {review.title}
                  </h3>
                  <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted">
                    {review.body}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-6 text-xs">
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
                      className="ml-auto font-semibold text-brand underline decoration-1 underline-offset-4"
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
      <section className="page-shell">
        <div className="grid divide-y divide-line py-4 md:grid-cols-3 md:divide-x md:divide-y-0">
          {valueProps.map(({ number, title, copy }) => (
            <article
              key={number}
              className="py-10 md:px-10 md:first:pl-0 md:last:pr-0"
            >
              <p className="font-mono text-xs font-semibold tracking-[0.1em] text-muted-soft">
                {number}
              </p>
              <h2 className="mt-5 text-lg font-semibold tracking-[-0.02em]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-ink text-white">
        <div className="page-shell py-20 text-center sm:py-28">
          <p className="section-label text-white/55">Ready when you are</p>
          <h2 className="section-title mx-auto mt-5 max-w-3xl">
            Your next pair is a few taps away.
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn btn-ghost-light">
              Shop now
            </Link>
            <Link
              href="/account"
              className="min-h-13 px-4 py-4 text-xs font-semibold tracking-[0.14em] text-white/75 uppercase underline decoration-1 underline-offset-8 transition-colors hover:text-white"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
