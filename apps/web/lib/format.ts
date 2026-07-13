const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Full NGN amount for tooltips and tables. */
export function formatNaira(amount: number, currency = "NGN"): string {
  if (currency !== "NGN") {
    return `${amount.toLocaleString()} ${currency}`;
  }
  return nairaFormatter.format(amount);
}

/** Compact axis label, e.g. ₦1.2M */
export function formatNairaCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₦${(amount / 1_000).toFixed(0)}K`;
  }
  return `₦${amount}`;
}
