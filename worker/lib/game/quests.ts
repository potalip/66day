// OWNER: game agent. Weekly quests: 1–3 rotating challenges per track and ISO week (UTC — same week as the
// weekly leaderboard). Data in quests.json; progress is computed from the game_events ledger, so it is exact,
// replayable and needs no extra table. Completion is a normal idempotent game event ("quest:<week>:<id>").
import type { Lang, TaskType, Track } from "../../../shared/types";
import pool from "./quests.json";
import { CURRICULUM, type CurriculumIndex } from "./curriculum";
import { isoWeek, weekResetsAt } from "./time";

export type QuestGoal =
  | { kind: "active_days" | "days_completed" | "tasks" | "resources" | "renders"; target: number }
  | { kind: "task_type" | "consecutive_days"; target: number; types: TaskType[] };

export interface QuestDef {
  id: string;
  slot: number;
  tracks: Track[];
  xp: number;
  icon: string;
  goal: QuestGoal;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
}

export const QUESTS: QuestDef[] = (pool as { quests: QuestDef[] }).quests;
export const QUESTS_BY_ID = new Map(QUESTS.map((q) => [q.id, q]));

/** Week number inside the year from "2026-W45" (stable rotation index). */
const weekIndex = (week: string) => {
  const [y, w] = week.split("-W").map(Number);
  return y * 53 + w;
};

/** The quests for a week + track: one per slot, rotating deterministically through each slot's pool. */
export function pickQuests(week: string, track: Track | null, defs: QuestDef[] = QUESTS): QuestDef[] {
  const slots = [...new Set(defs.map((d) => d.slot))].sort((a, b) => a - b);
  const out: QuestDef[] = [];
  for (const slot of slots) {
    const cands = defs.filter((d) => d.slot === slot && (!track || d.tracks.includes(track)));
    if (!cands.length) continue;
    out.push(cands[(weekIndex(week) + slot * 2) % cands.length]);
  }
  return out.slice(0, 3);
}

export interface WeekEvent { type: string; localDay: string; taskType?: TaskType }

const STREAKY = new Set(["task.completed", "day.completed", "onboarding.completed", "studio.rendered"]);

function longestRun(days: string[]): number {
  const nums = [...new Set(days)].map((d) => Date.parse(`${d}T00:00:00Z`) / 86_400_000).sort((a, b) => a - b);
  let best = 0, run = 0, prev = NaN;
  for (const n of nums) {
    run = n === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = n;
  }
  return best;
}

/** Raw progress (0..target) of one quest given this week's events. */
export function questProgress(q: QuestDef, evs: WeekEvent[]): number {
  const g = q.goal;
  let v = 0;
  switch (g.kind) {
    case "active_days": v = new Set(evs.filter((e) => STREAKY.has(e.type)).map((e) => e.localDay)).size; break;
    case "days_completed": v = evs.filter((e) => e.type === "day.completed").length; break;
    case "tasks": v = evs.filter((e) => e.type === "task.completed").length; break;
    case "resources": v = evs.filter((e) => e.type === "resource.viewed").length; break;
    case "renders": v = evs.filter((e) => e.type === "studio.rendered").length; break;
    case "task_type": v = evs.filter((e) => e.type === "task.completed" && e.taskType && g.types.includes(e.taskType)).length; break;
    case "consecutive_days":
      v = longestRun(evs.filter((e) => e.type === "task.completed" && e.taskType && g.types.includes(e.taskType)).map((e) => e.localDay));
      break;
  }
  return Math.min(v, g.target);
}

export function weekBounds(now: Date) {
  const end = Math.floor(weekResetsAt(now).getTime() / 1000);
  return { week: isoWeek(now), start: end - 7 * 86400, end };
}

/** Events of the current ISO week for a user (+ which quests are already completed). */
export async function loadWeek(db: D1Database, userId: string, now: Date, cur: CurriculumIndex = CURRICULUM) {
  const { week, start, end } = weekBounds(now);
  const r = await db
    .prepare("SELECT event_key, type, local_day, payload, created_at FROM game_events WHERE user_id = ? AND created_at >= ? AND created_at < ? ORDER BY created_at")
    .bind(userId, start, end)
    .all<{ event_key: string; type: string; local_day: string; payload: string | null; created_at: number }>();
  const events: WeekEvent[] = [];
  const done = new Map<string, number>();
  for (const e of r.results) {
    if (e.type === "quest.completed") {
      const id = e.event_key.split(":")[2];
      if (e.event_key.startsWith(`quest:${week}:`)) done.set(id, e.created_at);
      continue;
    }
    let taskType: TaskType | undefined;
    if (e.type === "task.completed") {
      try { taskType = cur.taskType.get(String(JSON.parse(e.payload ?? "{}").taskId)); } catch { /* ignore */ }
    }
    events.push({ type: e.type, localDay: e.local_day, taskType });
  }
  return { week, start, end, events, done };
}
