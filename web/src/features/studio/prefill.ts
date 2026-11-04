/**
 * Prefill the "Day N recap" template from the student's real progress, via the learn (/api/progress) and game
 * (/api/game/me) APIs. Those areas ship separately, so everything here is defensive: any missing endpoint or field
 * just means "no prefill" and the template example stays.
 */
import type { Lang, Storyboard } from "./api";

export interface RecapData { day: number; title: string; done: string[]; xp: number; streak: number; next?: string }

async function get(path: string): Promise<any> {
  try {
    const r = await fetch(`/api${path}`, { credentials: "include" });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

export async function loadRecapData(lang: Lang): Promise<RecapData | null> {
  const ov = await get(`/progress?lang=${lang}`);
  const cells: any[] = Array.isArray(ov?.cells) ? ov.cells : [];
  const doneCells = cells.filter((c) => c && (c.completedAt || c.tasksDone > 0));
  if (!doneCells.length) return null;
  const last = doneCells.reduce((a, b) => ((b.completedAt ?? 0) >= (a.completedAt ?? 0) ? b : a));
  const day = Number(last.day) || 1;
  const dv = await get(`/progress/day/${day}?lang=${lang}`);
  const states: Record<string, { done?: boolean }> = dv?.tasks ?? {};
  const tasks: any[] = dv?.day?.tasks ?? [];
  const done = tasks.filter((t) => states[t.id]?.done).map((t) => String(t.title)).filter(Boolean).slice(0, 4);
  const game = await get("/game/me");
  const streakRaw = game?.streak;
  const streak = typeof streakRaw === "number" ? streakRaw : Number(streakRaw?.streak ?? streakRaw?.current ?? 0) || 0;
  const xp = Number(last.xp) || tasks.filter((t) => states[t.id]?.done).reduce((a, t) => a + (Number(t.xp) || 0), 0);
  const next = dv?.next?.title ?? cells.find((c) => c.day === day + 1)?.title;
  return { day, title: String(last.title ?? dv?.day?.title ?? "").slice(0, 60), done, xp, streak, next: next ? String(next).slice(0, 60) : undefined };
}

/** Apply recap data to a day-recap storyboard (pure; tested). */
export function applyRecap(sb: Storyboard, d: RecapData): Storyboard {
  const ru = sb.lang === "ru";
  const out: Storyboard = structuredClone(sb);
  out.fields = { ...out.fields, day: d.day };
  out.title = ru ? `Итог дня ${d.day}` : `Day ${d.day} recap`;
  out.scenes = out.scenes.map((s) => {
    if (s.kind === "recap") {
      return {
        ...s,
        fields: { ...s.fields, day: d.day, title: d.title || s.fields.title, done: d.done.length ? d.done : s.fields.done, xp: d.xp, streak: d.streak },
        voiceover: ru ? `День ${d.day} готов: ${d.title}.` : `Day ${d.day} done: ${d.title}.`,
      };
    }
    if (s.kind === "next" && d.next) {
      return { ...s, fields: { ...s.fields, title: d.next, text: "" }, voiceover: ru ? `Завтра: ${d.next}.` : `Tomorrow: ${d.next}.` };
    }
    if (s.kind === "outro") {
      const left = Math.max(0, 66 - d.day);
      return { ...s, fields: { ...s.fields, title: ru ? `Ещё ${left} ${left % 10 === 1 && left % 100 !== 11 ? "день" : left % 10 >= 2 && left % 10 <= 4 && (left % 100 < 12 || left % 100 > 14) ? "дня" : "дней"}.` : `${left} days to go.` } };
    }
    return s;
  });
  return out;
}
