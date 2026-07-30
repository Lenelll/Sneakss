import type { Metadata } from "next";
import { getCommerceReadiness } from "@/lib/commerce";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout Preview",
  description:
    "Review your Sneaker Vault GH order before secure Shopify checkout is enabled.",
};

export default function CheckoutPage() {
  const readiness = getCommerceReadiness();

  return (
    <main className="min-h-[70svh] bg-[#F5F2EA] text-[#151713]">
      <CheckoutClient
        customerAccountsConnected={readiness.customerAccountsConnected}
        storefrontConnected={readiness.storefrontConnected}
      />
    </main>
  );
}
