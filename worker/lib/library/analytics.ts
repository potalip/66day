/**
 * Founder dashboard: read-only analytics over users / learn_* / game_* / lib_* tables. OWNER: library agent.
 * SQL fetches compact rows; pure functions below aggregate them (unit-tested with node:sqlite + real migrations).
 *
 * Source of truth for activity is `game_events` (learn emits task/day/onboarding events into it, and the game's dev
 * seed writes the same events), with `learn_day_progress` merged in for safety.
 */

/** Minimal D1-compatible surface, so tests can plug in node:sqlite. */
export interface DbLike {
  prepare(sql: string): { bind(...v: unknown[]): { all<T = Record<string, unknown>>(): Promise<{ results: T[] }> } };
}

export const TOTAL_DAYS = 66;
const DAY = 86_400;

export interface DashboardOptions {
  now?: Date;
  rangeDays?: number;          // length of the daily series (signups, active)
  includeDemo?: boolean;       // include the game's dev seed users ("seed-…")
  stuckAfterHours?: number;    // reached a day this long ago and still not done → stuck
  minSample?: number;          // ignore days with fewer eligible students when ranking "stuck" days (default 5)
  taskCount?: (day: number, track: string | null) => number | null; // tasks in a curriculum day (from learn content)
  ai?: boolean;
  mediaWorker?: boolean;
}

export interface FunnelDay { day: number; reached: number; completed: number; eligible: number; stuck: number; completionRate: number | null; stuckRate: number | null; taskRate: number | null }
export interface Dashboard {
  generatedAt: number; rangeDays: number; demoStudents: number; includeDemo: boolean;
  kpis: { students: number; visitors: number; signupsToday: number; signups7d: number; activeToday: number; active7d: number; finished: number; medianDay: number | null; avgStreak: number | null };
  signups: { date: string; n: number }[];
  active: { date: string; n: number }[];
  tracks: Record<"apps" | "video" | "none", number>;
  langs: Record<"ru" | "en", number>;
  currentDay: number[];        // index i → students whose next day is i+1
  funnel: FunnelDay[];
  stuckDays: FunnelDay[];
  streaks: { label: string; min: number; max: number | null; n: number }[];
  resources: { viewed: ResourceStat[]; done: ResourceStat[]; saved: ResourceStat[] };
  pipeline: {
    byStatus: Record<string, number>; failedLessons: number; needsTranscript: number; stuckProcessing: number; errors24h: number;
    recentErrors: { resourceId: string; title: string; step: string; message: string | null; at: number }[];
    ai: boolean; mediaWorker: boolean;
  };
}
export interface ResourceStat { id: string; title: string | null; published: boolean; n: number }

// ---------------- pure helpers ----------------

export function isoDate(sec: number) { return new Date(sec * 1000).toISOString().slice(0, 10); }

/** Last `n` UTC dates ending today, oldest first. */
export function dateRange(nowSec: number, n: number): string[] {
  return Array.from({ length: n }, (_, i) => isoDate(nowSec - (n - 1 - i) * DAY));
}

export function seriesByDate(dates: string[], rows: { date: string; n: number }[]) {
  const m = new Map(rows.map((r) => [r.date, r.n]));
  return dates.map((date) => ({ date, n: m.get(date) ?? 0 }));
}

