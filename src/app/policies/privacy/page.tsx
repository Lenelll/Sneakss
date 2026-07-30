import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the draft Sneaker Vault GH privacy policy and how customer information is expected to be handled.",
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "The store may process account and contact details, delivery information, order history, support messages, marketing preferences, and technical information generated when customers use the website.",
      "Payment details are processed by the approved checkout and payment providers. Sneaker Vault GH should not receive full card credentials.",
    ],
  },
  {
    title: "How information is used",
    body: [
      "Information may be used to create and secure customer accounts, process and fulfil orders, provide support, prevent misuse, maintain the website, meet legal obligations, and send marketing only where permitted.",
      "[Confirm each business purpose, marketing practice, and lawful basis with a qualified privacy adviser.]",
    ],
  },
  {
    title: "Service providers",
    body: [
      "The storefront is expected to use Shopify for commerce and customer accounts and Paystack for payment processing. Hosting, analytics, communications, and delivery providers must be added here once selected.",
      "These providers process information under their own terms and privacy practices. The final policy should identify relevant international data transfers and safeguards.",
    ],
  },
  {
    title: "Retention and security",
    body: [
      "Sneaker Vault GH intends to keep personal information only for as long as needed for the purposes described in the final policy, including order records, support, fraud prevention, and applicable legal obligations.",
      "[Confirm retention periods, internal access controls, incident procedures, and the responsible data contact.]",
    ],
  },
  {
    title: "Choices and rights",
    body: [
      "Depending on applicable law, customers may be able to ask about, correct, or request action on their personal information, and may withdraw marketing consent.",
      "[Legal review is required to confirm the rights available, any exceptions, identity-verification steps, and response timelines in Ghana.]",
    ],
  },
  {
    title: "Cookies and analytics",
    body: [
      "The website will use technologies required for core functions such as authentication, cart persistence, checkout, security, and user preferences. Optional analytics or advertising tools must not be described or enabled until approved.",
      "[Confirm the cookie notice and consent approach after the final analytics stack is selected.]",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f4f3ef] text-neutral-950">
      <article className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <header className="border-b border-neutral-300 pb-10 sm:pb-14">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Legal
          </p>
          <h1 className="text-5xl font-medium leading-none tracking-[-0.05em] sm:text-6xl">
            Privacy policy
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
          This policy is an implementation draft, not legal advice. It must be
          updated for the final data practices and reviewed for compliance
          before the store launches.
        </aside>

        <section className="pb-9 text-lg leading-8 text-neutral-700">
          <p className="max-w-3xl">
            This draft explains the types of information Sneaker Vault GH is
            expected to handle when customers browse, create an account,
            purchase products, or request support.
          </p>
        </section>

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
          Privacy contact: [Insert approved privacy email and postal address].
          General contact options will appear on the{" "}
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
