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

export { MONTH_NAMES };

export function formatSummaryPeriod(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Prisma cuid() ids used for org entities in this project. */
export function isValidScopeId(value: string): boolean {
  return /^[a-z0-9]{10,40}$/i.test(value);
}

export function attendanceTotal(totals: {
  adult: number;
  teenage: number;
  children: number;
}): number {
  return totals.adult + totals.teenage + totals.children;
}
