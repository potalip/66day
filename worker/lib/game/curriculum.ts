// OWNER: game agent. Read-only view of the generated curriculum (owned by the learn agent).
// The file may not exist yet — import.meta.glob returns {} then, and every lookup degrades gracefully.
import type { CurriculumDay } from "../../../shared/types";

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
  /** day numbers that are boss days (any track/lang) */
  bossDays: Set<number>;
  /** task ids whose type is "ship" */
  shipTasks: Set<string>;
  /** badges listed per day (union over tracks/langs) */
  dayBadges: Map<number, string[]>;
  /** titles for boss days / ship tasks, per lang */
  titles: Map<string, { en?: string; ru?: string }>;
  /** total XP of all non-optional tasks for one track (apps) — used to sanity-check the level curve */
  totalTaskXp: number;
}

export function buildIndex(days: CurriculumDay[]): CurriculumIndex {
  const idx: CurriculumIndex = { bossDays: new Set(), shipTasks: new Set(), dayBadges: new Map(), titles: new Map(), totalTaskXp: 0 };
  for (const d of days) {
    if (d.boss) {
      idx.bossDays.add(d.day);
      const k = `day:${d.day}:${d.track}`;
      idx.titles.set(k, { ...idx.titles.get(k), [d.lang]: d.title });
    }
    if (d.badges?.length) idx.dayBadges.set(d.day, [...new Set([...(idx.dayBadges.get(d.day) ?? []), ...d.badges])]);
    for (const t of d.tasks ?? []) {
      if (t.type === "ship") {
        idx.shipTasks.add(t.id);
        idx.titles.set(`task:${t.id}`, { ...idx.titles.get(`task:${t.id}`), [d.lang]: t.title });
      }
      if (d.lang === "en" && d.track !== "video" && !t.optional) idx.totalTaskXp += t.xp ?? 0;
    }
  }
  return idx;
}

export const CURRICULUM: CurriculumIndex = buildIndex(extractDays(Object.values(files)[0]));
