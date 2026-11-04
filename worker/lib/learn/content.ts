/**
 * OWNER: learn. Read-only access to the compiled curriculum (shared/curriculum.generated.json,
 * produced by scripts/build-content.mjs on predev/prebuild).
 */
import raw from "../../../shared/curriculum.generated.json";
import type { CurriculumDay, Lang, Track } from "../../../shared/types";
import type { DaySummary, GeneratedContent, ProgramResponse } from "./api-types";

export const content = raw as unknown as GeneratedContent;
export const TOTAL = content.totalDays || 66;

const index = new Map<string, CurriculumDay>();
for (const d of content.days) index.set(`${d.lang}/${d.track}/${d.day}`, d);

export const isLang = (v: unknown): v is Lang => v === "ru" || v === "en";
export const isTrack = (v: unknown): v is Track => v === "apps" || v === "video";

/** The day a student on `track` sees: the common day if there is one, else the track-specific one. */
export function getDay(lang: Lang, track: Track, day: number): CurriculumDay | null {
  return index.get(`${lang}/common/${day}`) ?? index.get(`${lang}/${track}/${day}`) ?? null;
}

export function getProgram(lang: Lang): ProgramResponse["program"] {
  const p = content.programs[lang] ?? content.programs.en ?? content.programs.ru;
  return p
    ? { title: p.title, tagline: p.tagline, phases: p.phases }
    : { title: "FlowLeaf 66", tagline: "", phases: [{ id: 1, days: [1, TOTAL], title: "", goal: "" }] };
}

export function phaseOf(lang: Lang, day: number): number {
  return getProgram(lang).phases.find((p) => day >= p.days[0] && day <= p.days[1])?.id ?? 1;
}

export function summarize(lang: Lang, track: Track, day: number): DaySummary {
  const d = getDay(lang, track, day);
  if (!d) {
    return { day, phase: phaseOf(lang, day), track: null, available: false, title: "", summary: "", estMinutes: 0, rest: false, boss: false, taskCount: 0, xp: 0 };
  }
  return {
    day,
    phase: d.phase,
    track: d.track,
    available: true,
    title: d.title,
    summary: d.summary,
    estMinutes: d.estMinutes,
    rest: !!d.rest,
    boss: !!d.boss,
    taskCount: d.tasks.length,
    xp: d.tasks.reduce((s, t) => s + t.xp, 0),
  };
}

export function allSummaries(lang: Lang, track: Track): DaySummary[] {
  return Array.from({ length: TOTAL }, (_, i) => summarize(lang, track, i + 1));
}

/** Find a task on a day for a track (task ids are language-independent). */
export function findTask(lang: Lang, track: Track, day: number, taskId: string) {
  return getDay(lang, track, day)?.tasks.find((t) => t.id === taskId) ?? null;
}
