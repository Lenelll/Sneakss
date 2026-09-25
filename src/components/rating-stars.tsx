/**
 * Presentational star rating. Server-safe (no client hooks).
 * `value` may be fractional; stars fill proportionally.
 */
export function RatingStars({
  value,
  size = "md",
  className = "",
  label,
  tone = "dark",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  /** `light` renders white stars for use over photography or dark panels. */
  tone?: "dark" | "light";
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const dimension = size === "sm" ? 12 : size === "lg" ? 22 : 16;
  const gap = size === "sm" ? "gap-0.5" : "gap-1";
  const emptyClass = tone === "light" ? "text-white/35" : "text-line-strong";
  const fillClass = tone === "light" ? "text-white" : "text-ink";

  return (
    <span
      role="img"
      aria-label={label ?? `${clamped.toFixed(1)} out of 5 stars`}
      className={`inline-flex items-center ${gap} ${className}`}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, clamped - index));

        return (
          <span
            key={index}
            aria-hidden="true"
            className="relative inline-block shrink-0"
            style={{ width: dimension, height: dimension }}
          >
            <StarIcon className={`absolute inset-0 ${emptyClass}`} />
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <StarIcon
                className={fillClass}
                style={{ width: dimension, height: dimension }}
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function StarIcon({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`block h-full w-full ${className}`}
      style={style}
      aria-hidden="true"
    >
      <path d="M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.3l-6 3.3 1.3-6.6L2.4 9.4l6.7-.8L12 2.5z" />
    </svg>
  );
}
