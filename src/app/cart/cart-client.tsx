"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/store-provider";
import { formatGHS } from "@/lib";

export function CartClient() {
  const {
    lines,
    itemCount,
    subtotal,
    isHydrated,
    updateQuantity,
    removeItem,
  } = useStore();

  if (!isHydrated) {
    return (
      <div
        aria-live="polite"
        className="mx-auto min-h-[24rem] max-w-[90rem] px-5 py-16 sm:px-8 lg:px-12"
      >
        <p className="text-sm text-[#686B64]">Loading your bag…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="mx-auto flex min-h-[32rem] max-w-[90rem] flex-col items-start justify-center px-5 py-16 sm:px-8 lg:px-12">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#0E4E3E] uppercase">
          Your bag
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
          The vault is empty.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-[#686B64]">
          Explore the temporary catalog, choose an available EU size, and add
          a pair to see the full cart experience.
        </p>
        <Link
          className="mt-8 rounded-xl bg-[#0E4E3E] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123F35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E4E3E]"
          href="/shop"
        >
          Shop demo collection
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[90rem] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D8D8D0] pb-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#0E4E3E] uppercase">
            Your bag
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </h1>
        </div>
        <Link
          className="text-sm font-semibold text-[#0E4E3E] underline decoration-[#E0B33D] decoration-2 underline-offset-4"
          href="/shop"
        >
          Continue shopping
        </Link>
      </div>

      <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
        <ul className="divide-y divide-[#D8D8D0]">
          {lines.map((line) => (
            <li
              className="grid gap-5 py-7 first:pt-0 sm:grid-cols-[9rem_minmax(0,1fr)]"
              key={line.lineId}
            >
              <Link
                className="relative aspect-square overflow-hidden rounded-2xl bg-white"
                href={`/products/${line.product.handle}`}
              >
                <Image
                  alt={line.product.images[0].alt}
                  className="object-cover"
                  fill
                  sizes="(min-width: 640px) 144px, 40vw"
                  src={line.product.images[0].src}
                />
              </Link>

              <div className="flex min-w-0 flex-col">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] text-[#686B64] uppercase">
                      {line.product.brand}
                    </p>
                    <Link
                      className="mt-1 block text-xl font-semibold tracking-[-0.025em] hover:text-[#0E4E3E]"
                      href={`/products/${line.product.handle}`}
                    >
                      {line.product.title}
                    </Link>
                    <p className="mt-1 text-sm text-[#686B64]">
                      {line.product.colorway} · {line.variant.sizeLabel}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums sm:text-base">
                    {formatGHS(line.lineTotal)}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-5 sm:mt-auto">
                  <div
                    aria-label={`Quantity for ${line.product.title}, ${line.variant.sizeLabel}`}
                    className="inline-flex items-center rounded-xl border border-[#BFC1B9] bg-white"
                    role="group"
                  >
                    <button
                      aria-label={`Decrease ${line.product.title} quantity`}
                      className="flex size-10 items-center justify-center text-lg transition hover:bg-[#F5F2EA] disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={line.quantity <= 1}
                      onClick={() =>
                        updateQuantity(line.variantId, line.quantity - 1)
                      }
                      type="button"
                    >
                      −
                    </button>
                    <span
                      aria-live="polite"
                      className="min-w-9 text-center text-sm font-semibold tabular-nums"
                    >
                      {line.quantity}
                    </span>
                    <button
                      aria-label={`Increase ${line.product.title} quantity`}
                      className="flex size-10 items-center justify-center text-lg transition hover:bg-[#F5F2EA] disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={
                        line.quantity >= line.variant.inventoryQuantity ||
                        line.quantity >= 10
                      }
                      onClick={() =>
                        updateQuantity(line.variantId, line.quantity + 1)
                      }
                      type="button"
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="text-sm text-[#686B64] underline underline-offset-4 transition hover:text-[#B42318]"
                    onClick={() => removeItem(line.variantId)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl bg-[#0E4E3E] p-6 text-white sm:p-7 lg:sticky lg:top-28">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#E0B33D] uppercase">
            Order summary
          </p>
          <div className="mt-6 flex items-center justify-between border-b border-white/20 pb-5">
            <span className="text-sm text-white/75">Subtotal</span>
            <span className="font-semibold tabular-nums">
              {formatGHS(subtotal)}
            </span>
          </div>
          <p className="mt-5 text-xs leading-5 text-white/65">
            Products and inventory in this build are temporary demo data.
            Shopify will become the source of truth before launch.
          </p>
          <Link
            className="mt-6 block rounded-xl bg-[#E0B33D] px-5 py-3.5 text-center text-sm font-semibold text-[#151713] transition hover:bg-[#E7BF56] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href="/checkout"
          >
            Review checkout
          </Link>
        </aside>
      </div>
    </section>
  );
}
