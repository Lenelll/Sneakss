"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { BrandLogo } from "./brand-logo";
import { CartDrawer } from "./cart-drawer";
import { useStore } from "./store-provider";

const navItems = [
  { href: "/shop", label: "Shop" },
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
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 text-ink backdrop-blur">
        <div className="bg-ink px-4 py-2 text-center text-[0.6rem] font-medium tracking-[0.22em] text-white uppercase">
          EU sizing · Prices in Ghana cedis
        </div>

        {/*
          Three-column bar: navigation left, wordmark centred, utilities
          right — the quiet supply-house arrangement.
        */}
        <div className="mx-auto grid h-[4.5rem] max-w-[90rem] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-start">
            <button
              type="button"
              className="px-1 py-2 text-[0.68rem] font-semibold tracking-[0.16em] uppercase transition-colors hover:text-brand lg:hidden"
              aria-label="Open navigation menu"
              onClick={() => setIsMenuOpen(true)}
            >
              Menu
            </button>

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
                    className={`border-b py-1 text-sm transition-colors ${
                      active
                        ? "border-ink text-ink"
                        : "border-transparent text-muted hover:text-ink"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Link
            href="/"
            aria-label="Sneaker Vault GH home"
            className="group flex shrink-0 items-center justify-center"
          >
            <BrandLogo className="h-8 transition-colors group-hover:text-brand" />
          </Link>

          <div className="flex items-center justify-end gap-3 sm:gap-4">
            <form
              aria-label="Search the catalog"
              className="relative hidden items-center border-b border-line-strong transition-colors focus-within:border-ink sm:flex sm:w-[13rem] lg:w-[16rem]"
              onSubmit={submitSearch}
            >
              <label htmlFor="desktop-search" className="sr-only">
                Search the catalog
              </label>
              <input
                id="desktop-search"
                autoComplete="off"
                className="h-9 w-full bg-transparent pr-14 text-sm outline-none placeholder:text-muted-soft"
                name="q"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search"
                type="search"
                value={searchValue}
              />
              <button
                type="submit"
                className="absolute right-0 text-[0.62rem] font-semibold tracking-[0.14em] text-muted uppercase transition-colors hover:text-brand"
              >
                Search
              </button>
            </form>

            <Link
              href="/account"
              className="hidden text-[0.68rem] font-semibold tracking-[0.14em] uppercase transition-colors hover:text-brand sm:block"
            >
              Account
            </Link>
            <button
              type="button"
              className="bg-ink px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-brand"
              aria-label={`Open bag with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
              onClick={openCart}
            >
              Bag <span aria-hidden="true">({itemCount})</span>
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-line bg-canvas px-4 py-2 sm:hidden">
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
            className="h-10 w-full border border-line-strong bg-white px-3 text-sm outline-none placeholder:text-muted-soft focus:border-ink"
            name="q"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search sneakers..."
            type="search"
            value={searchValue}
          />
          <button
            type="submit"
            className="bg-ink px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.14em] text-white uppercase"
          >
            Search
          </button>
        </form>
      </div>

      <dialog
        ref={menuDialogRef}
        aria-labelledby="menu-dialog-title"
        className="m-0 h-dvh max-h-none w-[min(88vw,25rem)] max-w-none bg-ink p-0 text-white shadow-2xl backdrop:bg-black/55"
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
              className="text-[0.62rem] font-semibold tracking-[0.22em] text-white/55 uppercase"
            >
              Navigation
            </p>
            <button
              type="button"
              className="border border-white/30 px-4 py-2 text-[0.62rem] font-semibold tracking-[0.14em] uppercase transition-colors hover:bg-white hover:text-ink"
              onClick={() => setIsMenuOpen(false)}
            >
              Close
            </button>
          </div>
          <nav aria-label="Mobile navigation" className="mt-14 flex flex-col">
            {[...navItems, { href: "/account", label: "Account" }].map(
              (item, index) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-baseline justify-between border-b border-white/20 py-5 text-3xl font-light tracking-[-0.03em] transition-colors hover:text-white/70"
                >
                  <span>{item.label}</span>
                  <span className="text-[0.62rem] font-semibold tracking-[0.18em] text-white/45">
                    0{index + 1}
                  </span>
                </Link>
              ),
            )}
          </nav>
          <p className="mt-auto max-w-xs pt-10 text-sm leading-6 text-white/60">
            Ghana&apos;s considered edit of everyday, court and performance
            sneakers.
          </p>
        </div>
      </dialog>

      <CartDrawer />
    </>
  );
}
