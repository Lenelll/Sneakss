import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { ProductReviews } from "@/components/product-reviews";
import { getRelatedProducts, products } from "@/lib";
import {
  getCommerceCatalog,
  getCommerceProduct,
} from "@/lib/catalog-source";
import { getCurrentReviewer } from "@/lib/reviews/reviewer";
import {
  getProductReviews,
  getReviewStoreKind,
  getReviewSummaries,
} from "@/lib/reviews/store";

import { ProductDetail } from "./product-detail";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return products.map((product) => ({ handle: product.handle }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const { product } = await getCommerceProduct(handle);

  if (!product) {
    return {
      title: "Product not found",
    };
  }

  return {
    title: product.title,
    description: product.isDemo
      ? `${product.description} Temporary preview product shown in ${product.variants[0]?.sizeLabel ?? "EU sizing"}.`
      : product.description,
    openGraph: {
      title: `${product.title} | Sneaker Vault GH`,
      description: product.description,
      images: [
        {
          url: product.images[0].src,
          alt: product.images[0].alt,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const { product } = await getCommerceProduct(handle);

  if (!product) {
    notFound();
  }

  const [catalog, reviewData, reviewer, storeKind] = await Promise.all([
    getCommerceCatalog(),
    getProductReviews(product.handle),
    getCurrentReviewer(),
    getReviewStoreKind(),
  ]);
  const storageWarning =
    process.env.NODE_ENV === "production" && storeKind === "memory";
  const relatedProducts = getRelatedProducts(product, 3, catalog.products);
  const relatedRatings = await getReviewSummaries(
    relatedProducts.map((related) => related.handle),
  );
  const availableVariants = product.variants.filter(
    (variant) => variant.availableForSale,
  );
  const inStock = availableVariants.length > 0;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    brand: { "@type": "Brand", name: product.brand },
    description: product.description,
    image: product.images.map((image) => new URL(image.src, siteUrl).href),
    sku: product.variants[0]?.sku,
    color: product.colorway,
    category: product.category,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "GHS",
      lowPrice: Math.min(...product.variants.map((variant) => variant.price)),
      highPrice: Math.max(...product.variants.map((variant) => variant.price)),
      offerCount: availableVariants.length,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: new URL(`/products/${product.handle}`, siteUrl).href,
    },
    ...(reviewData.summary.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewData.summary.average,
            reviewCount: reviewData.summary.count,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviewData.reviews.slice(0, 10).map((review) => ({
            "@type": "Review",
            name: review.title,
            reviewBody: review.body,
            datePublished: review.createdAt,
            author: { "@type": "Person", name: review.authorName },
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : {}),
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <script
        type="application/ld+json"
        // JSON.stringify output is escaped so it cannot close the tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-8 lg:px-12">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-semibold text-muted"
        >
          <Link href="/" className="hover:text-brand">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/shop" className="hover:text-brand">
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/shop?category=${encodeURIComponent(product.category)}`}
            className="hover:text-brand"
          >
            {product.category}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-ink">{product.title}</span>
        </nav>
      </div>

      <ProductDetail product={product} reviewSummary={reviewData.summary} />

      <ProductReviews
        productHandle={product.handle}
        productTitle={product.title}
        initialReviews={reviewData.reviews}
        initialSummary={reviewData.summary}
        reviewer={reviewer ? { displayName: reviewer.displayName } : null}
        signInHref={`/account/sign-in?returnTo=${encodeURIComponent(
          `/products/${product.handle}#reviews`,
        )}`}
        storageWarning={storageWarning}
      />

      {relatedProducts.length > 0 ? (
        <section className="border-t border-line bg-surface px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-8 flex items-end justify-between gap-5">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-brand uppercase">
                  Keep exploring
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  Similar pairs
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden text-sm font-bold text-brand underline decoration-1 underline-offset-4 sm:block"
              >
                View all styles
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-3">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  rating={relatedRatings[relatedProduct.handle]}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
