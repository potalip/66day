// OWNER: game agent. Small formatting helpers shared by game UI.
import type { Lang } from "@web/i18n";

export const fmtNum = (n: number, lang: Lang) => new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-US").format(n);

export const fmtDate = (unixSec: number, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
  new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", opts).format(new Date(unixSec * 1000));

export const fmtDay = (ymd: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${ymd}T00:00:00Z`));

/** "in 3 days" / "через 3 дня" */
export function fmtRelative(unixSec: number, lang: Lang, now = Date.now()) {
  const rtf = new Intl.RelativeTimeFormat(lang === "ru" ? "ru-RU" : "en-US", { numeric: "auto" });
  const diff = unixSec * 1000 - now;
  const h = Math.round(diff / 3_600_000);
  if (Math.abs(h) < 24) return rtf.format(h, "hour");
  return rtf.format(Math.round(diff / 86_400_000), "day");
}

/** Stable short handle for students without a display name. */
export function handleOf(userId: string) {
  let h = 0;
  for (const ch of userId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return String(1000 + (h % 9000));
}

export function initials(name: string) {
  const parts = name.replace(/[#\d]+/g, "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "·";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Current hour in the browser's timezone. */
export const localHour = () => new Date().getHours();
