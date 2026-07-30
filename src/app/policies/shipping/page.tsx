import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "Read the draft Sneaker Vault GH shipping policy, including order processing and delivery information.",
};

const sections = [
  {
    title: "Where we deliver",
    body: [
      "Sneaker Vault GH currently plans to fulfil orders within Ghana. The final list of supported areas must be confirmed before launch.",
      "[Insert any locations that cannot be served or require special arrangements.]",
    ],
  },
  {
    title: "Delivery arrangements",
    body: [
      "Delivery is fulfilled outside this web app by the store’s delivery partner. The storefront does not currently calculate delivery options, charges, or estimated arrival times.",
      "[Confirm how and when the delivery partner will contact customers, collect any delivery fee, and provide an estimated timeline.]",
    ],
  },
  {
    title: "Order processing",
    body: [
      "Paid orders will be reviewed and prepared before they are handed to the store’s delivery partner. Customers should receive an update using the contact information supplied at checkout.",
      "[Confirm processing days, cut-off times, weekends, public holidays, and dispatch notifications.]",
    ],
  },
  {
    title: "Delivery details",
    body: [
      "Customers are responsible for providing an accurate recipient name, phone number, and delivery address. If any detail is incorrect, contact the support team as soon as possible. Changes may not be possible after an order has been prepared.",
      "[Confirm how failed delivery attempts, address changes, and additional delivery costs will be handled.]",
    ],
  },
  {
    title: "Delays or missing orders",
    body: [
      "If an order has not arrived within the expected window, contact Sneaker Vault GH with the order number. The team will review the order and coordinate with its delivery partner where appropriate.",
      "[Confirm the investigation process and the point at which an order is treated as missing.]",
    ],
  },
];

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f4f3ef] text-neutral-950">
      <article className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <header className="border-b border-neutral-300 pb-10 sm:pb-14">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Customer care
          </p>
          <h1 className="text-5xl font-medium leading-none tracking-[-0.05em] sm:text-6xl">
            Shipping policy
          </h1>
          <p className="mt-5 text-sm text-neutral-500">
            Effective date: [To be confirmed]
          </p>
        </header>

        <aside
          aria-label="Draft policy notice"
          className="my-8 border-l-4 border-amber-400 bg-white px-5 py-4 text-sm leading-6 text-neutral-700 sm:px-6"
        >
          <span className="font-semibold text-neutral-950">Draft content.</span>{" "}
          This policy contains operational placeholders and is not ready for
          publication. The client and delivery partner must approve delivery
          areas, charges, timelines, and procedures before launch.
        </aside>

        <div className="divide-y divide-neutral-300 border-t border-neutral-300">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className="grid gap-5 py-9 sm:grid-cols-[3rem_1fr] sm:gap-7"
            >
              <span className="font-mono text-xs text-neutral-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="mb-4 text-2xl font-medium tracking-[-0.03em]">
                  {section.title}
                </h2>
                <div className="max-w-2xl space-y-3 text-base leading-7 text-neutral-700">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-8 border-t border-neutral-300 pt-8 text-sm leading-6 text-neutral-600">
          Questions about delivery? Visit the{" "}
          <Link
            href="/contact"
            className="font-semibold text-neutral-950 underline underline-offset-4"
          >
            contact page
          </Link>
          .
        </footer>
      </article>
    </main>
  );
}
