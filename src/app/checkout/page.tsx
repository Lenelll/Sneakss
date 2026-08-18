import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCommerceReadiness } from "@/lib/commerce";
import { getCustomerSessionState } from "@/lib/shopify/customer-auth";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Review your Sneaker Vault GH order before secure Shopify checkout.",
};

type CheckoutPageProps = {
  searchParams: Promise<{
    checkout?: string | string[];
    resume?: string | string[];
  }>;
};

const checkoutErrors: Record<string, string> = {
  configuration:
    "Checkout is waiting for the final Shopify account configuration.",
  verification: "The checkout request could not be verified. Please try again.",
  invalid: "Shopify returned an invalid checkout destination.",
  unavailable: "Shopify checkout is temporarily unavailable. Please try again.",
  empty: "Your cart is empty. Add a pair before checkout.",
};

type CheckoutStatus =
  | "configuration"
  | "verification"
  | "invalid"
  | "unavailable"
  | "empty"
  | "none";

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const readiness = getCommerceReadiness();
  const params = await searchParams;
  const status = Array.isArray(params.checkout)
    ? params.checkout[0]
    : params.checkout;
  const resumeValue = Array.isArray(params.resume)
    ? params.resume[0]
    : params.resume;
  const resumeCheckout = resumeValue === "1";
  const sessionState = await getCustomerSessionState();

  if (sessionState.status === "refresh-required") {
    const returnTo = new URLSearchParams();

    if (status) {
      returnTo.set("checkout", status);
    }

    if (resumeCheckout) {
      returnTo.set("resume", "1");
    }

    const checkoutPath = `/checkout${returnTo.size ? `?${returnTo}` : ""}`;
    redirect(
      `/account/auth/session?returnTo=${encodeURIComponent(checkoutPath)}`,
    );
  }

  const session =
    sessionState.status === "valid" ? sessionState.session : null;

  return (
    <main className="min-h-[70svh] bg-[#F5F2EA] text-[#151713]">
      <CheckoutClient
        customerAccountsConnected={readiness.customerAccountsConnected}
        checkoutError={
          status && status in checkoutErrors ? checkoutErrors[status] : undefined
        }
        checkoutStatus={
          status && status in checkoutErrors ? (status as CheckoutStatus) : "none"
        }
        resumeCheckout={resumeCheckout}
        signedIn={Boolean(session)}
        storefrontConnected={readiness.storefrontConnected}
      />
    </main>
  );
}
