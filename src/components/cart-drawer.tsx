"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { formatGHS } from "@/lib";

import { useStore } from "./store-provider";

export function CartDrawer() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    lines,
    itemCount,
    subtotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
  } = useStore();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isCartOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!isCartOpen && dialog.open) {
      dialog.close();
    }
  }, [isCartOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cart-drawer-title"
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-[30rem] bg-white p-0 text-[#151713] shadow-2xl backdrop:bg-[#151713]/55"
      onCancel={(event) => {
        event.preventDefault();
        closeCart();
      }}
      onClose={closeCart}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeCart();
        }
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#D8D8D0] px-5 py-5 sm:px-7">
          <div>
            <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-[#686B64] uppercase">
              Your selection
            </p>
            <h2
              id="cart-drawer-title"
              className="mt-1 text-2xl font-semibold tracking-[-0.04em]"
            >
              Bag {itemCount > 0 ? `(${itemCount})` : ""}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#D8D8D0] px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase transition-colors hover:border-[#151713] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E4E3E]"
            onClick={closeCart}
          >
            Close
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="max-w-xs text-3xl font-semibold tracking-[-0.045em]">
              Your next pair is still out there.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#686B64]">
              Explore the demo catalog and choose an available EU size to start
              your bag.
            </p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="mt-7 rounded-xl bg-[#0E4E3E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A3E31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E4E3E]"
            >
              Shop sneakers
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">
              {lines.map((line) => (
                <li
                  key={line.lineId}
                  className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-[#D8D8D0] pb-5"
                >
                  <Link
                    href={`/products/${line.product.handle}`}
                    onClick={closeCart}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-[#F5F2EA]"
                  >
                    <Image
                      src={line.product.images[0].src}
                      alt={line.product.images[0].alt}
                      fill
                      sizes="104px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-[#686B64] uppercase">
                          {line.product.brand}
                        </p>
                        <Link
                          href={`/products/${line.product.handle}`}
                          onClick={closeCart}
                          className="mt-1 block font-semibold tracking-[-0.02em] hover:underline"
                        >
                          {line.product.title}
                        </Link>
                        <p className="mt-1 text-xs text-[#686B64]">
                          {line.variant.sizeLabel}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">
                        {formatGHS(line.lineTotal)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div
                        className="inline-flex items-center rounded-lg border border-[#D8D8D0]"
                        aria-label={`Quantity for ${line.product.title}, ${line.variant.sizeLabel}`}
                      >
                        <button
                          type="button"
                          aria-label={`Decrease ${line.product.title} quantity`}
                          className="h-9 w-9 text-lg transition-colors hover:bg-[#F5F2EA] disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={line.quantity <= 1}
                          onClick={() =>
                            updateQuantity(line.variantId, line.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span
                          className="min-w-7 text-center text-sm"
                          aria-live="polite"
                        >
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${line.product.title} quantity`}
                          className="h-9 w-9 text-lg transition-colors hover:bg-[#F5F2EA] disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={
                            line.quantity >=
                            Math.min(line.variant.inventoryQuantity, 10)
                          }
                          onClick={() =>
                            updateQuantity(line.variantId, line.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#686B64] underline decoration-[#D8D8D0] underline-offset-4 hover:text-[#151713]"
                        onClick={() => removeItem(line.variantId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-[#D8D8D0] bg-[#F5F2EA] px-5 py-5 sm:px-7">
              <div className="flex items-end justify-between">
                <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-[#686B64] uppercase">
                  Subtotal
                </p>
                <p className="text-xl font-semibold tracking-[-0.03em]">
                  {formatGHS(subtotal)}
                </p>
              </div>
              <Link
                href="/cart"
                onClick={closeCart}
                className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#0E4E3E] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A3E31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E4E3E]"
              >
                Review bag
              </Link>
              <p className="mt-3 text-center text-[0.68rem] leading-5 text-[#686B64]">
                Demo bag only. Payment remains disabled until Shopify and
                Paystack are connected.
              </p>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
