import type { Metadata } from "next";
import Link from "next/link";

import {
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
} from "@/lib/site-contact";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description:
    "Sneaker Vault GH returns and refunds policy: return conditions, eligible reasons, the 4-day return window, how to start a return and refund methods.",
};

type PolicySection = {
  title: string;
  intro?: string;
  items?: string[];
  outro?: string;
};

const sections: PolicySection[] = [
  {
    title: "Return conditions",
    intro:
      "Items must be unworn, in original condition, with tags attached.",
  },
  {
    title: "Eligible reasons",
    intro: "A return is accepted for one of the following reasons:",
    items: ["Wrong size", "Wrong item", "Damaged or defective"],
  },
  {
    title: "Return window",
    intro: "You may return eligible items within 4 days of delivery.",
  },
  {
    title: "How to start a return",
    items: [
      "Contact customer support with the order number, the item being returned and the reason for the request.",
      "The team will review the request and provide the next steps if it is eligible.",
    ],
  },
  {
    title: "Refund methods",
    intro: "Approved refunds are paid by one of the following methods:",
    items: ["Mobile Money (MoMo)", "Cash"],
  },
];

export default function ReturnsPolicyPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <article className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <header className="border-b border-line pb-10 sm:pb-14">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Customer care
          </p>
          <h1 className="display-type">
            Returns &amp; refunds
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
                <div className="max-w-2xl space-y-3 text-base leading-7 text-muted">
                  {section.intro ? <p>{section.intro}</p> : null}
                  {section.items ? (
                    <ul className="list-disc space-y-2 pl-5">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {section.outro ? <p>{section.outro}</p> : null}
                </div>
              </div>
            </section>
          ))}
        </div>

        <section
          aria-labelledby="returns-contact-heading"
          className="mt-8 grid gap-6 border-t border-line pt-8 sm:grid-cols-[3rem_1fr] sm:gap-7"
        >
          <span className="font-mono text-xs text-muted-soft">
            {String(sections.length + 1).padStart(2, "0")}
          </span>
          <div>
            <h2
              id="returns-contact-heading"
              className="mb-4 text-2xl font-medium tracking-[-0.03em]"
            >
              Return queries
            </h2>
            <dl className="grid max-w-3xl gap-6 text-base leading-7 sm:grid-cols-[1fr_1.5fr_1fr]">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Phone / WhatsApp
                </dt>
                <dd className="mt-2">
                  <a
                    href={`tel:${SUPPORT_PHONE_E164}`}
                    className="font-medium text-ink underline underline-offset-4"
                  >
                    {SUPPORT_PHONE_DISPLAY}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Email
                </dt>
                <dd className="mt-2">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-medium text-ink underline underline-offset-4"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Support hours
                </dt>
                <dd className="mt-2 text-muted">
                  {SUPPORT_HOURS.days}
                  <br />
                  {SUPPORT_HOURS.time}
                </dd>
              </div>
            </dl>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-muted">
              Please contact us before sending anything back. More ways to
              reach the team are on the{" "}
              <Link
                href="/contact"
                className="font-semibold text-ink underline underline-offset-4"
              >
                contact page
              </Link>
              .
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
