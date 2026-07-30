const ghsFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatGHS(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new TypeError("GHS amount must be a finite number.");
  }

  return ghsFormatter.format(amount);
}
