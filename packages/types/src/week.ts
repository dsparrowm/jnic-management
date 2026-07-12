export const REPORT_TIMEZONE = "Africa/Lagos";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Parse YYYY-MM-DD into UTC midnight for stable DB storage. */
export function parseReportDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

/** Format a stored report date as YYYY-MM-DD. */
export function formatReportDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getWeekdayIndexInLagos(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const reference = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIMEZONE,
    weekday: "short",
  }).format(reference);

  return WEEKDAY_INDEX[weekday] ?? 0;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return next.toISOString().slice(0, 10);
}

/** Service weeks end on Sunday (Mon–Sun). Returns the Sunday YYYY-MM-DD. */
export function computeWeekOf(serviceDate: string): string {
  const weekday = getWeekdayIndexInLagos(serviceDate);
  const daysUntilSunday = weekday === 0 ? 0 : 7 - weekday;
  return addDays(serviceDate, daysUntilSunday);
}

/** Default service date for the submit form: today in Lagos as YYYY-MM-DD. */
export function getTodayInLagos(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatWeekEndingLabel(weekOf: string): string {
  const date = parseReportDate(weekOf);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: REPORT_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export type BranchSubmissionState = "SUBMITTED" | "MISSED" | "PENDING";

/** Monday 23:59:59 Africa/Lagos (UTC+1) after the Sunday `weekOf`. */
export function getSubmissionDeadlineUtc(weekOf: string): Date {
  const monday = addDays(weekOf, 1);
  const [year, month, day] = monday.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 22, 59, 59));
}

export function isSubmissionDeadlinePassed(
  weekOf: string,
  now: Date = new Date(),
): boolean {
  return now > getSubmissionDeadlineUtc(weekOf);
}

export function getBranchSubmissionState(
  weekOf: string,
  hasReport: boolean,
  now: Date = new Date(),
): BranchSubmissionState {
  if (hasReport) {
    return "SUBMITTED";
  }
  if (isSubmissionDeadlinePassed(weekOf, now)) {
    return "MISSED";
  }
  return "PENDING";
}
