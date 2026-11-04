/**
 * OWNER: learn. Pure "which day am I on?" logic — no DB, no Date.now() inside (pass `nowSec`), fully unit-tested.
 *
 * Rules (documented for the founder + other agents):
 *  1. Days are completed in order. Day N opens once days 1..N-1 are done ("unlocked = completed + 1").
 *  2. One new day per calendar day: you can't run ahead of the calendar. The calendar day is
 *     (today − start date) + 1 in the student's timezone.
 *  3. Catching up is allowed: if you're behind the calendar (missed days), you may complete several days today,
 *     up to the calendar day.
 *  4. If you haven't completed anything today you may always open the next day (so a timezone change or a late-night
 *     start never leaves you with nothing to do).
 *  5. Rest days are normal days for this logic (short, still required, still count for the streak).
 */
export const TOTAL_DAYS = 66;

export type DayStatus = "open" | "waiting" | "finished";

export interface ScheduleInput {
  /** Days the student completed, with the local calendar date (YYYY-MM-DD) of completion. */
  completed: { day: number; localDate: string }[];
  /** Local calendar date the student started (YYYY-MM-DD). */
  startDate: string;
  /** Local calendar date today (YYYY-MM-DD). */
  today: string;
  totalDays?: number;
}

export interface Schedule {
  /** First not-yet-completed day, or null when all are done. */
  nextDay: number | null;
  status: DayStatus;
  /** Day number by the calendar (1..total), how far you'd be if you did one day every day. */
  calendarDay: number;
  /** How many days you're behind the calendar (0 when on schedule). */
  behind: number;
  completedCount: number;
  completedToday: number;
  percent: number;
}

/** "YYYY-MM-DD" for a unix-seconds timestamp in an IANA timezone (falls back to UTC on bad tz). */
export function localDate(nowSec: number, timeZone = "UTC"): string {
  const d = new Date(nowSec * 1000);
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Whole days from a to b (both YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function computeSchedule(input: ScheduleInput): Schedule {
  const total = input.totalDays ?? TOTAL_DAYS;
  const done = new Set(input.completed.map((c) => c.day).filter((d) => d >= 1 && d <= total));
  let nextDay: number | null = null;
  for (let d = 1; d <= total; d++) {
    if (!done.has(d)) { nextDay = d; break; }
  }
  const calendarDay = Math.min(total, Math.max(1, daysBetween(input.startDate, input.today) + 1));
  const completedToday = input.completed.filter((c) => c.localDate === input.today).length;
  let status: DayStatus;
  if (nextDay === null) status = "finished";
  else if (nextDay <= calendarDay || completedToday === 0) status = "open";
  else status = "waiting";
  const behind = nextDay === null ? 0 : Math.max(0, calendarDay - nextDay);
  return {
    nextDay,
    status,
    calendarDay,
    behind,
    completedCount: done.size,
    completedToday,
    percent: Math.round((done.size / total) * 100),
  };
}

export type DayAccess = "done" | "open" | "waiting" | "locked";

/** What a student may do with a given day. */
export function dayAccess(day: number, completedDays: Set<number>, s: Schedule): DayAccess {
  if (completedDays.has(day)) return "done";
  if (s.nextDay === day) return s.status === "open" ? "open" : "waiting";
  return "locked";
}
