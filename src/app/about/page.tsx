import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Sneaker Vault GH and our approach to bringing a considered sneaker selection to customers in Ghana.",
};

const principles = [
  {
    number: "01",
    title: "A focused selection",
    description:
      "A considered catalogue makes it easier to discover pairs worth wearing, without the noise of an endless marketplace.",
  },
  {
    number: "02",
    title: "Clear availability",
    description:
      "Each size is tracked individually, so the options shown on a product page reflect the stock available to order.",
  },
  {
    number: "03",
    title: "Made for Ghana",
    description:
      "Prices are shown in Ghana cedis and the shopping experience is designed around customers purchasing locally.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f4f3ef] text-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <header className="grid gap-10 border-b border-neutral-300 pb-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end lg:pb-20">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
              About Sneaker Vault GH
            </p>
            <h1 className="max-w-4xl text-5xl font-medium leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-8xl">
              Great pairs, thoughtfully selected.
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
            Sneaker Vault GH is being built as a straightforward place to
            discover and purchase sneakers online in Ghana.
          </p>
        </header>

        <aside
          aria-label="Draft content notice"
          className="my-10 border-l-4 border-amber-400 bg-white px-5 py-4 text-sm leading-6 text-neutral-700 sm:px-6"
        >
          <span className="font-semibold text-neutral-950">Draft content.</span>{" "}
          This brand story is placeholder copy and must be reviewed by the
          Sneaker Vault GH team before launch.
        </aside>

        <section className="grid gap-10 py-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Our approach
          </p>
          <div className="max-w-3xl space-y-7 text-xl leading-8 tracking-[-0.02em] text-neutral-800 sm:text-2xl sm:leading-9">
            <p>
              We believe buying sneakers should feel clear and considered.
              That means useful product information, visible size availability,
              transparent pricing, and a checkout experience that gets out of
              the way.
            </p>
            <p>
              The collection will be managed by a local team, with every
              product and size updated as inventory changes.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="principles-heading"
          className="border-t border-neutral-300 py-12 lg:py-20"
        >
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
                What guides us
              </p>
              <h2
                id="principles-heading"
                className="text-3xl font-medium tracking-[-0.04em] sm:text-4xl"
              >
                Built around the essentials.
              </h2>
            </div>
          </div>

          <div className="grid border-t border-neutral-300 md:grid-cols-3">
            {principles.map((principle) => (
              <article
                key={principle.number}
                className="border-b border-neutral-300 py-8 md:border-r md:px-7 md:last:border-r-0"
              >
                <p className="mb-12 font-mono text-xs text-neutral-500">
                  {principle.number}
                </p>
                <h3 className="mb-3 text-xl font-medium tracking-[-0.025em]">
                  {principle.title}
                </h3>
                <p className="text-sm leading-6 text-neutral-600">
                  {principle.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-4 flex flex-col gap-8 bg-neutral-950 px-6 py-10 text-white sm:px-10 sm:py-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Need to know more?
            </p>
            <h2 className="max-w-2xl text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
              Talk to the Sneaker Vault GH team.
            </h2>
          </div>
          <Link
            href="/contact"
            className="inline-flex min-h-12 w-fit items-center justify-center border border-white px-6 text-sm font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Contact us
          </Link>
        </section>
      </div>
    </main>
  );
}
