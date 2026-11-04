// OWNER: game agent. Calendar helpers. All "days" are YYYY-MM-DD strings in a given IANA timezone.

const fmtCache = new Map<string, Intl.DateTimeFormat>();

/** Returns a valid IANA timezone, falling back to UTC for anything Intl doesn't accept. */
export function safeTz(tz: string | null | undefined): string {
  if (!tz) return "UTC";
  if (fmtCache.has(tz)) return tz;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

function fmt(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
    });
    fmtCache.set(tz, f);
  }
  return f;
}

/** Local calendar date + hour of `at` in timezone `tz`. */
export function localParts(at: Date, tz: string): { day: string; hour: number } {
  const parts = fmt(safeTz(tz)).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { day: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) % 24 };
}

export const localDay = (at: Date, tz: string) => localParts(at, tz).day;

/** Day number since epoch for a YYYY-MM-DD string (timezone-free calendar arithmetic). */
export function dayNumber(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export const daysBetween = (from: string, to: string) => dayNumber(to) - dayNumber(from);

export function addDays(day: string, n: number): string {
  return new Date((dayNumber(day) + n) * 86_400_000).toISOString().slice(0, 10);
}

/** ISO-8601 week key of a UTC instant, e.g. "2026-W45". Weeks start Monday 00:00 UTC (one global board). */
export function isoWeek(at: Date): string {
  const d = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow); // Thursday of this week decides the year
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Monday 00:00 UTC of the ISO week containing `at` → next Monday (when the weekly board resets). */
export function weekResetsAt(at: Date): Date {
  const d = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + (8 - dow));
  return d;
}
