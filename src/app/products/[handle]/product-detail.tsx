"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useStore } from "@/components/store-provider";
import {
  formatGHS,
  getTotalInventory,
  type Product,
} from "@/lib";

export function ProductDetail({ product }: Readonly<{ product: Product }>) {
  const availableVariants = product.variants.filter(
    (variant) => variant.availableForSale,
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    availableVariants[0]?.id ?? "",
  );
  const [message, setMessage] = useState("");
  const { addItem } = useStore();

  const selectedVariant = product.variants.find(
    (variant) => variant.id === selectedVariantId,
  );

  function handleAddToBag() {
    if (!selectedVariant?.availableForSale) {
      setMessage("Choose an available EU size first.");
      return;
    }

    addItem(product.id, selectedVariant.id, 1);
    setMessage(`${selectedVariant.sizeLabel} added to your demo bag.`);
  }

  return (
    <section className="px-5 pb-14 sm:px-8 sm:pb-20 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:gap-14">
        <div>
          <div className="relative aspect-[4/4.25] overflow-hidden rounded-[24px] border border-[#DFDFD7] bg-[#EAE6DC] sm:rounded-[32px]">
            <Image
              src={product.images[0].src}
              alt={product.images[0].alt}
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover transition-transform duration-700 hover:scale-[1.015]"
            />
            <span className="absolute top-4 left-4 rounded-full bg-[#E0B33D] px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[#151713] uppercase shadow-sm sm:top-6 sm:left-6">
              Demo product
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[#D8D8D0] bg-white p-5">
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#686B64] uppercase">
                Colourway
              </p>
              <p className="mt-2 text-sm font-semibold">{product.colorway}</p>
            </div>
            <div className="rounded-2xl border border-[#D8D8D0] bg-white p-5">
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#686B64] uppercase">
                Category
              </p>
              <p className="mt-2 text-sm font-semibold">{product.category}</p>
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold tracking-[0.16em] text-[#0E4E3E] uppercase">
              {product.brand}
            </p>
            <p className="text-xs font-semibold text-[#686B64]">
              {getTotalInventory(product)} demo units
            </p>
          </div>

          <h1 className="mt-3 text-5xl leading-[0.98] font-semibold tracking-[-0.055em] sm:text-6xl">
            {product.title}
          </h1>
          <p className="mt-5 text-2xl font-semibold">
            {formatGHS(product.price)}
          </p>
          <p className="mt-6 text-base leading-7 text-[#5A5E56]">
            {product.description}
          </p>

          <div className="mt-9 border-t border-[#D8D8D0] pt-7">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold">Select EU size</h2>
              <Link
                href="/contact"
                className="text-xs font-bold text-[#0E4E3E] underline decoration-1 underline-offset-4"
              >
                Ask about sizing
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
              {product.variants.map((variant) => {
                const isSelected = selectedVariantId === variant.id;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={!variant.availableForSale}
                    aria-pressed={isSelected}
                    aria-label={`${variant.sizeLabel}${
                      variant.availableForSale ? "" : ", sold out"
                    }`}
                    onClick={() => {
                      setSelectedVariantId(variant.id);
                      setMessage("");
                    }}
                    className={`relative min-h-12 rounded-xl border text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E4E3E] ${
                      isSelected
                        ? "border-[#0E4E3E] bg-[#0E4E3E] text-white"
                        : variant.availableForSale
                          ? "border-[#C9CAC2] bg-white hover:border-[#0E4E3E]"
                          : "cursor-not-allowed border-[#D8D8D0] bg-[#EEECE6] text-[#999B94] line-through"
                    }`}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!selectedVariant?.availableForSale}
              onClick={handleAddToBag}
              className="mt-6 min-h-14 w-full rounded-xl bg-[#0E4E3E] px-6 text-sm font-bold text-white transition-colors hover:bg-[#09382C] disabled:cursor-not-allowed disabled:bg-[#A5A89F] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E4E3E]"
            >
              {selectedVariant?.availableForSale
                ? `Add ${selectedVariant.sizeLabel} to bag`
                : "Select an available size"}
            </button>

            <p
              aria-live="polite"
              className={`min-h-6 pt-3 text-center text-sm font-semibold ${
                message ? "text-[#0E4E3E]" : "text-transparent"
              }`}
            >
              {message || "No update"}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-[#D8D8D0] bg-white">
            <details className="group border-b border-[#E4E4DD] px-5 py-4" open>
              <summary className="cursor-pointer list-none text-sm font-bold">
                Product details
              </summary>
              <div className="pt-3 text-sm leading-6 text-[#686B64]">
                <p>
                  {product.colorway} · {product.category} · EU sizing
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <span
                      key={color.name}
                      className="inline-flex items-center gap-2 rounded-full border border-[#D8D8D0] px-3 py-1.5 text-xs font-semibold"
                    >
                      <span
                        aria-hidden="true"
                        className="size-3 rounded-full border border-black/10"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name}
                    </span>
                  ))}
                </div>
              </div>
            </details>
            <details className="group px-5 py-4">
              <summary className="cursor-pointer list-none text-sm font-bold">
                About this catalogue
              </summary>
              <p className="pt-3 text-sm leading-6 text-[#686B64]">
                This is fictional development inventory. Official photos,
                products, prices and stock will replace it when Shopify is
                connected.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
