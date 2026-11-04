import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { buildDashboard, bucketStreaks, computeFunnel, dateRange, median, nextDays, stuckDays, type DbLike, type Dashboard } from "./analytics";

/** node:sqlite behind the D1 surface analytics.ts uses — runs the real migrations, so the SQL is tested for real. */
function memoryDb(): { db: DbLike; exec: (sql: string, ...v: unknown[]) => void } {
  const raw = new DatabaseSync(":memory:");
  for (const m of ["0001_core", "0100_learn_init", "0200_game_init", "0300_library_init"]) {
    raw.exec(readFileSync(new URL(`../../../migrations/${m}.sql`, import.meta.url), "utf8"));
  }
  return {
    db: { prepare: (sql) => ({ bind: (...v) => ({ all: async <T>() => ({ results: raw.prepare(sql).all(...(v as never[])) as T[] }) }) }) },
    exec: (sql, ...v) => { raw.prepare(sql).run(...(v as never[])); },
  };
}

const NOW = new Date("2026-11-04T12:00:00Z");
const T = Math.floor(NOW.getTime() / 1000);
const D = 86_400;

describe("analytics pure helpers", () => {
  it("dateRange ends today, oldest first", () => {
    expect(dateRange(T, 3)).toEqual(["2026-11-02", "2026-11-03", "2026-11-04"]);
  });
  it("bucketStreaks / median", () => {
    expect(bucketStreaks([0, 0, 1, 3, 7, 40]).map((b) => b.n)).toEqual([2, 1, 1, 0, 1, 0, 1]);
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
  });
  it("nextDays: first gap; 67 = finished", () => {
    const c = new Map([["a", new Map([[1, 0], [2, 0]])], ["b", new Map(Array.from({ length: 66 }, (_, i) => [i + 1, 0] as [number, number]))]]);
    expect(nextDays([{ id: "a", track: null, startedAt: 0 }, { id: "b", track: null, startedAt: 0 }, { id: "c", track: null, startedAt: 0 }], c)).toEqual([3, 67, 1]);
  });
  it("funnel: reached/completed/stuck with eligibility window, task rate capped at 100%", () => {
    const students = [
      { id: "a", track: "apps", startedAt: T - 10 * D },   // did day 1 long ago, stuck on 2
      { id: "b", track: "apps", startedAt: T - 3600 },     // just started: reached day 1, not eligible yet
      { id: "c", track: "video", startedAt: T - 5 * D },   // did 1 and 2
    ];
    const done = new Map([["a", new Map([[1, T - 9 * D]])], ["c", new Map([[1, T - 4 * D], [2, T - 3 * D]])]]);
    const tasks = new Map([["a", new Map([[1, 9], [2, 1]])], ["c", new Map([[1, 2], [2, 2]])]]);
    const f = computeFunnel(students, done, tasks, T, 48 * 3600, () => 2);
    expect(f[0]).toMatchObject({ day: 1, reached: 3, completed: 2, eligible: 2, stuck: 0 });
    expect(f[1]).toMatchObject({ day: 2, reached: 2, completed: 1, eligible: 2, stuck: 1, stuckRate: 0.5 });
    expect(f[0].taskRate).toBeCloseTo(4 / 6); // a: min(9,2)=2, b: 0, c: 2 → 4 of 6
    expect(f[2]).toMatchObject({ reached: 1, completed: 0 });
    expect(stuckDays(f, 2).map((d) => d.day)).toEqual([2]);
    expect(stuckDays(f, 3)).toEqual([]); // too small a sample
  });
});

