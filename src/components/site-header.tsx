"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { CartDrawer } from "./cart-drawer";
import { useStore } from "./store-provider";

const navItems = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?sort=newest", label: "New arrivals" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

function isActivePath(pathname: string, href: string) {
  const hrefPath = href.split("?")[0];
  return hrefPath === "/shop"
    ? pathname === "/shop" || pathname.startsWith("/products/")
    : pathname === hrefPath;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, openCart } = useStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchDialogRef = useRef<HTMLDialogElement>(null);
  const menuDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = searchDialogRef.current;

    if (!dialog) {
      return;
    }

    if (isSearchOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isSearchOpen && dialog.open) {
      dialog.close();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const dialog = menuDialogRef.current;

    if (!dialog) {
      return;
    }

    if (isMenuOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isMenuOpen && dialog.open) {
      dialog.close();
    }
  }, [isMenuOpen]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    setIsSearchOpen(false);
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#D8D8D0] bg-[#F5F2EA]/95 text-[#151713] backdrop-blur">
        <div className="bg-[#0E4E3E] px-4 py-2 text-center text-[0.62rem] font-semibold tracking-[0.2em] text-white uppercase">
          Demo storefront · EU sizing · Prices in Ghana cedis
        </div>
        <div className="mx-auto flex h-[4.75rem] max-w-[90rem] items-center justify-between gap-5 px-4 sm:px-6 lg:px-10">
          <button
            type="button"
            className="rounded-lg px-2 py-2 text-xs font-semibold tracking-[0.14em] uppercase lg:hidden"
            aria-label="Open navigation menu"
            onClick={() => setIsMenuOpen(true)}
          >
            Menu
          </button>

          <Link
            href="/"
            aria-label="Sneaker Vault GH home"
            className="group flex shrink-0 items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-xl bg-[#0E4E3E] text-[0.62rem] font-bold tracking-[0.08em] text-[#E0B33D]"
            >
              SV
            </span>
            <span className="hidden leading-none min-[390px]:block">
              <span className="block text-[0.92rem] font-extrabold tracking-[-0.035em]">
                SNEAKER VAULT
              </span>
              <span className="mt-1 block text-[0.56rem] font-semibold tracking-[0.32em] text-[#686B64]">
                GHANA
              </span>
            </span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-8 lg:flex"
          >
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`border-b py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-[#0E4E3E] text-[#0E4E3E]"
                      : "border-transparent text-[#151713] hover:text-[#0E4E3E]"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <button
              type="button"
              className="rounded-lg px-2 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition-colors hover:bg-white sm:px-3"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search the catalog"
            >
              Search
            </button>
            <Link
              href="/account"
              className="hidden rounded-lg px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition-colors hover:bg-white sm:block"
            >
              Account
            </Link>
            <button
              type="button"
              className="rounded-lg bg-[#151713] px-3 py-2 text-xs font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#0E4E3E]"
              aria-label={`Open bag with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
              onClick={openCart}
            >
              Bag <span aria-hidden="true">({itemCount})</span>
            </button>
          </div>
        </div>
      </header>

      <dialog
        ref={searchDialogRef}
        aria-labelledby="search-dialog-title"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-[#F5F2EA] p-0 text-[#151713] backdrop:bg-[#151713]/45"
        onCancel={(event) => {
          event.preventDefault();
          setIsSearchOpen(false);
        }}
        onClose={() => setIsSearchOpen(false)}
      >
        <div className="mx-auto flex min-h-full max-w-5xl flex-col px-5 py-6 sm:px-10 sm:py-10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#686B64] uppercase">
              Search the vault
            </p>
            <button
              type="button"
              className="rounded-full border border-[#D8D8D0] bg-white px-4 py-2 text-xs font-semibold tracking-[0.1em] uppercase hover:border-[#151713]"
              onClick={() => setIsSearchOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="my-auto py-16">
            <h2
              id="search-dialog-title"
              className="max-w-3xl text-4xl font-semibold tracking-[-0.055em] sm:text-6xl"
            >
              What pair are you looking for?
            </h2>
            <form
              onSubmit={submitSearch}
              className="mt-10 flex flex-col gap-3 border-b-2 border-[#151713] pb-3 sm:flex-row"
            >
              <input
                autoFocus
                type="search"
                name="q"
                placeholder="Try “runner”, “green” or a brand"
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent py-3 text-xl outline-none placeholder:text-[#8B8D86] sm:text-3xl"
              />
              <button
                type="submit"
                className="self-start rounded-xl bg-[#0E4E3E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0A3E31] sm:self-center"
              >
                See results
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Lifestyle", "Running", "Basketball", "Skate", "Trail"].map(
                (category) => (
                  <Link
                    key={category}
                    href={`/shop?q=${encodeURIComponent(category)}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="rounded-full border border-[#D8D8D0] bg-white px-4 py-2 text-sm transition-colors hover:border-[#0E4E3E] hover:text-[#0E4E3E]"
                  >
                    {category}
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </dialog>

      <dialog
        ref={menuDialogRef}
        aria-labelledby="menu-dialog-title"
        className="m-0 h-dvh max-h-none w-[min(88vw,25rem)] max-w-none bg-[#0E4E3E] p-0 text-white shadow-2xl backdrop:bg-[#151713]/55"
        onCancel={(event) => {
          event.preventDefault();
          setIsMenuOpen(false);
        }}
        onClose={() => setIsMenuOpen(false)}
      >
        <div className="flex min-h-full flex-col px-6 py-6">
          <div className="flex items-center justify-between">
            <p
              id="menu-dialog-title"
              className="text-xs font-semibold tracking-[0.2em] text-white/65 uppercase"
            >
              Navigation
            </p>
            <button
              type="button"
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold tracking-[0.1em] uppercase"
              onClick={() => setIsMenuOpen(false)}
            >
              Close
            </button>
          </div>
          <nav
            aria-label="Mobile navigation"
            className="mt-16 flex flex-col"
          >
            {[...navItems, { href: "/account", label: "Account" }].map(
              (item, index) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-baseline justify-between border-b border-white/20 py-5 text-3xl font-semibold tracking-[-0.045em]"
                >
                  <span>{item.label}</span>
                  <span className="text-xs font-medium tracking-[0.15em] text-[#E0B33D]">
                    0{index + 1}
                  </span>
                </Link>
              ),
            )}
          </nav>
          <p className="mt-auto max-w-xs pt-10 text-sm leading-6 text-white/65">
            Ghana&apos;s considered edit of everyday, court and performance
            sneakers.
          </p>
        </div>
      </dialog>

      <CartDrawer />
    </>
  );
}