export const STREAK_BUCKETS: [string, number, number | null][] = [["0", 0, 0], ["1", 1, 1], ["2–3", 2, 3], ["4–6", 4, 6], ["7–13", 7, 13], ["14–29", 14, 29], ["30+", 30, null]];
export function bucketStreaks(values: number[]) {
  return STREAK_BUCKETS.map(([label, min, max]) => ({ label, min, max, n: values.filter((v) => v >= min && (max === null || v <= max)).length }));
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface StudentRow { id: string; track: string | null; startedAt: number }
/**
 * Per-day funnel. Reached(N) = completed day N−1 (day 1: every student). Eligible(N) = reached at least
 * `stuckAfter` seconds ago (so a student who reached it an hour ago isn't counted as stuck). Stuck(N) = eligible
 * and still not completed N. taskRate(N) = share of day N's tasks done by the students who reached it.
 */
export function computeFunnel(
  students: StudentRow[], completions: Map<string, Map<number, number>>, tasksDone: Map<string, Map<number, number>>,
  nowSec: number, stuckAfter: number, taskCount?: DashboardOptions["taskCount"],
): FunnelDay[] {
  const out: FunnelDay[] = [];
  for (let day = 1; day <= TOTAL_DAYS; day++) {
    let reached = 0, completed = 0, eligible = 0, stuck = 0, taskNum = 0, taskDen = 0;
    for (const s of students) {
      const done = completions.get(s.id);
      const reachedAt = day === 1 ? s.startedAt : done?.get(day - 1);
      if (reachedAt === undefined) continue;
      reached++;
      const isDone = done?.has(day) ?? false;
      if (isDone) completed++;
      if (nowSec - reachedAt >= stuckAfter) { eligible++; if (!isDone) stuck++; }
      const total = taskCount?.(day, s.track) ?? null;
      if (total) { taskDen += total; taskNum += Math.min(total, tasksDone.get(s.id)?.get(day) ?? 0); }
    }
    out.push({
      day, reached, completed, eligible, stuck,
      completionRate: reached ? completed / reached : null,
      stuckRate: eligible ? stuck / eligible : null,
      taskRate: taskDen ? taskNum / taskDen : null,
    });
  }
  return out;
}

/** Top `n` days where eligible students get stuck most (ties → earlier day), ignoring tiny samples. */
export function stuckDays(funnel: FunnelDay[], minSample: number, n = 5): FunnelDay[] {
  return funnel.filter((d) => d.eligible >= minSample && (d.stuckRate ?? 0) > 0)
    .sort((a, b) => (b.stuckRate! - a.stuckRate!) || (b.stuck - a.stuck) || (a.day - b.day)).slice(0, n);
}

/** Next day per student (max completed + 1); 67 means finished. */
export function nextDays(students: StudentRow[], completions: Map<string, Map<number, number>>): number[] {
  return students.map((s) => {
    const done = completions.get(s.id);
    if (!done?.size) return 1;
    let d = 1;
    while (done.has(d)) d++;          // days are completed in order; first gap = current day
    return Math.min(d, TOTAL_DAYS + 1);
  });
}

// ---------------- SQL ----------------

const q = async <T>(db: DbLike, sql: string, ...v: unknown[]) => (await db.prepare(sql).bind(...v).all<T>()).results;

export async function buildDashboard(db: DbLike, o: DashboardOptions = {}): Promise<Dashboard> {
  const nowSec = Math.floor((o.now ?? new Date()).getTime() / 1000);
  const rangeDays = o.rangeDays ?? 30;
  const includeDemo = o.includeDemo ?? true;
  const demoFilter = includeDemo ? "" : "AND u.id NOT LIKE 'seed-%'";
  const dates = dateRange(nowSec, rangeDays);
  const weekAgo = dates[Math.max(0, dates.length - 7)];

  // Students = onboarded users (have a track, an onboarding event or a learn profile). Visitors = every users row.
  const studentsRaw = await q<{ id: string; lang: string; track: string | null; created_at: number; onboarded_at: number | null; started_at: number | null }>(db,
    `SELECT u.id, u.lang, u.track, u.created_at, u.started_at,
       COALESCE(p.onboarded_at, (SELECT g.created_at FROM game_events g WHERE g.user_id = u.id AND g.event_key = 'onboarding')) AS onboarded_at
     FROM users u LEFT JOIN learn_profiles p ON p.user_id = u.id
     WHERE (u.track IS NOT NULL OR p.user_id IS NOT NULL OR EXISTS (SELECT 1 FROM game_events g WHERE g.user_id = u.id AND g.event_key = 'onboarding')) ${demoFilter}`);
  const [{ n: visitors }] = await q<{ n: number }>(db, `SELECT COUNT(*) AS n FROM users u WHERE 1 = 1 ${demoFilter}`);
  const demoStudents = studentsRaw.filter((s) => s.id.startsWith("seed-")).length;
  const ids = new Set(studentsRaw.map((s) => s.id));
  const students: StudentRow[] = studentsRaw.map((s) => ({ id: s.id, track: s.track, startedAt: s.started_at ?? s.onboarded_at ?? s.created_at }));
  const keep = (id: string) => ids.has(id);

  // Day completions (game_events ∪ learn_day_progress), earliest timestamp per (user, day).
  const completions = new Map<string, Map<number, number>>();
  const addDone = (u: string, d: number, at: number) => {
    if (!keep(u) || !(d >= 1 && d <= TOTAL_DAYS)) return;
    const m = completions.get(u) ?? new Map<number, number>();
    m.set(d, Math.min(m.get(d) ?? Infinity, at));
    completions.set(u, m);
  };
  for (const r of await q<{ user_id: string; day: number; at: number }>(db,
    "SELECT user_id, CAST(substr(event_key, 5) AS INTEGER) AS day, created_at AS at FROM game_events WHERE type = 'day.completed'")) addDone(r.user_id, r.day, r.at);
  for (const r of await q<{ user_id: string; day: number; at: number }>(db,
    "SELECT user_id, day, completed_at AS at FROM learn_day_progress")) addDone(r.user_id, r.day, r.at);

  const tasksDone = new Map<string, Map<number, number>>();
  for (const r of await q<{ user_id: string; day: number; n: number }>(db,
    `SELECT user_id, CAST(json_extract(payload, '$.day') AS INTEGER) AS day, COUNT(*) AS n
     FROM game_events WHERE type = 'task.completed' GROUP BY user_id, day`)) {
    if (!keep(r.user_id)) continue;
    const m = tasksDone.get(r.user_id) ?? new Map<number, number>();
    m.set(r.day, r.n);
    tasksDone.set(r.user_id, m);
  }

  const activeRows = await q<{ date: string; n: number }>(db,
    `SELECT a.day AS date, COUNT(DISTINCT a.user_id) AS n FROM game_activity a JOIN users u ON u.id = a.user_id
     WHERE a.day >= ? ${demoFilter} GROUP BY a.day`, dates[0]);
  const [{ n: active7d }] = await q<{ n: number }>(db,
    `SELECT COUNT(DISTINCT a.user_id) AS n FROM game_activity a JOIN users u ON u.id = a.user_id WHERE a.day >= ? ${demoFilter}`, weekAgo);

  const streakRows = await q<{ user_id: string; streak: number; streak_last_day: string | null }>(db,
    "SELECT user_id, streak, streak_last_day FROM game_stats");
  // A streak only counts if it is still alive (last streak day today or yesterday, UTC approximation).
  const yesterday = isoDate(nowSec - DAY);
  const streakOf = new Map(streakRows.filter((r) => keep(r.user_id))
    .map((r) => [r.user_id, r.streak_last_day && r.streak_last_day >= yesterday ? r.streak : 0]));
  const streakValues = students.map((s) => streakOf.get(s.id) ?? 0);

  // ---- resources ----
  const titles = new Map((await q<{ id: string; title: string; status: string }>(db, "SELECT id, title, status FROM lib_resources"))
    .map((r) => [r.id, r]));
  const stat = (rows: { rid: string; n: number }[]): ResourceStat[] => rows.map((r) => ({
    id: r.rid, n: r.n, title: titles.get(r.rid)?.title ?? null, published: titles.get(r.rid)?.status === "published",
  }));
  const viewed = stat(await q<{ rid: string; n: number }>(db,
    `SELECT substr(g.event_key, 5) AS rid, COUNT(*) AS n FROM game_events g JOIN users u ON u.id = g.user_id
     WHERE g.type = 'resource.viewed' ${demoFilter} GROUP BY rid ORDER BY n DESC, rid LIMIT 8`));
  const done = stat(await q<{ rid: string; n: number }>(db,
    `SELECT i.resource_id AS rid, COUNT(*) AS n FROM lib_user_items i JOIN users u ON u.id = i.user_id
     WHERE i.done_at IS NOT NULL ${demoFilter} GROUP BY rid ORDER BY n DESC, rid LIMIT 8`));
  const saved = stat(await q<{ rid: string; n: number }>(db,
    `SELECT i.resource_id AS rid, COUNT(*) AS n FROM lib_user_items i JOIN users u ON u.id = i.user_id
     WHERE i.for_date IS NOT NULL ${demoFilter} GROUP BY rid ORDER BY n DESC, rid LIMIT 8`));

  // ---- pipeline health ----
  const byStatus: Record<string, number> = { draft: 0, processing: 0, review: 0, published: 0, failed: 0 };
  for (const r of await q<{ status: string; n: number }>(db, "SELECT status, COUNT(*) AS n FROM lib_resources GROUP BY status")) byStatus[r.status] = r.n;
  const [p] = await q<{ failed: number; needs: number; stuck: number; errors: number }>(db,
    `SELECT (SELECT COUNT(DISTINCT resource_id) FROM lib_materials WHERE state = 'failed') AS failed,
            (SELECT COUNT(*) FROM lib_resources WHERE transcript_state = 'needed' AND status != 'published') AS needs,
            (SELECT COUNT(*) FROM lib_resources WHERE status = 'processing' AND updated_at < ?) AS stuck,
            (SELECT COUNT(*) FROM lib_events WHERE status = 'error' AND created_at >= ?) AS errors`, nowSec - 15 * 60, nowSec - DAY);
  const recentErrors = (await q<{ resource_id: string; title: string; step: string; message: string | null; created_at: number }>(db,
    `SELECT e.resource_id, r.title, e.step, e.message, e.created_at FROM lib_events e JOIN lib_resources r ON r.id = e.resource_id
     WHERE e.status = 'error' ORDER BY e.id DESC LIMIT 5`))
    .map((e) => ({ resourceId: e.resource_id, title: e.title, step: e.step, message: e.message, at: e.created_at }));

  // ---- aggregate ----
  const signupDate = (s: (typeof studentsRaw)[number]) => isoDate(s.onboarded_at ?? s.created_at);
  const signupCounts = new Map<string, number>();
  for (const s of studentsRaw) signupCounts.set(signupDate(s), (signupCounts.get(signupDate(s)) ?? 0) + 1);
  const signups = seriesByDate(dates, [...signupCounts].map(([date, n]) => ({ date, n })));
  const active = seriesByDate(dates, activeRows);
  const next = nextDays(students, completions);
  const currentDay = Array.from({ length: TOTAL_DAYS }, (_, i) => next.filter((d) => d === i + 1).length);
  const funnel = computeFunnel(students, completions, tasksDone, nowSec, (o.stuckAfterHours ?? 48) * 3600, o.taskCount);
  const inProgress = next.filter((d) => d <= TOTAL_DAYS);

  return {
    generatedAt: nowSec, rangeDays, demoStudents, includeDemo,
    kpis: {
      students: students.length, visitors,
      signupsToday: signups[signups.length - 1].n,
      signups7d: signups.slice(-7).reduce((a, b) => a + b.n, 0),
      activeToday: active[active.length - 1].n, active7d,
      finished: next.filter((d) => d > TOTAL_DAYS).length,
      medianDay: median(inProgress),
      avgStreak: streakValues.length ? Math.round((streakValues.reduce((a, b) => a + b, 0) / streakValues.length) * 10) / 10 : null,
    },
    signups, active,
    tracks: {
      apps: studentsRaw.filter((s) => s.track === "apps").length,
      video: studentsRaw.filter((s) => s.track === "video").length,
      none: studentsRaw.filter((s) => s.track !== "apps" && s.track !== "video").length,
    },
    langs: { ru: studentsRaw.filter((s) => s.lang === "ru").length, en: studentsRaw.filter((s) => s.lang !== "ru").length },
    currentDay, funnel, stuckDays: stuckDays(funnel, o.minSample ?? 5),
    streaks: bucketStreaks(streakValues),
    resources: { viewed, done, saved },
    pipeline: { byStatus, failedLessons: p.failed, needsTranscript: p.needs, stuckProcessing: p.stuck, errors24h: p.errors, recentErrors, ai: !!o.ai, mediaWorker: !!o.mediaWorker },
  };
}
