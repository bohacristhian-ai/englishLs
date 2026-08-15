import type { IsoDate } from './types';

/**
 * All date arithmetic in the app goes through this module.
 *
 * Two rules it exists to enforce:
 * 1. Days are *local* calendar days formatted as `YYYY-MM-DD`. Raw UTC
 *    timestamps would shift due dates depending on the time of day.
 * 2. The learning day starts at 04:00, not midnight, so a late-evening session
 *    does not split into two learning days and tear the streak apart.
 */

export const DEFAULT_DAY_START_HOUR = 4;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;

  // Rejects 2026-02-31 and friends: the round trip only survives real dates.
  return toIsoDate(parseAtNoon(value)) === value;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Formats a Date as a local calendar day. */
export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Anchored at noon on purpose. Adding days to a midnight-anchored date can land
 * on 23:00 the previous day across a DST boundary; from noon it never does.
 */
function parseAtNoon(day: IsoDate): Date {
  const parts = day.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const dayOfMonth = Number(parts[2]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(dayOfMonth)) {
    throw new RangeError(`Not an ISO date: ${day}`);
  }

  return new Date(year, month - 1, dayOfMonth, 12, 0, 0, 0);
}

/**
 * The learning day a moment belongs to. Before the day-start hour, the moment
 * still counts towards the previous day.
 */
export function learningDay(now: Date, dayStartHour: number = DEFAULT_DAY_START_HOUR): IsoDate {
  const shifted = new Date(now.getTime());

  if (shifted.getHours() < dayStartHour) {
    shifted.setDate(shifted.getDate() - 1);
  }

  return toIsoDate(shifted);
}

export function addDays(day: IsoDate, days: number): IsoDate {
  const date = parseAtNoon(day);
  date.setDate(date.getDate() + days);

  return toIsoDate(date);
}

/** Whole days from `from` to `to`. Negative when `to` lies before `from`. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const span = parseAtNoon(to).getTime() - parseAtNoon(from).getTime();

  return Math.round(span / MS_PER_DAY);
}

/** Sort comparator for ISO days — lexicographic order is chronological here. */
export function compareIsoDate(a: IsoDate, b: IsoDate): number {
  if (a < b) return -1;
  if (a > b) return 1;

  return 0;
}

/** A card is due once its due day has arrived or passed. */
export function isDue(dueOn: IsoDate, today: IsoDate): boolean {
  return dueOn <= today;
}
