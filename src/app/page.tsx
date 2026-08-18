import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { EU_SIZE_SCALE, getFeaturedProducts, getNewArrivals } from "@/lib";
import { getCommerceCatalog } from "@/lib/catalog-source";

const popularSizes = EU_SIZE_SCALE.filter(
  (size) => size >= 38 && size <= 45 && Number.isInteger(size),
);

export default async function HomePage() {
  const catalog = await getCommerceCatalog();
  const taggedFeatured = getFeaturedProducts(4, catalog.products);
  const taggedNewArrivals = getNewArrivals(4, catalog.products);
  const featuredProducts =
    taggedFeatured.length > 0
      ? taggedFeatured
      : catalog.products.slice(0, 4);
  const newArrivals =
    taggedNewArrivals.length > 0
      ? taggedNewArrivals
      : [...catalog.products]
          .sort(
            (a, b) =>
              Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
          )
          .slice(0, 4);

  return (
    <main className="overflow-hidden">
      <section className="page-shell py-5 sm:py-8">
        <div className="grid min-h-[44rem] overflow-hidden rounded-[1.5rem] bg-vault text-white lg:grid-cols-[1.03fr_0.97fr]">
          <div className="relative z-10 flex flex-col justify-between gap-16 p-6 sm:p-10 lg:p-14">
            <div className="reveal-up flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" />
              <p className="eyebrow text-white/70">
                Accra, Ghana · Live sneaker collection
              </p>
            </div>

            <div className="reveal-up-delayed max-w-[48rem]">
              <h1 className="display-type text-balance">
                Find your next pair.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/72 sm:text-lg sm:leading-8">
                A focused sneaker selection, clear EU size availability, and
                prices in Ghana cedis—built for easy shopping from first look
                to checkout.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex min-h-13 items-center justify-center rounded-xl bg-gold px-7 text-sm font-bold uppercase tracking-[0.13em] text-ink transition-colors hover:bg-white"
                >
                  Shop all pairs
                </Link>
                <Link
                  href="#new-arrivals"
                  className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/35 px-7 text-sm font-bold uppercase tracking-[0.13em] transition-colors hover:border-white hover:bg-white hover:text-vault"
                >
                  New arrivals
                </Link>
              </div>
            </div>

            {catalog.notice ? (
              <p className="max-w-sm text-xs leading-5 text-white/55">
                {catalog.notice}
              </p>
            ) : null}
          </div>

          <div className="relative min-h-[29rem] overflow-hidden bg-[#e8e0d1] lg:min-h-full">
            <Image
              src="/images/products/demo-terrace-forest.png"
              alt="Original placeholder sneaker in forest green and clay"
              fill
              priority
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 rounded-2xl bg-white/92 p-5 text-ink shadow-[0_20px_50px_rgba(21,23,19,0.14)] backdrop-blur sm:inset-x-auto sm:bottom-7 sm:left-7 sm:w-[20rem]">
              <div>
                <p className="eyebrow text-muted">This week</p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                  Earth tones, city ready.
                </p>
              </div>
              <span className="rounded-full bg-vault px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white">
                New
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="page-shell grid gap-6 py-6 md:grid-cols-[0.8fr_2.2fr] md:items-center">
          <div>
            <p className="eyebrow text-muted">Shop your size</p>
            <p className="mt-1 text-sm text-muted">Primary sizing · EU</p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {popularSizes.map((size) => (
              <Link
                key={size}
                href={`/shop?size=${size}`}
                aria-label={`Shop EU size ${size}`}
                className="flex min-h-12 items-center justify-center rounded-xl border border-line bg-canvas text-sm font-semibold transition-colors hover:border-vault hover:bg-vault hover:text-white"
              >
                {size}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="new-arrivals" className="page-shell py-20 sm:py-28">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-vault">Just landed</p>
            <h2 className="section-title mt-3">New in the vault.</h2>
          </div>
          <Link
            href="/shop?sort=newest"
            className="w-fit border-b border-ink pb-1 text-sm font-semibold"
          >
            View all new arrivals
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="page-shell pb-20 sm:pb-28">
        <div className="grid overflow-hidden rounded-[1.5rem] bg-ink text-white lg:grid-cols-2">
          <div className="relative min-h-[30rem] overflow-hidden">
            <Image
              src="/images/products/demo-runner-blue.png"
              alt="Original placeholder lifestyle runner in dusty blue"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-between gap-16 p-7 sm:p-12 lg:p-16">
            <p className="eyebrow text-gold">A better way to browse</p>
            <div>
              <h2 className="section-title max-w-xl">
                Your size, without the guesswork.
              </h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/65">
                Every size will be tied to live Shopify inventory. Once the
                official catalogue is connected, sold-out options disappear
                from checkout as stock changes.
              </p>
              <Link
                href="/shop"
                className="mt-8 inline-flex min-h-13 items-center justify-center rounded-xl bg-white px-7 text-sm font-bold uppercase tracking-[0.13em] text-ink transition-colors hover:bg-gold"
              >
                Browse by EU size
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="page-shell grid divide-y divide-line py-3 md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            ["01", "Ghana cedi pricing", "Every storefront price is shown in GHS."],
            ["02", "Tracked by size", "Each EU size has its own stock quantity."],
            ["03", "Secure checkout", "Shopify checkout with Paystack after connection."],
          ].map(([number, title, copy]) => (
            <article
              key={number}
              className="py-8 md:px-8 md:first:pl-0 md:last:pr-0"
            >
              <p className="font-mono text-xs text-muted">{number}</p>
              <h2 className="mt-8 text-xl font-semibold tracking-[-0.03em]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-vault">Selected for you</p>
            <h2 className="section-title mt-3">Inside the edit.</h2>
          </div>
          <Link
            href="/shop"
            className="w-fit border-b border-ink pb-1 text-sm font-semibold"
          >
            Shop the full catalogue
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
