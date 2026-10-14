import type { Metadata } from "next";
import Link from "next/link";

import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
} from "@/lib/site-contact";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Sneaker Vault GH only collects the details needed to deliver your order, never sells your data, and uses cookies only for your cart and analytics.",
};

const sections = [
  {
    title: "What we collect",
    body: "We only collect what we need to deliver your order: name, phone, email, and delivery address.",
  },
  {
    title: "What we never do",
    body: "We never sell your data.",
  },
  {
    title: "Cookies",
    body: "Cookies are used only for your cart and analytics.",
  },
  {
    title: "Deleting your records",
    body: "To request deletion of your records, contact us.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <article className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <header className="border-b border-line pb-10 sm:pb-14">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Legal
          </p>
          <h1 className="display-type">
            Privacy policy
          </h1>
          <p className="mt-5 text-sm text-muted">
            Last updated: 14 October 2026
          </p>
        </header>

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
                <p className="max-w-2xl text-base leading-7 text-muted">
                  {section.body}
                </p>
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-8 border-t border-line pt-8 text-sm leading-6 text-muted">
          To request deletion of your records, email{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-semibold text-ink underline underline-offset-4"
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          or call{" "}
          <a
            href={`tel:${SUPPORT_PHONE_E164}`}
            className="font-semibold text-ink underline underline-offset-4"
          >
            {SUPPORT_PHONE_DISPLAY}
          </a>
          . More ways to reach us are on the{" "}
          <Link
            href="/contact"
            className="font-semibold text-ink underline underline-offset-4"
          >
            contact page
          </Link>
          .
        </footer>
      </article>
    </main>
  );
}
