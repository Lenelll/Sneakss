import type { Metadata } from "next";
import Link from "next/link";
import { AccountAccess } from "./account-access";

export const metadata: Metadata = {
  title: "Account",
  description:
    "Access your Sneaker Vault GH customer account with a secure email code.",
};

export default function AccountPage() {
  return (
    <main className="bg-[#F5F2EA] text-[#151713]">
      <section className="mx-auto grid min-h-[calc(100svh-8rem)] w-full max-w-[90rem] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] lg:items-center lg:px-12 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#0E4E3E] uppercase">
            Your vault
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
            One account for every pair.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#686B64] sm:text-lg">
            Checkout will require a customer account so orders and product
            interests can stay connected to the right person. There is no
            password to remember.
          </p>

          <ol className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              ["01", "Enter your email"],
              ["02", "Receive a one-time code"],
              ["03", "Access orders and checkout"],
            ].map(([number, label]) => (
              <li
                className="rounded-2xl border border-[#D8D8D0] bg-white/60 p-4"
                key={number}
              >
                <span className="text-xs font-semibold text-[#0E4E3E]">
                  {number}
                </span>
                <span className="mt-5 block text-sm font-medium">{label}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
            <Link
              className="font-semibold text-[#0E4E3E] underline decoration-[#E0B33D] decoration-2 underline-offset-4"
              href="/shop"
            >
              Continue shopping
            </Link>
            <span className="text-[#A2A49D]" aria-hidden="true">
              /
            </span>
            <Link className="text-[#686B64] hover:text-[#151713]" href="/contact">
              Need help?
            </Link>
          </div>
        </div>

        <AccountAccess />
      </section>
    </main>
  );
}
