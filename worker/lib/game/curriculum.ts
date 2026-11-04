// OWNER: game agent. Read-only view of the generated curriculum (owned by the learn agent; built on predev/prebuild/pretest).
// If the file doesn't exist, import.meta.glob returns {} and every lookup degrades gracefully.
import type { CurriculumDay, DayTrack, TaskType, Track } from "../../../shared/types";

const files = import.meta.glob("../../../shared/curriculum.generated.json", { eager: true, import: "default" }) as Record<string, unknown>;

/** Collect every object that looks like a CurriculumDay, whatever the container shape is. */
export function extractDays(root: unknown): CurriculumDay[] {
  const out: CurriculumDay[] = [];
  const seen = new Set<unknown>();
  const walk = (v: unknown, depth: number) => {
    if (!v || typeof v !== "object" || seen.has(v) || depth > 6) return;
    seen.add(v);
    if (Array.isArray(v)) return v.forEach((x) => walk(x, depth + 1));
    const o = v as Record<string, unknown>;
    if (typeof o.day === "number" && Array.isArray(o.tasks)) out.push(o as unknown as CurriculumDay);
    else Object.values(o).forEach((x) => walk(x, depth + 1));
  };
  walk(root, 0);
  return out;
}

export interface CurriculumIndex {
  /** "<track>:<day>" (track = common|apps|video) for boss days */
  boss: Set<string>;
  /** "<track>:<day>" for rest days */
  rest: Set<string>;
  /** task id → type (ids are language-independent) */
  taskType: Map<string, TaskType>;
  /** "<track>:<day>" → badge ids listed on that day file */
  dayBadges: Map<string, string[]>;
  /** titles for boss days ("day:<n>:<track>") and ship tasks ("task:<id>"), per lang */
  titles: Map<string, { en?: string; ru?: string }>;
  /** total XP of all required tasks per track (en) — used to calibrate/check the level curve */
  totalTaskXp: Partial<Record<Track, number>>;
}

export function buildIndex(days: CurriculumDay[]): CurriculumIndex {
  const idx: CurriculumIndex = { boss: new Set(), rest: new Set(), taskType: new Map(), dayBadges: new Map(), titles: new Map(), totalTaskXp: {} };
  for (const d of days) {
    const k = `${d.track}:${d.day}`;
    if (d.boss) {
      idx.boss.add(k);
      idx.titles.set(`day:${d.day}:${d.track}`, { ...idx.titles.get(`day:${d.day}:${d.track}`), [d.lang]: d.title });
    }
    if (d.rest) idx.rest.add(k);
    if (d.badges?.length) idx.dayBadges.set(k, [...new Set([...(idx.dayBadges.get(k) ?? []), ...d.badges])]);
    for (const t of d.tasks ?? []) {
      idx.taskType.set(t.id, t.type);
      if (t.type === "ship") idx.titles.set(`task:${t.id}`, { ...idx.titles.get(`task:${t.id}`), [d.lang]: t.title });
      if (d.lang === "en" && !t.optional) {
        for (const tr of d.track === "common" ? (["apps", "video"] as const) : [d.track]) idx.totalTaskXp[tr] = (idx.totalTaskXp[tr] ?? 0) + (t.xp ?? 0);
      }
    }
  }
  return idx;
}

/** Day lookup for a student: the common day if it exists, else the one for their track. */
export function dayKeyFor(idx: CurriculumIndex, day: number, track: Track | null): string[] {
  const keys: string[] = [`common:${day}`];
  if (track) keys.push(`${track}:${day}`);
  else keys.push(`apps:${day}`, `video:${day}`);
  return keys;
}

export const isBossDay = (idx: CurriculumIndex, day: number, track: Track | null) => dayKeyFor(idx, day, track).some((k) => idx.boss.has(k));
export const isRestDay = (idx: CurriculumIndex, day: number, track: Track | null) => dayKeyFor(idx, day, track).some((k) => idx.rest.has(k));
export const badgesForDay = (idx: CurriculumIndex, day: number, track: Track | null) =>
  track ? [...new Set(dayKeyFor(idx, day, track).flatMap((k) => idx.dayBadges.get(k) ?? []))] : idx.dayBadges.get(`common:${day}`) ?? [];
export function bossTitle(idx: CurriculumIndex, day: number, track: Track | null) {
  for (const t of ["common", track, "apps", "video"] as (DayTrack | null)[]) {
    const v = t && idx.titles.get(`day:${day}:${t}`);
    if (v) return v;
  }
  return {};
}

export const CURRICULUM: CurriculumIndex = buildIndex(extractDays(Object.values(files)[0]));
