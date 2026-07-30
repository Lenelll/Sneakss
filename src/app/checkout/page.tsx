import type { Metadata } from "next";
import { getCommerceReadiness } from "@/lib/commerce";
import { getCustomerSession } from "@/lib/shopify/customer-auth";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Review your Sneaker Vault GH order before secure Shopify checkout.",
};

type CheckoutPageProps = {
  searchParams: Promise<{ checkout?: string | string[] }>;
};

const checkoutErrors: Record<string, string> = {
  configuration:
    "Checkout is waiting for the final Shopify account configuration.",
  verification: "The checkout request could not be verified. Please try again.",
  invalid: "Shopify returned an invalid checkout destination.",
  unavailable: "Shopify checkout is temporarily unavailable. Please try again.",
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const readiness = getCommerceReadiness();
  const session = await getCustomerSession();
  const params = await searchParams;
  const status = Array.isArray(params.checkout)
    ? params.checkout[0]
    : params.checkout;

  return (
    <main className="min-h-[70svh] bg-[#F5F2EA] text-[#151713]">
      <CheckoutClient
        customerAccountsConnected={readiness.customerAccountsConnected}
        checkoutError={status ? checkoutErrors[status] : undefined}
        signedIn={Boolean(session)}
        storefrontConnected={readiness.storefrontConnected}
      />
    </main>
  );
}
