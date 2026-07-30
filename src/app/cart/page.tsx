import type { Metadata } from "next";
import { CartClient } from "./cart-client";

export const metadata: Metadata = {
  title: "Your Bag",
  description:
    "Review your selected sneakers and EU sizes before checkout at Sneaker Vault GH.",
};

export default function CartPage() {
  return (
    <main className="min-h-[70svh] bg-[#F5F2EA] text-[#151713]">
      <CartClient />
    </main>
  );
}
