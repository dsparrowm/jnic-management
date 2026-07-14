const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatSummaryPeriod(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function toMonthInputValue(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthInputValue(value: string): { month: number; year: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { month, year };
}

export function attendanceTotal(totals: {
  adult: number;
  teenage: number;
  children: number;
}): number {
  return totals.adult + totals.teenage + totals.children;
}
