import Link from "next/link";

const shopLinks = [
  { href: "/shop", label: "All sneakers" },
  { href: "/shop?sort=newest", label: "New arrivals" },
  { href: "/shop?q=Lifestyle", label: "Lifestyle" },
  { href: "/shop?q=Running", label: "Running" },
] as const;

const companyLinks = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/account", label: "Customer account" },
] as const;

const policyLinks = [
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/returns", label: "Returns" },
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/policies/terms", label: "Terms" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-[#0E4E3E] text-white">
      <div className="mx-auto max-w-[90rem] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-14 border-b border-white/20 pb-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-block" aria-label="Sneaker Vault GH">
              <span className="block text-2xl font-extrabold tracking-[-0.045em]">
                SNEAKER VAULT
              </span>
              <span className="mt-2 block text-[0.65rem] font-semibold tracking-[0.38em] text-[#E0B33D]">
                GHANA
              </span>
            </Link>
            <p className="mt-7 max-w-sm text-base leading-7 text-white/68">
              A considered sneaker destination for Ghana, built around useful
              sizing, honest availability and a smooth online experience.
            </p>
            <p className="mt-5 inline-flex rounded-full border border-[#E0B33D]/60 px-4 py-2 text-[0.65rem] font-semibold tracking-[0.16em] text-[#F4D274] uppercase">
              Preview catalog · Not yet accepting orders
            </p>
          </div>

          <FooterColumn heading="Shop" links={shopLinks} />
          <FooterColumn heading="Company" links={companyLinks} />
          <FooterColumn heading="Information" links={policyLinks} />
        </div>

        <div className="flex flex-col gap-4 pt-7 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Sneaker Vault GH. All rights reserved.
          </p>
          <p>Prices displayed in Ghana cedis · Primary sizing convention: EU</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-[0.65rem] font-semibold tracking-[0.2em] text-[#E0B33D] uppercase">
        {heading}
      </h2>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="text-sm text-white/76 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
