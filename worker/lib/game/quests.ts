// OWNER: game agent. Weekly quests (pool authored by curriculum in docs/curriculum/quests.md → quests.json).
// Week = UTC ISO week (same as the weekly leaderboard). Progress is computed from the game_events ledger
// (+ read-only proof details from learn_submissions when present), so it is exact and needs no extra table.
// Completion is a normal idempotent game event "quest:<week>:<id>" that pays bonus XP once.
import type { Lang, TaskType, Track } from "../../../shared/types";
import pool from "./quests.json";
import { CURRICULUM, isBossDay, type CurriculumIndex } from "./curriculum";
import { isoWeek, weekResetsAt } from "./time";

export interface TaskFilter {
  types?: TaskType[];
  ids?: string[];
  requireUrl?: boolean;
  urlPattern?: string;
  minWords?: number;
  minLines?: number;
  videoFile?: boolean;
  anyOf?: TaskFilter[];
}
export type CountKind = "tasks" | "task_days" | "boss_days" | "resources" | "renders";
export interface SimpleGoal extends TaskFilter { count: CountKind; target: number }
export type QuestGoal = SimpleGoal | { parts: SimpleGoal[] } | { alternatives: SimpleGoal[] };

export interface QuestDef {
  id: string;
  track: "common" | Track;
  /** program weeks (1–10) the quest may appear in, or "all" */
  weeks: number[] | "all";
  xp: number;
  icon: string;
  goal: QuestGoal;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
}

export const QUESTS: QuestDef[] = (pool as unknown as { quests: QuestDef[] }).quests;
export const QUESTS_BY_ID = new Map(QUESTS.map((q) => [q.id, q]));

