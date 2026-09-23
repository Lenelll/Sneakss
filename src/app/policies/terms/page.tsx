import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Read the draft terms and conditions for using the Sneaker Vault GH website and purchasing products.",
};

const sections = [
  {
    title: "Using this store",
    body: [
      "Customers must use the website lawfully and provide accurate information when creating an account or placing an order. Access may be restricted where necessary to protect customers, the store, or its services.",
      "[Confirm minimum-age requirements and any restrictions on who may purchase.]",
    ],
  },
  {
    title: "Customer accounts",
    body: [
      "Checkout requires a customer account. Customers are responsible for access to their email account and must not share one-time sign-in codes. Contact support promptly if an account may have been accessed without permission.",
      "[Confirm the account suspension, closure, and data-handling procedures.]",
    ],
  },
  {
    title: "Products and availability",
    body: [
      "The store aims to present product descriptions, images, prices, and EU size availability clearly. Displaying an item does not guarantee that it will remain available until checkout is completed.",
      "Reasonable efforts will be made to correct errors. [Confirm the process for pricing, description, and inventory errors discovered after an order is placed.]",
    ],
  },
  {
    title: "Orders and payment",
    body: [
      "Prices are displayed in Ghana cedis unless stated otherwise. Payment is processed through the methods offered at Shopify checkout, including the configured Paystack test or live service.",
      "An order is not accepted solely because checkout was submitted. [Confirm when a binding order is formed, tax treatment, cancellation rights, and the process for suspected fraud.]",
    ],
  },
  {
    title: "Shipping and returns",
    body: [
      "Delivery and return arrangements are governed by the policies linked below. Those policies form part of these terms once approved and published.",
      "[Ensure the final shipping and returns terms are consistent with checkout settings and actual operations.]",
    ],
  },
  {
    title: "Website content",
    body: [
      "The Sneaker Vault GH name, visual identity, website design, written content, and other store materials may be protected by intellectual-property rights. Product brands and marks belong to their respective owners.",
      "[Confirm ownership, permissions, and the correct process for reporting an intellectual-property concern.]",
    ],
  },
  {
    title: "Responsibility and governing law",
    body: [
      "[A qualified adviser must draft the liability, warranty, dispute-resolution, governing-law, and jurisdiction provisions appropriate to the business in Ghana.]",
      "Nothing in the final terms should exclude or limit rights or responsibilities that cannot lawfully be excluded.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <article className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <header className="border-b border-line pb-10 sm:pb-14">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Legal
          </p>
          <h1 className="display-type">
            Terms &amp; conditions
          </h1>
          <p className="mt-5 text-sm text-muted">
            Effective date: [To be confirmed]
          </p>
        </header>

        <aside
          aria-label="Draft policy notice"
          className="my-8 border-l-2 border-ink bg-surface-2 px-5 py-4 text-sm leading-6 text-muted sm:px-6"
        >
          <span className="font-semibold text-ink">Draft content.</span>{" "}
          These terms are a planning draft and not legal advice. They must be
          completed with the client’s official business details and reviewed
          before publication.
        </aside>

        <section className="pb-9 text-lg leading-8 text-muted">
          <p className="max-w-3xl">
            These draft terms are intended to govern access to the Sneaker
            Vault GH storefront, customer accounts, and online purchases.
          </p>
        </section>

        <div className="divide-y divide-line border-t border-line">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className="grid gap-5 py-9 sm:grid-cols-[3rem_1fr] sm:gap-7"
            >
              <span className="font-mono text-xs text-muted-soft">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="mb-4 text-2xl font-medium tracking-[-0.03em]">
                  {section.title}
                </h2>
                <div className="max-w-2xl space-y-3 text-base leading-7 text-muted">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-8 border-t border-line pt-8 text-sm leading-6 text-muted">
          Business identity and legal contact: [Insert registered business name,
          address, and approved email]. Review the{" "}
          <Link
            href="/policies/shipping"
            className="font-semibold text-ink underline underline-offset-4"
          >
            shipping
          </Link>{" "}
          and{" "}
          <Link
            href="/policies/returns"
            className="font-semibold text-ink underline underline-offset-4"
          >
            returns
          </Link>{" "}
          policies for related terms.
        </footer>
      </article>
    </main>
  );
}
