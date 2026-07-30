import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import {
  getRelatedProducts,
  products,
} from "@/lib";
import {
  getCommerceCatalog,
  getCommerceProduct,
} from "@/lib/catalog-source";

import { ProductDetail } from "./product-detail";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

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

  const catalog = await getCommerceCatalog();
  const relatedProducts = getRelatedProducts(product, 3, catalog.products);

  return (
    <main className="min-h-screen bg-[#F5F2EA] text-[#151713]">
      <div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-8 lg:px-12">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-[#686B64]">
          <Link
            href="/shop"
            className="underline decoration-[#A5A89F] underline-offset-4 hover:text-[#0E4E3E]"
          >
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-[#151713]">{product.title}</span>
        </nav>
      </div>

      <ProductDetail product={product} />

      {relatedProducts.length > 0 ? (
        <section className="border-t border-[#D8D8D0] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-8 flex items-end justify-between gap-5">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-[#0E4E3E] uppercase">
                  Keep exploring
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  Similar pairs
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden text-sm font-bold text-[#0E4E3E] underline decoration-1 underline-offset-4 sm:block"
              >
                View all styles
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-3">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
