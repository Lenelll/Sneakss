import type { Metadata } from "next";
import Link from "next/link";

import {
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
  SUPPORT_WHATSAPP_URL,
  TIKTOK_HANDLE,
  TIKTOK_URL,
} from "@/lib/site-contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Sneaker Vault GH by phone, WhatsApp or email for help with products, orders, payments, returns or general enquiries.",
};

const contactMethods = [
  {
    label: "Phone",
    value: SUPPORT_PHONE_DISPLAY,
    href: `tel:${SUPPORT_PHONE_E164}`,
    note: "Call us during support hours for help with products and orders.",
  },
  {
    label: "WhatsApp",
    value: SUPPORT_PHONE_DISPLAY,
    href: SUPPORT_WHATSAPP_URL,
    note: "Message us on WhatsApp for quick questions and order follow-up.",
  },
  {
    label: "Email",
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    note: "For product, payment, order and return queries.",
  },
  {
    label: "TikTok",
    value: TIKTOK_HANDLE,
    href: TIKTOK_URL,
    note: "Follow us for new pairs, drops and behind-the-scenes.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <header className="grid gap-8 border-b border-line pb-12 lg:grid-cols-[1fr_0.7fr] lg:items-end lg:pb-16">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Customer care
            </p>
            <h1 className="display-type">
              How can we help?
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-muted sm:text-lg">
            Questions about a product or an order? Choose the most convenient
            way to reach the team.
          </p>
        </header>

        <section
          aria-labelledby="contact-options-heading"
          className="py-8 lg:py-14"
        >
          <h2 id="contact-options-heading" className="sr-only">
            Contact options
          </h2>
          <div className="grid border-t border-line md:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method, index) => (
              <article
                key={method.label}
                className="flex min-h-64 flex-col border-b border-line py-7 md:border-r md:px-6 md:even:border-r-0 lg:px-7 lg:even:border-r lg:first:pl-0 lg:last:border-r-0"
              >
                <div className="mb-auto flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">
                    {method.label}
                  </h3>
                  <span className="font-mono text-xs text-muted-soft">
                    0{index + 1}
                  </span>
                </div>
                <a
                  href={method.href}
                  className="mt-12 break-words text-xl font-medium leading-7 tracking-[-0.025em] underline decoration-1 underline-offset-4 transition-colors hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                  {...(method.href.startsWith("https://")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {method.value}
                </a>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {method.note}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-10 border-b border-line py-12 lg:grid-cols-2 lg:gap-20 lg:py-16">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Support hours
            </p>
            <h2 className="text-3xl font-medium tracking-[-0.04em]">
              {SUPPORT_HOURS.days}
            </h2>
            <p className="mt-2 text-3xl font-medium tracking-[-0.04em] text-muted">
              {SUPPORT_HOURS.time}
            </p>
            <p className="mt-5 max-w-lg text-sm leading-6 text-muted">
              Messages received outside these hours will be answered when the
              team is next available.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              About an existing order?
            </p>
            <p className="max-w-lg text-base leading-7 text-muted">
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
            Returns &amp; refunds
          </Link>
          <Link className="underline underline-offset-4" href="/policies/privacy">
            Privacy policy
          </Link>
        </nav>
      </div>
    </main>
  );
}
