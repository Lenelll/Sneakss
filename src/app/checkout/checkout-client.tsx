"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/store-provider";
import { formatGHS } from "@/lib";

type CheckoutClientProps = {
  storefrontConnected: boolean;
  customerAccountsConnected: boolean;
  signedIn: boolean;
  resumeCheckout: boolean;
  checkoutError?: string;
  checkoutStatus:
    | "configuration"
    | "verification"
    | "invalid"
    | "unavailable"
    | "empty"
    | "none";
};

export function CheckoutClient({
  storefrontConnected,
  customerAccountsConnected,
  signedIn,
  resumeCheckout,
  checkoutError,
  checkoutStatus,
}: CheckoutClientProps) {
  const {
    lines,
    itemCount,
    subtotal,
    mode,
    isHydrated,
    isPending,
    cartError,
  } = useStore();
  const isLiveCart = mode === "shopify";
  const canCheckout =
    isLiveCart &&
    storefrontConnected &&
    customerAccountsConnected &&
    signedIn &&
    lines.length > 0;

  const checkoutUnavailableReason =
    checkoutStatus === "configuration"
      ? "Storefront configuration is incomplete. Please recheck Shopify account setup in the app."
      : checkoutStatus === "verification"
        ? "Checkout verification failed. Please retry from your cart."
        : checkoutStatus === "invalid"
          ? "The checkout destination is invalid. Please retry."
          : checkoutStatus === "unavailable"
            ? "Shopify checkout is temporarily unavailable. Try again shortly."
            : checkoutStatus === "empty"
              ? "No items are in your cart."
              : canCheckout
                ? "You will leave this storefront for Shopify checkout."
                : !signedIn
                  ? "Sign in is required before proceeding."
                  : !customerAccountsConnected
                    ? "Customer account integration is not configured."
                    : !isLiveCart || !storefrontConnected
                      ? "Use live Shopify products to checkout."
                      : "Update cart before checkout.";
  const disabledReason = checkoutError || cartError || checkoutUnavailableReason;

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
          Checkout
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
          Your bag is empty.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-[#686B64]">
          Choose an available EU size before continuing to secure Shopify
          checkout.
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
          Secure checkout
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
          Review your pair, then continue with Shopify.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#686B64]">
          A customer account is required. Shopify confirms live inventory and
          hands payment to Paystack inside its secure checkout.
        </p>
      </div>

      {(checkoutError || cartError) && (
        <p
          className="mt-8 rounded-2xl border border-[#E0B33D]/50 bg-[#FFF9E8] p-4 text-sm leading-6 text-[#584814]"
          role="alert"
        >
          {checkoutError || cartError}
        </p>
      )}

      {resumeCheckout && signedIn && !checkoutError ? (
        <p
          className="mt-8 rounded-2xl border border-[#0E4E3E]/25 bg-[#EEF7F3] p-4 text-sm leading-6 text-[#0E4E3E]"
          role="status"
        >
          Sign-in complete. Review your order, then continue to secure
          Shopify checkout below.
        </p>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:gap-14">
        <div>
          <div className="rounded-3xl border border-[#D8D8D0] bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-[-0.025em]">
                Checkout readiness
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  canCheckout
                    ? "bg-[#DCEDE7] text-[#0E4E3E]"
                    : "bg-[#FFF3CC] text-[#6D5711]"
                }`}
              >
                {canCheckout ? "Ready" : "Action needed"}
              </span>
            </div>

            <ul className="mt-6 grid gap-4">
              <StatusRow
                connected={signedIn}
                description={
                  customerAccountsConnected
                    ? "Shopify hosts the passwordless email-code sign-in."
                    : "The final callback URL and encrypted session secret still need configuration."
                }
                label="Customer account"
              />
              <StatusRow
                connected={isLiveCart && storefrontConnected}
                description={
                  isLiveCart
                    ? "Products, EU size inventory, and this cart come from Shopify."
                    : "This is a preview cart, so a real order cannot be created."
                }
                label="Shopify Headless"
              />
              <StatusRow
                connected
                description="Paystack test mode is configured inside Shopify checkout; a full test order is still required before launch."
                label="Paystack payment"
              />
            </ul>

            {!signedIn && customerAccountsConnected ? (
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  className="inline-flex rounded-xl bg-[#0E4E3E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123F35]"
                  href="/account/sign-up?returnTo=/checkout"
                >
                  Create account to continue
                </Link>
                <Link
                  className="text-sm font-semibold text-[#0E4E3E] underline decoration-[#E0B33D] decoration-2 underline-offset-4"
                  href="/account/sign-in?returnTo=/checkout"
                >
                  Sign in with email
                </Link>
              </div>
            ) : (
              <Link
                className="mt-7 inline-flex text-sm font-semibold text-[#0E4E3E] underline decoration-[#E0B33D] decoration-2 underline-offset-4"
                href="/account"
              >
                View customer account
              </Link>
            )}
          </div>

          <div className="mt-6 rounded-3xl bg-[#EEEAE0] p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Delivery</h2>
            <p className="mt-3 text-sm leading-6 text-[#686B64]">
              Delivery is fulfilled separately by Sneaker Vault GH&apos;s
              delivery partner. This storefront does not dispatch or track
              deliveries.
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

          {canCheckout ? (
            <form action="/api/cart/checkout" method="post">
              <button
                className="mt-7 w-full rounded-xl bg-[#E0B33D] px-5 py-3.5 text-sm font-semibold text-[#151713] transition hover:bg-[#E7BF56] disabled:cursor-wait disabled:opacity-70"
                disabled={isPending}
                type="submit"
              >
                Continue to secure checkout
              </button>
            </form>
          ) : (
            <button
              aria-describedby="checkout-disabled-reason"
              className="mt-7 w-full cursor-not-allowed rounded-xl bg-white/15 px-5 py-3.5 text-sm font-semibold text-white/70"
              disabled
              type="button"
            >
              Checkout unavailable
            </button>
          )}
          <p
            className="mt-3 text-xs leading-5 text-white/65"
            id="checkout-disabled-reason"
          >
            {disabledReason}
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
            {connected ? "Ready" : "Required"}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-[#686B64]">{description}</p>
      </div>
    </li>
  );
}
