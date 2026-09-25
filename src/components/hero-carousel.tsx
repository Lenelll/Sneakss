"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type HeroSlide = {
  readonly src: string;
  readonly alt: string;
  readonly handle?: string;
  readonly title?: string;
  readonly brand?: string;
  readonly price?: string;
};

const ADVANCE_MS = 6000;

/**
 * Cross-fading hero backdrop.
 *
 * Slides come from the catalog, so the rotation is whatever the store has
 * tagged for the hero. Auto-advance stops while the visitor is hovering or
 * keyboard-focused inside the hero, and never starts for visitors who ask
 * for reduced motion.
 */
export function HeroCarousel({
  slides,
  children,
}: {
  slides: readonly HeroSlide[];
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  /*
    Set once the visitor takes control (taps a dot or arrow, or touches the
    hero at all). Rotation then stops for good: on a touch device there is no
    mouseleave to un-pause, and a slide that advances mid-tap would send the
    visitor to a pair they did not choose.
  */
  const [isStopped, setIsStopped] = useState(false);
  const [allowsMotion, setAllowsMotion] = useState(true);
  const regionRef = useRef<HTMLElement>(null);

  const count = slides.length;
  const safeIndex = count > 0 ? index % count : 0;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) {
        return;
      }
      setIsStopped(true);
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAllowsMotion(!query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (count < 2 || isPaused || isStopped || !allowsMotion) {
      return;
    }

    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % count),
      ADVANCE_MS,
    );
    return () => window.clearInterval(timer);
  }, [allowsMotion, count, isPaused, isStopped]);

  const active = slides[safeIndex];

  return (
    <section
      ref={regionRef}
      aria-roledescription="carousel"
      aria-label="Featured sneakers"
      className="hero-media flex min-h-[38rem] items-center justify-center lg:min-h-[44rem]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsStopped(true)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
    >
      {slides.map((slide, slideIndex) => (
        <Image
          key={`${slide.src}-${slideIndex}`}
          src={slide.src}
          alt={slideIndex === safeIndex ? slide.alt : ""}
          aria-hidden={slideIndex === safeIndex ? undefined : true}
          fill
          priority={slideIndex === 0}
          sizes="100vw"
          className={`-z-10 object-cover transition-opacity duration-1000 ease-out ${
            slideIndex === safeIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="hero-scrim absolute inset-0 -z-10" aria-hidden="true" />

      {children}

      {/*
        Caption names the pair currently on screen and links straight to it.
        It sits above the dots on phones and moves to the corner from sm up.
      */}
      {active?.handle && active.title ? (
        <Link
          href={`/products/${active.handle}`}
          className="absolute bottom-14 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-center text-white transition-opacity hover:opacity-80 sm:bottom-8 sm:left-8 sm:translate-x-0 sm:items-start sm:text-left lg:bottom-10 lg:left-12"
        >
          {active.brand ? (
            <span className="text-[0.6rem] font-semibold tracking-[0.2em] text-white/65 uppercase">
              {active.brand}
            </span>
          ) : null}
          <span className="text-sm font-medium tracking-[-0.01em] underline decoration-1 underline-offset-8">
            {active.title}
          </span>
          {active.price ? (
            <span className="text-xs text-white/70">{active.price}</span>
          ) : null}
        </Link>
      ) : null}

      {count > 1 ? (
        <>
          {/* Dots double as the slide picker. */}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2.5 lg:bottom-8">
            {slides.map((slide, slideIndex) => (
              <button
                key={`dot-${slide.src}-${slideIndex}`}
                type="button"
                aria-label={`Show slide ${slideIndex + 1} of ${count}`}
                aria-current={slideIndex === safeIndex ? "true" : undefined}
                onClick={() => goTo(slideIndex)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slideIndex === safeIndex
                    ? "w-8 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(safeIndex - 1)}
            className="absolute top-1/2 left-2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-2xl text-white/70 transition-colors hover:text-white sm:flex lg:left-5"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(safeIndex + 1)}
            className="absolute top-1/2 right-2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-2xl text-white/70 transition-colors hover:text-white sm:flex lg:right-5"
          >
            <span aria-hidden="true">›</span>
          </button>

          <p aria-live="polite" className="sr-only">
            Slide {safeIndex + 1} of {count}
            {active?.title ? `: ${active.title}` : ""}
          </p>
        </>
      ) : null}
    </section>
  );
}