// ---- rotation -------------------------------------------------------------------------------
export interface RotationCtx {
  track: Track | null;
  /** program week (1–10) the student is in at the start of the ISO week */
  programWeek: number;
  /** behind schedule → prefer the "returning" quests */
  behind?: boolean;
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const prevIsoWeek = (week: string) => {
  const [y, w] = week.split("-W").map(Number);
  // Thursday of that week minus 7 days → ISO week of the previous week
  const jan4 = Date.UTC(y, 0, 4);
  const mondayW1 = jan4 - (((new Date(jan4).getUTCDay() || 7) - 1) * 86400000);
  return isoWeek(new Date(mondayW1 + (w - 1) * 7 * 86400000 - 4 * 86400000));
};

export const CATCH_UP = ["q-five-of-seven", "q-reader"];
export const ONBOARDING_SET = ["q-five-of-seven", "q-say-it-out-loud", "q-honest-mirror"];

const eligible = (q: QuestDef, ctx: RotationCtx) =>
  (q.track === "common" || q.track === ctx.track) && (q.weeks === "all" || q.weeks.includes(ctx.programWeek));

function rank(list: QuestDef[], week: string) {
  return [...list].sort((a, b) => hash(`${week}:${a.id}`) - hash(`${week}:${b.id}`));
}

/**
 * Curriculum's rotation: program week 1 → the onboarding set (shared only); otherwise 1 shared + 2 track quests for
 * the student's program week, never repeating last week's picks when there's an alternative; students who are
 * behind get a "returning" quest as their shared slot. Deterministic per (ISO week, track, program week).
 */
export function pickQuests(week: string, ctx: RotationCtx, defs: QuestDef[] = QUESTS, depth = 0): QuestDef[] {
  if (ctx.programWeek <= 1) return ONBOARDING_SET.map((id) => defs.find((q) => q.id === id)).filter(Boolean) as QuestDef[];
  const last = depth === 0 ? new Set(pickQuests(prevIsoWeek(week), ctx, defs, 1).map((q) => q.id)) : new Set<string>();
  const fresh = (l: QuestDef[]) => (l.filter((q) => !last.has(q.id)).length ? l.filter((q) => !last.has(q.id)) : l);

  const shared = defs.filter((q) => q.track === "common" && eligible(q, ctx));
  const own = defs.filter((q) => q.track !== "common" && eligible(q, ctx));
  let sharedPick: QuestDef[] = rank(fresh(shared), week);
  if (ctx.behind) {
    const back = sharedPick.filter((q) => CATCH_UP.includes(q.id));
    sharedPick = [...back, ...sharedPick.filter((q) => !CATCH_UP.includes(q.id))];
  }
  const out = [...sharedPick.slice(0, 1), ...rank(fresh(own), week).slice(0, 2)];
  // Fill up to 3 from the remaining shared quests (early weeks may have <2 track quests).
  for (const q of rank(shared, `${week}:fill`)) if (out.length < 3 && !out.includes(q)) out.push(q);
  return out.slice(0, 3);
}

// ---- progress -------------------------------------------------------------------------------
export interface WeekEvent {
  type: string;
  localDay: string;
  taskId?: string;
  taskType?: TaskType;
  day?: number;
  proof?: { text?: string | null; url?: string | null; fileType?: string | null };
}

const words = (t?: string | null) => (t ?? "").trim().split(/\s+/).filter(Boolean).length;
const lines = (t?: string | null) => (t ?? "").split(/\n/).filter((l) => l.trim()).length;

export function matchesTask(e: WeekEvent, f: TaskFilter): boolean {
  if (f.anyOf?.length) return f.anyOf.some((g) => matchesTask(e, g));
  if (f.types && !(e.taskType && f.types.includes(e.taskType))) return false;
  if (f.ids && !(e.taskId && f.ids.includes(e.taskId))) return false;
  if (f.requireUrl && !e.proof?.url) return false;
  if (f.urlPattern && !(e.proof?.url && new RegExp(f.urlPattern, "i").test(e.proof.url))) return false;
  if (f.minWords && words(e.proof?.text) < f.minWords) return false;
  if (f.minLines && lines(e.proof?.text) < f.minLines) return false;
  if (f.videoFile && !(e.proof?.fileType ?? "").startsWith("video/")) return false;
  return true;
}

function simpleProgress(g: SimpleGoal, evs: WeekEvent[], track: Track | null, cur: CurriculumIndex): number {
  const tasks = () => evs.filter((e) => e.type === "task.completed" && matchesTask(e, g));
  let v = 0;
  switch (g.count) {
    case "tasks": v = new Set(tasks().map((e) => e.taskId)).size; break;
    case "task_days": v = new Set(tasks().map((e) => e.localDay)).size; break;
    case "boss_days": v = evs.filter((e) => e.type === "day.completed" && e.day && isBossDay(cur, e.day, track)).length; break;
    case "resources": v = evs.filter((e) => e.type === "resource.viewed").length; break;
    case "renders": v = evs.filter((e) => e.type === "studio.rendered").length; break;
  }
  return Math.min(v, g.target);
}

export function questTarget(q: QuestDef): number {
  const g = q.goal;
  if ("parts" in g) return g.parts.reduce((n, p) => n + p.target, 0);
  if ("alternatives" in g) return Math.max(...g.alternatives.map((a) => a.target));
  return g.target;
}

/** Progress 0..target. Parts add up; alternatives take the best (scaled to the displayed target). */
export function questProgress(q: QuestDef, evs: WeekEvent[], track: Track | null = null, cur: CurriculumIndex = CURRICULUM): number {
  const g = q.goal;
  if ("parts" in g) return g.parts.reduce((n, p) => n + simpleProgress(p, evs, track, cur), 0);
  const target = questTarget(q);
  if ("alternatives" in g) {
    const best = Math.max(...g.alternatives.map((a) => simpleProgress(a, evs, track, cur) / a.target));
    return best >= 1 ? target : Math.floor(best * target);
  }
  return simpleProgress(g, evs, track, cur);
}

export function weekBounds(now: Date) {
  const end = Math.floor(weekResetsAt(now).getTime() / 1000);
  return { week: isoWeek(now), start: end - 7 * 86400, end };
}

/** Everything quests need for a user's current ISO week. */
export async function loadWeek(db: D1Database, userId: string, now: Date, cur: CurriculumIndex = CURRICULUM) {
  const { week, start, end } = weekBounds(now);
  const [evRes, before, user] = await db.batch([
    db.prepare("SELECT event_key, type, local_day, payload, created_at FROM game_events WHERE user_id = ? AND created_at >= ? AND created_at < ? ORDER BY created_at").bind(userId, start, end),
    db.prepare("SELECT event_key FROM game_events WHERE user_id = ? AND type = 'day.completed' AND created_at < ?").bind(userId, start),
    db.prepare("SELECT u.track AS ut, s.track AS st, u.started_at AS started FROM users u LEFT JOIN game_stats s ON s.user_id = u.id WHERE u.id = ?").bind(userId),
  ]);
  const u = user.results[0] as { ut: Track | null; st: Track | null; started: number | null } | undefined;
  const track = u?.ut ?? u?.st ?? null;

  const events: WeekEvent[] = [];
  const done = new Map<string, number>();
  for (const e of evRes.results as { event_key: string; type: string; local_day: string; payload: string | null; created_at: number }[]) {
    if (e.type === "quest.completed") {
      if (e.event_key.startsWith(`quest:${week}:`)) done.set(e.event_key.slice(`quest:${week}:`.length), e.created_at);
      continue;
    }
    let p: Record<string, unknown> = {};
    try { p = JSON.parse(e.payload ?? "{}"); } catch { /* ignore */ }
    const taskId = typeof p.taskId === "string" ? p.taskId : undefined;
    events.push({ type: e.type, localDay: e.local_day, taskId, taskType: taskId ? cur.taskType.get(taskId) : undefined, day: typeof p.day === "number" ? p.day : undefined });
  }
  await attachProofs(db, userId, events);

  // Program week at the *start* of this ISO week, so the quest set stays stable all week.
  const doneBefore = (before.results as { event_key: string }[]).map((r) => Number(r.event_key.slice(4))).filter(Number.isFinite);
  const maxDay = doneBefore.length ? Math.max(...doneBefore) : 0;
  const programWeek = Math.min(10, Math.floor(maxDay / 7) + 1);
  const daysSinceStart = u?.started ? Math.floor((start - u.started) / 86400) : 0;
  const behind = daysSinceStart - maxDay >= 4;
  return { week, start, end, events, done, ctx: { track, programWeek, behind } as RotationCtx };
}

/** Read-only peek at learn's latest submission per task (proof text/url/file type). Missing table → no proofs. */
async function attachProofs(db: D1Database, userId: string, events: WeekEvent[]) {
  const ids = [...new Set(events.map((e) => e.taskId).filter(Boolean))] as string[];
  if (!ids.length) return;
  try {
    const r = await db
      .prepare(`SELECT task_id, text_value, url_value, file_type FROM learn_submissions WHERE user_id = ? AND task_id IN (${ids.map(() => "?").join(",")}) ORDER BY created_at`)
      .bind(userId, ...ids)
      .all<{ task_id: string; text_value: string | null; url_value: string | null; file_type: string | null }>();
    const latest = new Map(r.results.map((x) => [x.task_id, x]));
    for (const e of events) {
      const s = e.taskId ? latest.get(e.taskId) : undefined;
      if (s) e.proof = { text: s.text_value, url: s.url_value, fileType: s.file_type };
    }
  } catch { /* learn tables not present */ }
}
