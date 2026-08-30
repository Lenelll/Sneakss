const LOGO_URL = "/brand/logo.svg";

/**
 * Official SVGH wordmark. The SVG is applied as a CSS mask so the mark
 * renders in the surrounding text color (dark on light surfaces, white on
 * the footer green). Size it with a height class; width follows the
 * mark's intrinsic aspect ratio.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block aspect-[586/248] ${className ?? ""}`}
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${LOGO_URL})`,
        maskImage: `url(${LOGO_URL})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
