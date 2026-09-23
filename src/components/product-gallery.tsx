"use client";

import Image from "next/image";
import { useState } from "react";

import type { ProductImage } from "@/lib";

export function ProductGallery({
  images,
  badge,
}: {
  images: readonly ProductImage[];
  badge?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[Math.min(activeIndex, images.length - 1)];

  function step(direction: 1 | -1) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  return (
    <div className="lg:sticky lg:top-28 lg:self-start">
      <div className="relative aspect-[4/4.1] overflow-hidden rounded-none border border-line bg-surface-2 sm:rounded-none">
        <Image
          key={active.id}
          src={active.src}
          alt={active.alt}
          fill
          priority
          sizes="(min-width: 1024px) 56vw, 100vw"
          className="object-cover"
        />
        {badge ? (
          <span className="absolute top-4 left-4 bg-ink px-3 py-1.5 text-[0.6rem] font-semibold tracking-[0.18em] text-white uppercase sm:top-6 sm:left-6">
            {badge}
          </span>
        ) : null}
        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => step(-1)}
              className="absolute top-1/2 left-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ‹
              </span>
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => step(1)}
              className="absolute top-1/2 right-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ›
              </span>
            </button>
            <p className="absolute right-4 bottom-4 rounded-full bg-ink/80 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.1em] text-white backdrop-blur">
              {activeIndex + 1} / {images.length}
            </p>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div
          role="tablist"
          aria-label="Product images"
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
        >
          {images.map((image, index) => {
            const selected = index === activeIndex;

            return (
              <button
                key={image.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`Show image ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`relative aspect-square w-[4.5rem] shrink-0 overflow-hidden rounded-none border-2 bg-surface-2 transition ${
                  selected
                    ? "border-brand"
                    : "border-transparent opacity-75 hover:opacity-100"
                }`}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
