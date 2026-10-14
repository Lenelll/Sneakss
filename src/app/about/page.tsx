import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Sneaker Vault GH is a Ghanaian sneaker destination built for people who care about what they wear and how they show up.",
};

const principles = [
  {
    number: "01",
    title: "Curated",
    description:
      "We'd rather offer a focused selection of pairs worth wearing than overwhelm you with endless options.",
  },
  {
    number: "02",
    title: "Authentic",
    description: "Clear products. Clear pricing. Clear availability.",
  },
  {
    number: "03",
    title: "Made for Ghana",
    description:
      "Ghana cedi pricing, EU sizing, local delivery and a shopping experience designed around customers here.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <header className="grid gap-10 border-b border-line pb-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end lg:pb-20">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              About Sneaker Vault GH
            </p>
            <h1 className="display-type max-w-4xl">
              Great pairs. Thoughtfully selected.
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Sneaker Vault GH is a Ghanaian sneaker destination built for people
            who care about what they wear and how they show up.
          </p>
        </header>

        <section
          aria-labelledby="brand-story-heading"
          className="grid gap-10 py-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:py-20"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Brand story
            </p>
            <h2
              id="brand-story-heading"
              className="mt-4 text-2xl font-medium tracking-[-0.03em]"
            >
              Sneakers are part of your identity.
            </h2>
          </div>
          <div className="max-w-3xl space-y-7 text-xl leading-8 tracking-[-0.02em] text-ink sm:text-2xl sm:leading-9">
            <p>We believe what you wear should feel like you.</p>
            <p>
              Sneaker Vault GH exists to make discovering and owning great
              sneakers easier, while giving you the freedom to own your style
              and be yourself.
            </p>
            <p className="text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Born in Ghana, we&rsquo;re building a sneaker destination around
              thoughtful curation, honest availability and an experience that
              puts the customer first.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="principles-heading"
          className="border-t border-line py-12 lg:py-20"
        >
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                What guides us
              </p>
              <h2
                id="principles-heading"
                className="section-title"
              >
                Our principles.
              </h2>
            </div>
          </div>

          <div className="grid border-t border-line md:grid-cols-3">
            {principles.map((principle) => (
              <article
                key={principle.number}
                className="border-b border-line py-8 md:border-r md:px-7 md:last:border-r-0"
              >
                <p className="mb-12 font-mono text-xs text-muted">
                  {principle.number}
                </p>
                <h3 className="mb-3 text-xl font-medium tracking-[-0.025em]">
                  {principle.title}
                </h3>
                <p className="text-sm leading-6 text-muted">
                  {principle.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="vision-heading"
          className="grid gap-10 border-t border-line py-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:py-20"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              The vision
            </p>
            <h2
              id="vision-heading"
              className="mt-4 text-2xl font-medium tracking-[-0.03em]"
            >
              We&rsquo;re just getting started.
            </h2>
          </div>
          <p className="max-w-3xl text-xl leading-8 tracking-[-0.02em] text-ink sm:text-2xl sm:leading-9">
            From campus to the city and eventually beyond Ghana, we&rsquo;re
            building a sneaker community where people can discover their next
            pair and wear it their way.
          </p>
        </section>

        <section className="mt-4 flex flex-col gap-8 bg-ink px-6 py-10 text-white sm:px-10 sm:py-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-soft">
              Find your next pair.
            </p>
            <h2 className="max-w-2xl section-title">
              Shop the collection.
            </h2>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/shop"
              className="inline-flex min-h-12 w-fit items-center justify-center border border-white px-6 text-sm font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Shop the collection &rarr;
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 w-fit items-center text-sm font-semibold uppercase tracking-[0.14em] text-white/80 underline decoration-1 underline-offset-8 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Contact us
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
