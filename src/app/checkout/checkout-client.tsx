"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/store-provider";
import { formatGHS } from "@/lib";

type CheckoutClientProps = {
  storefrontConnected: boolean;
  customerAccountsConnected: boolean;
};

export function CheckoutClient({
  storefrontConnected,
  customerAccountsConnected,
}: CheckoutClientProps) {
  const { lines, itemCount, subtotal, isHydrated } = useStore();

  if (!isHydrated) {
    return (
      <div
        aria-live="polite"
        className="mx-auto min-h-[24rem] max-w-[90rem] px-5 py-16 sm:px-8 lg:px-12"
      >
        <p className="text-sm text-[#686B64]">Preparing your summary…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="mx-auto flex min-h-[32rem] max-w-[90rem] flex-col items-start justify-center px-5 py-16 sm:px-8 lg:px-12">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#0E4E3E] uppercase">
          Checkout preview
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
          Your bag is empty.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-[#686B64]">
          Add a demo product and select an EU size before reviewing the
          checkout handoff.
        </p>
        <Link
          className="mt-8 rounded-xl bg-[#0E4E3E] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123F35]"
          href="/shop"
        >
          Browse the collection
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[90rem] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#0E4E3E] uppercase">
          Checkout preview
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
          Review now. Pay securely after Shopify is connected.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#686B64]">
          This page proves the order-summary experience only. It does not
          create an order, reserve inventory, sign in a customer, or collect
          payment.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:gap-14">
        <div>
          <div className="rounded-3xl border border-[#D8D8D0] bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-[-0.025em]">
                Integration gate
              </h2>
              <span className="rounded-full bg-[#FFF3CC] px-3 py-1 text-xs font-semibold text-[#6D5711]">
                Not live
              </span>
            </div>

            <ul className="mt-6 grid gap-4">
              <StatusRow
                connected={customerAccountsConnected}
                description="Required passwordless email-code access will be provided by Shopify Customer Accounts."
                label="Customer account"
              />
              <StatusRow
                connected={storefrontConnected}
                description="Products, inventory, cart, and orders will move from demo data to Shopify."
                label="Shopify Headless"
              />
              <StatusRow
                connected={false}
                description="Paystack will be enabled inside Shopify and verified in test mode before checkout is opened."
                label="Paystack payment"
              />
            </ul>

            <Link
              className="mt-7 inline-flex text-sm font-semibold text-[#0E4E3E] underline decoration-[#E0B33D] decoration-2 underline-offset-4"
              href="/account"
            >
              Preview customer account access
            </Link>
          </div>

          <div className="mt-6 rounded-3xl bg-[#EEEAE0] p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Launch behaviour</h2>
            <p className="mt-3 text-sm leading-6 text-[#686B64]">
              After the integrations are complete, checkout will require
              sign-in, verify live Shopify inventory, and hand payment to
              Shopify with Paystack configured as the provider.
            </p>
          </div>
        </div>

        <aside className="rounded-3xl bg-[#0E4E3E] p-6 text-white sm:p-7 lg:sticky lg:top-28">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">Order summary</h2>
            <span className="text-xs text-white/65">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>

          <ul className="mt-6 divide-y divide-white/20">
            {lines.map((line) => (
              <li className="flex gap-4 py-4 first:pt-0" key={line.lineId}>
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white">
                  <Image
                    alt={line.product.images[0].alt}
                    className="object-cover"
                    fill
                    sizes="64px"
                    src={line.product.images[0].src}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {line.product.title}
                  </p>
                  <p className="mt-1 text-xs text-white/65">
                    {line.variant.sizeLabel} · Qty {line.quantity}
                  </p>
                  <p className="mt-2 text-sm tabular-nums">
                    {formatGHS(line.lineTotal)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-2 border-t border-white/20 pt-5">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-white/70">Subtotal</dt>
              <dd className="font-semibold tabular-nums">
                {formatGHS(subtotal)}
              </dd>
            </div>
          </dl>

          <button
            aria-describedby="checkout-disabled-reason"
            className="mt-7 w-full cursor-not-allowed rounded-xl bg-white/15 px-5 py-3.5 text-sm font-semibold text-white/70"
            disabled
            type="button"
          >
            Secure checkout unavailable
          </button>
          <p
            className="mt-3 text-xs leading-5 text-white/65"
            id="checkout-disabled-reason"
          >
            Shopify Customer Accounts and the Shopify/Paystack checkout must
            be connected and tested first.
          </p>
          <Link
            className="mt-5 block text-center text-sm text-white underline underline-offset-4"
            href="/cart"
          >
            Return to bag
          </Link>
        </aside>
      </div>
    </section>
  );
}

function StatusRow({
  connected,
  description,
  label,
}: {
  connected: boolean;
  description: string;
  label: string;
}) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl bg-[#F5F2EA] p-4">
      <span
        aria-hidden="true"
        className={`mt-1 size-2.5 rounded-full ${
          connected ? "bg-[#0E4E3E]" : "bg-[#E0B33D]"
        }`}
      />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{label}</p>
          <span className="text-[0.68rem] font-semibold tracking-[0.08em] text-[#686B64] uppercase">
            {connected ? "Environment ready" : "Connection required"}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-[#686B64]">{description}</p>
      </div>
    </li>
  );
}
