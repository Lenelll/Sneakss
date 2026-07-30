import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns Policy",
  description:
    "Read the draft Sneaker Vault GH returns policy and the proposed process for requesting a return.",
};

const sections = [
  {
    title: "Return window",
    body: [
      "[Confirm the number of calendar days customers have to request a return after receiving an order.]",
      "A return request must be submitted within the approved window. Sending an item back without first contacting the support team may delay or prevent processing.",
    ],
  },
  {
    title: "Return eligibility",
    body: [
      "[Confirm the required state of returned footwear, packaging, labels, accessories, and proof of purchase.]",
      "Items that show signs of wear, alteration, damage after delivery, or use beyond what is reasonably needed to assess fit may not be eligible. The final criteria require client and legal approval.",
    ],
  },
  {
    title: "How to request a return",
    body: [
      "Contact customer support with the order number, the item being returned, and the reason for the request. The team will review the request and provide the next steps if it is eligible.",
      "[Confirm the return address, customer verification process, and whether photographs are required.]",
    ],
  },
  {
    title: "Return delivery costs",
    body: [
      "[Confirm who pays the cost of returning an item, including the rule for incorrect or faulty items.]",
      "Customers should not send a return through an unapproved delivery method. Sneaker Vault GH cannot confirm responsibility for a parcel until the final return procedure is approved.",
    ],
  },
  {
    title: "Refunds and exchanges",
    body: [
      "[Confirm whether exchanges are offered, the refund review period, the original-payment-method rule, and how payment-provider processing times will be communicated.]",
      "Approval of a return does not automatically confirm a refund. Returned items may be inspected against the final eligibility rules first.",
    ],
  },
];

export default function ReturnsPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f4f3ef] text-neutral-950">
      <article className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <header className="border-b border-neutral-300 pb-10 sm:pb-14">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Customer care
          </p>
          <h1 className="text-5xl font-medium leading-none tracking-[-0.05em] sm:text-6xl">
            Returns policy
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
          This is a policy framework, not a final returns commitment. The
          client must approve every bracketed item and obtain appropriate legal
          review before publication.
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
          To discuss an order, use the confirmed details on the{" "}
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