describe("buildDashboard (SQL over real migrations)", () => {
  let d: Dashboard, noDemo: Dashboard;
  beforeAll(async () => {
    const { db, exec } = memoryDb();
    const user = (id: string, lang: string, track: string | null, startedDaysAgo: number) =>
      exec("INSERT INTO users (id, lang, track, started_at, created_at) VALUES (?,?,?,?,?)", id, lang, track, track ? T - startedDaysAgo * D : null, T - startedDaysAgo * D);
    const ev = (u: string, key: string, type: string, at: number, payload: object = {}) =>
      exec("INSERT INTO game_events (user_id, event_key, type, xp, local_day, payload, created_at) VALUES (?,?,?,?,?,?,?)", u, key, type, 0, new Date(at * 1000).toISOString().slice(0, 10), JSON.stringify(payload), at);
    user("u1", "ru", "apps", 10); user("u2", "en", "video", 3); user("u3", "en", "apps", 5); user("visitor", "en", null, 1); user("seed-01", "ru", "video", 20);
    for (const u of ["u1", "u2", "u3", "seed-01"]) ev(u, "onboarding", "onboarding.completed", T - (u === "u1" ? 10 : u === "u2" ? 3 : u === "u3" ? 5 : 20) * D);
    for (let day = 1; day <= 5; day++) {
      ev("u1", `day:${day}`, "day.completed", T - (10 - day) * D);
      ev("u1", `task:d0${day}-t1`, "task.completed", T - (10 - day) * D, { day, taskId: `d0${day}-t1` });
    }
    ev("u2", "day:1", "day.completed", T - 2 * D);
    exec("INSERT INTO learn_day_progress (user_id, day, track, completed_at, local_date) VALUES ('u2', 2, 'video', ?, '2026-11-03')", T - D); // learn-only completion
    ev("u1", "res:r_a", "resource.viewed", T - D); ev("u2", "res:r_a", "resource.viewed", T - D); ev("u3", "res:r_b", "resource.viewed", T);
    exec("INSERT INTO game_activity (user_id, day, xp, events) VALUES ('u1', '2026-11-04', 10, 1), ('u2', '2026-11-04', 5, 1), ('u3', '2026-10-30', 5, 1), ('seed-01', '2026-11-04', 5, 1)");
    exec("INSERT INTO game_stats (user_id, streak, streak_last_day) VALUES ('u1', 5, '2026-11-04'), ('u2', 2, '2026-10-20'), ('seed-01', 12, '2026-11-03')");
    exec("INSERT INTO lib_resources (id, source_type, title, status, transcript_state, updated_at) VALUES ('r_a', 'link', 'Claude Code overview', 'published', 'ready', ?), ('r_b', 'youtube', 'Stuck video', 'processing', 'needed', ?)", T, T - 3600);
    exec("INSERT INTO lib_materials (resource_id, lang, state) VALUES ('r_b', 'ru', 'failed')");
    exec("INSERT INTO lib_events (resource_id, step, status, message, created_at) VALUES ('r_b', 'build_lesson:ru', 'error', 'invalid: quiz.0.answer', ?)", T - 600);
    exec("INSERT INTO lib_user_items (user_id, resource_id, for_date, done_at) VALUES ('u1', 'r_a', '2026-11-04', ?), ('u2', 'r_a', NULL, ?)", T, T);
    d = await buildDashboard(db, { now: NOW, rangeDays: 14, taskCount: () => 2, ai: false, mediaWorker: true, minSample: 3 });
    noDemo = await buildDashboard(db, { now: NOW, rangeDays: 14, includeDemo: false });
  });

  it("KPIs: students vs visitors, signups, active, streaks", () => {
    expect(d.kpis).toMatchObject({ students: 4, visitors: 5, signups7d: 2, activeToday: 3, active7d: 4, finished: 0 });
    expect(d.demoStudents).toBe(1);
    expect(noDemo.kpis).toMatchObject({ students: 3, visitors: 4, activeToday: 2 });
    expect(d.signups).toHaveLength(14);
    expect(d.signups.at(-4)).toEqual({ date: "2026-11-01", n: 1 }); // u2, 3 days ago
    // u1 alive streak 5; u2's streak is stale → 0; seed-01 alive (yesterday) 12; u3 none
    expect(d.kpis.avgStreak).toBe(4.3);
    expect(d.streaks.find((b) => b.label === "4–6")!.n).toBe(1);
    expect(d.streaks.find((b) => b.label === "7–13")!.n).toBe(1);
  });

  it("splits and current-day distribution (learn_day_progress merged with game events)", () => {
    expect(d.tracks).toEqual({ apps: 2, video: 2, none: 0 });
    expect(d.langs).toEqual({ ru: 2, en: 2 });
    expect(d.currentDay[0]).toBe(2); // u3 and seed-01 on day 1
    expect(d.currentDay[2]).toBe(1); // u2 on day 3 (day 2 only in learn_day_progress)
    expect(d.currentDay[5]).toBe(1); // u1 on day 6
    expect(d.kpis.medianDay).toBe(2);
  });

  it("funnel + stuck days", () => {
    expect(d.funnel[0]).toMatchObject({ reached: 4, completed: 2 });
    expect(d.funnel[0].stuck).toBe(2); // u3 (5 days) + seed-01 (20 days) never finished day 1
    expect(d.stuckDays[0].day).toBe(1);
    expect(noDemo.stuckDays).toEqual([]); // default minSample 5 > 3 eligible students
    expect(d.funnel[0].taskRate).toBeCloseTo(1 / 8); // only u1 logged a task on day 1 (1 of 2), 4 students × 2 tasks
  });

  it("resources and pipeline health", () => {
    expect(d.resources.viewed[0]).toMatchObject({ id: "r_a", n: 2, title: "Claude Code overview", published: true });
    expect(d.resources.done[0]).toMatchObject({ id: "r_a", n: 2 });
    expect(d.resources.saved[0]).toMatchObject({ id: "r_a", n: 1 });
    expect(d.pipeline).toMatchObject({ failedLessons: 1, needsTranscript: 1, stuckProcessing: 1, errors24h: 1, ai: false, mediaWorker: true });
    expect(d.pipeline.byStatus).toMatchObject({ published: 1, processing: 1 });
    expect(d.pipeline.recentErrors[0]).toMatchObject({ resourceId: "r_b", step: "build_lesson:ru" });
  });
});
