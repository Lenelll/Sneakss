"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuDialogRef = useRef<HTMLDialogElement>(null);
  const [searchValue, setSearchValue] = useState("");

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
    setSearchValue("");
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#D8D8D0] bg-[#F5F2EA]/95 text-[#151713] backdrop-blur">
        <div className="bg-[#0E4E3E] px-4 py-2 text-center text-[0.62rem] font-semibold tracking-[0.2em] text-white uppercase">
          EU sizing · Prices in Ghana cedis
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
            <form
              aria-label="Search the catalog"
              className="relative flex flex-1 items-center sm:min-w-[18rem]"
              onSubmit={submitSearch}
            >
              <label htmlFor="desktop-search" className="sr-only">
                Search the catalog
              </label>
              <input
                id="desktop-search"
                autoComplete="off"
                className="h-9 w-full rounded-lg border border-[#D8D8D0] bg-white px-3 pr-14 text-sm outline-none placeholder:text-[#8B8D86] focus:border-[#0E4E3E] focus:ring-2 focus:ring-[#0E4E3E]/20"
                name="q"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search sneakers..."
                type="search"
                value={searchValue}
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-7 rounded-md bg-[#0E4E3E] px-3 text-xs font-semibold text-white transition hover:bg-[#123F35]"
              >
                Search
              </button>
            </form>
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

      <div className="bg-[#0E4E3E] px-4 py-2 sm:hidden">
        <form
          aria-label="Search the catalog"
          className="mx-auto flex max-w-3xl items-center gap-2"
          onSubmit={submitSearch}
        >
          <label htmlFor="mobile-search" className="sr-only">
            Search the catalog
          </label>
          <input
            id="mobile-search"
            autoComplete="off"
            className="h-10 w-full rounded-lg border border-[#D8D8D0] bg-white px-3 text-sm outline-none placeholder:text-[#8B8D86] focus:border-[#0E4E3E] focus:ring-2 focus:ring-[#0E4E3E]/20"
            name="q"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search sneakers..."
            type="search"
            value={searchValue}
          />
          <button
            type="submit"
            className="rounded-lg bg-[#151713] px-3 py-2 text-xs font-semibold uppercase text-white"
          >
            Search
          </button>
        </form>
      </div>

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
