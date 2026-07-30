import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Sneaker Vault GH for help with products, orders, payments, or general enquiries.",
};

const contactMethods = [
  {
    label: "Email",
    value: "[Customer support email to be confirmed]",
    note: "For product, payment, and order questions.",
  },
  {
    label: "Phone",
    value: "[Customer support number to be confirmed]",
    note: "For support during published business hours.",
  },
  {
    label: "WhatsApp",
    value: "[Official WhatsApp number to be confirmed]",
    note: "For quick questions and order follow-up.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f4f3ef] text-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <header className="grid gap-8 border-b border-neutral-300 pb-12 lg:grid-cols-[1fr_0.7fr] lg:items-end lg:pb-16">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
              Customer care
            </p>
            <h1 className="text-5xl font-medium leading-none tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              How can we help?
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-neutral-600 sm:text-lg">
            Questions about a product or an order? Choose the most convenient
            way to reach the team.
          </p>
        </header>

        <aside
          aria-label="Draft content notice"
          className="my-10 border-l-4 border-amber-400 bg-white px-5 py-4 text-sm leading-6 text-neutral-700 sm:px-6"
        >
          <span className="font-semibold text-neutral-950">Draft content.</span>{" "}
          Contact details and support hours are placeholders until the client
          approves the official information.
        </aside>

        <section
          aria-labelledby="contact-options-heading"
          className="py-8 lg:py-14"
        >
          <h2 id="contact-options-heading" className="sr-only">
            Contact options
          </h2>
          <div className="grid border-t border-neutral-300 lg:grid-cols-3">
            {contactMethods.map((method, index) => (
              <article
                key={method.label}
                className="flex min-h-64 flex-col border-b border-neutral-300 py-7 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0"
              >
                <div className="mb-auto flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">
                    {method.label}
                  </h3>
                  <span className="font-mono text-xs text-neutral-400">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-12 break-words text-xl font-medium leading-7 tracking-[-0.025em]">
                  {method.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {method.note}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-10 border-b border-neutral-300 py-12 lg:grid-cols-2 lg:gap-20 lg:py-16">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Support hours
            </p>
            <h2 className="text-3xl font-medium tracking-[-0.04em]">
              [Days and hours to be confirmed]
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-6 text-neutral-600">
              Messages received outside the published support window will be
              answered when the team is next available.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              About an existing order?
            </p>
            <p className="max-w-lg text-base leading-7 text-neutral-700">
              Include your order number and the email address used at checkout.
              Never send payment card details, passwords, or one-time login
              codes in a support message.
            </p>
          </div>
        </section>

        <nav
          aria-label="Customer care links"
          className="flex flex-col gap-4 pt-10 text-sm font-semibold sm:flex-row sm:gap-8"
        >
          <Link className="underline underline-offset-4" href="/policies/shipping">
            Shipping information
          </Link>
          <Link className="underline underline-offset-4" href="/policies/returns">
            Returns policy
          </Link>
          <Link className="underline underline-offset-4" href="/policies/privacy">
            Privacy policy
          </Link>
        </nav>
      </div>
    </main>
  );
}
