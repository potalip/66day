/**
 * OWNER: learn. All learn_* DB access + the progress use-cases (onboarding, task proof, day completion).
 * Routes stay thin; this file is where the rules live.
 */
import type { Env } from "../../env";
import type { Award, CurriculumTask, Lang, Track } from "../../../shared/types";
import { onGameEvent } from "../game";
import type {
  DayCompleteResult, DayResponse, GoalKey, LearnProfile, Overview, PathCell, SubmissionStatus, SubmissionView,
  TaskResult, TaskState,
} from "./api-types";
import { TOTAL, allSummaries, content, getDay, getProgram, summarize } from "./content";
import { computeSchedule, dayAccess, localDate, type Schedule } from "./schedule";

export const GOALS: GoalKey[] = ["portfolio", "job", "project", "habit", "curious"];
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const now = () => Math.floor(Date.now() / 1000);

export class LearnError extends Error {
  constructor(public status: 400 | 403 | 404 | 409 | 413, public code: string, message?: string) {
    super(message ?? code);
  }
}

interface UserRow {
  id: string;
  display_name: string | null;
  lang: Lang;
  track: Track | null;
  started_at: number | null;
  timezone: string | null;
}
interface ProfileRow { daily_minutes: number; goal: GoalKey | null; goal_note: string | null; onboarded_at: number }
interface SubmissionRow {
  id: string; proof_type: CurriculumTask["proof"]; text_value: string | null; url_value: string | null;
  file_key: string | null; file_name: string | null; file_type: string | null; file_size: number | null;
  status: SubmissionStatus; reviewer: string | null; feedback: string | null; created_at: number; task_id: string;
}

export interface Ctx {
  env: Env;
  userId: string;
  user: UserRow;
  profile: ProfileRow | null;
  track: Track;
  tz: string;
  completed: { day: number; localDate: string; completedAt: number }[];
  schedule: Schedule;
  completedSet: Set<number>;
}

/** Load everything progress decisions need, in 3 queries. */
export async function loadCtx(env: Env, userId: string, nowSec = now()): Promise<Ctx> {
  const [user, profile, days] = await env.DB.batch([
    env.DB.prepare("SELECT id, display_name, lang, track, started_at, timezone FROM users WHERE id = ?").bind(userId),
    env.DB.prepare("SELECT daily_minutes, goal, goal_note, onboarded_at FROM learn_profiles WHERE user_id = ?").bind(userId),
    env.DB.prepare("SELECT day, local_date, completed_at FROM learn_day_progress WHERE user_id = ? ORDER BY day").bind(userId),
  ]);
  const u = (user.results[0] as UserRow | undefined) ?? { id: userId, display_name: null, lang: "en", track: null, started_at: null, timezone: "UTC" };
  const p = (profile.results[0] as ProfileRow | undefined) ?? null;
  const tz = u.timezone || "UTC";
  const completed = (days.results as { day: number; local_date: string; completed_at: number }[]).map((r) => ({
    day: r.day, localDate: r.local_date, completedAt: r.completed_at,
  }));
  const today = localDate(nowSec, tz);
  const startDate = u.started_at ? localDate(u.started_at, tz) : today;
  const schedule = computeSchedule({ completed, startDate, today, totalDays: TOTAL });
  return {
    env, userId, user: u, profile: p, track: u.track ?? "apps", tz, completed, schedule,
    completedSet: new Set(completed.map((c) => c.day)),
  };
}

export function profileOf(ctx: Ctx): LearnProfile | null {
  if (!ctx.profile || !ctx.user.track) return null;
  return {
    name: ctx.user.display_name,
    track: ctx.user.track,
    dailyMinutes: ctx.profile.daily_minutes,
    goal: ctx.profile.goal,
    goalNote: ctx.profile.goal_note,
    timezone: ctx.tz,
    startedAt: ctx.user.started_at ?? ctx.profile.onboarded_at,
  };
}

export async function overview(ctx: Ctx, lang: Lang): Promise<Overview> {
  const rows = await ctx.env.DB.prepare(
    "SELECT day, COUNT(*) AS n, COALESCE(SUM(xp),0) AS xp FROM learn_task_progress WHERE user_id = ? GROUP BY day",
  ).bind(ctx.userId).all<{ day: number; n: number; xp: number }>();
  const perDay = new Map(rows.results.map((r) => [r.day, r]));
  const completedAt = new Map(ctx.completed.map((c) => [c.day, c.completedAt]));
  const s = ctx.schedule;
  const cells: PathCell[] = allSummaries(lang, ctx.track).map((d) => ({
    ...d,
    access: dayAccess(d.day, ctx.completedSet, s),
    isToday: s.nextDay === d.day,
    tasksDone: perDay.get(d.day)?.n ?? 0,
    completedAt: completedAt.get(d.day) ?? null,
  }));
  return {
    onboarded: !!profileOf(ctx),
    profile: profileOf(ctx),
    totalDays: TOTAL,
    nextDay: s.nextDay,
    status: s.status,
    calendarDay: s.calendarDay,
    behind: s.behind,
    completedCount: s.completedCount,
    completedToday: s.completedToday,
    percent: s.percent,
    xpEarned: rows.results.reduce((a, r) => a + r.xp, 0),
    source: content.source,
    program: getProgram(lang),
    cells,
  };
}

function submissionView(r: SubmissionRow): SubmissionView {
  return {
    id: r.id,
    proof: r.proof_type,
    text: r.text_value,
    url: r.url_value,
    file: r.file_key
      ? { name: r.file_name ?? "file", type: r.file_type ?? "application/octet-stream", size: r.file_size ?? 0, href: `/api/progress/files/${r.id}` }
      : null,
    status: r.status,
    reviewer: r.reviewer,
    feedback: r.feedback,
    createdAt: r.created_at,
  };
}

async function taskStates(ctx: Ctx, day: number): Promise<Record<string, TaskState>> {
  const [prog, subs] = await ctx.env.DB.batch([
    ctx.env.DB.prepare("SELECT task_id, completed_at, submission_id FROM learn_task_progress WHERE user_id = ? AND day = ?").bind(ctx.userId, day),
    // latest submission per task for this day
    ctx.env.DB.prepare(
      `SELECT s.* FROM learn_submissions s
       WHERE s.user_id = ?1 AND s.day = ?2
         AND s.created_at = (SELECT MAX(created_at) FROM learn_submissions x WHERE x.user_id = ?1 AND x.task_id = s.task_id)
       ORDER BY s.created_at DESC`,
    ).bind(ctx.userId, day),
  ]);
  const out: Record<string, TaskState> = {};
  const latest = new Map<string, SubmissionRow>();
  for (const r of subs.results as unknown as SubmissionRow[]) if (!latest.has(r.task_id)) latest.set(r.task_id, r);
  for (const r of prog.results as { task_id: string; completed_at: number; submission_id: string | null }[]) {
    const sub = latest.get(r.task_id);
    out[r.task_id] = { done: true, completedAt: r.completed_at, submission: sub && sub.proof_type !== "none" ? submissionView(sub) : null };
  }
  for (const [taskId, sub] of latest) {
    if (!out[taskId] && sub.proof_type !== "none") out[taskId] = { done: false, completedAt: null, submission: submissionView(sub) };
  }
  return out;
}

export async function dayView(ctx: Ctx, lang: Lang, dayNum: number): Promise<DayResponse> {
  const summary = summarize(lang, ctx.track, dayNum);
  const access = dayAccess(dayNum, ctx.completedSet, ctx.schedule);
  // Locked days are a teaser only: no lesson body, no tasks.
  const day = access === "locked" ? null : getDay(lang, ctx.track, dayNum);
  return {
    day,
    summary,
    access,
    status: ctx.schedule.status,
    completedAt: ctx.completed.find((c) => c.day === dayNum)?.completedAt ?? null,
    tasks: access === "locked" ? {} : await taskStates(ctx, dayNum),
    next: dayNum < TOTAL ? summarize(lang, ctx.track, dayNum + 1) : null,
    isToday: ctx.schedule.nextDay === dayNum,
  };
}

export interface ProofInput {
  text?: string;
  url?: string;
  file?: File;
}

/** Normalise and validate a proof for a task's proof type. */
export function validateProof(task: Pick<CurriculumTask, "proof">, input: ProofInput): ProofInput {
  switch (task.proof) {
    case "none":
      return {};
    case "text": {
      const text = (input.text ?? "").trim();
      if (text.length < 2) throw new LearnError(400, "proof_text_required", "Write a few words as proof.");
      if (text.length > 5000) throw new LearnError(400, "proof_text_too_long", "Keep it under 5000 characters.");
      return { text };
    }
    case "link": {
      let url = (input.url ?? input.text ?? "").trim();
      if (url && !/^[a-z][a-z0-9+.-]*:\/\//i.test(url) && /^[\w-]+(\.[\w-]+)+/.test(url)) url = `https://${url}`;
      let ok = false;
      try {
        const u = new URL(url);
        ok = (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".");
      } catch {}
      if (!ok || url.length > 2000) throw new LearnError(400, "proof_link_invalid", "Paste a full link, like https://…");
      const note = (input.text ?? "").trim();
      return { url, text: note && note !== input.url && note !== url ? note.slice(0, 2000) : undefined };
    }
    case "file": {
      const f = input.file;
      if (!f || typeof f === "string" || f.size === 0) throw new LearnError(400, "proof_file_required", "Attach a file.");
      if (f.size > MAX_FILE_BYTES) throw new LearnError(413, "proof_file_too_large", "Files up to 50 MB.");
      return { file: f, text: (input.text ?? "").trim().slice(0, 2000) || undefined };
    }
  }
}

const safeName = (n: string) => n.replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_").slice(-120) || "file";

async function emit(env: Env, userId: string, ev: Parameters<typeof onGameEvent>[2]): Promise<Award[]> {
  try {
    return (await onGameEvent(env, userId, ev)) ?? [];
  } catch (e) {
    // The game layer must never block learning progress.
    console.error("onGameEvent failed", ev.type, e);
    return [];
  }
}

function requireWritable(ctx: Ctx, dayNum: number) {
  if (!profileOf(ctx)) throw new LearnError(409, "not_onboarded", "Finish onboarding first.");
  const access = dayAccess(dayNum, ctx.completedSet, ctx.schedule);
  if (access === "locked") throw new LearnError(403, "day_locked", "Finish the previous days first.");
  if (access === "waiting") throw new LearnError(403, "day_waiting", "This day opens tomorrow.");
  return access;
}

/** Submit proof for a task (or re-submit). Auto-completes the day when the last required task is done. */
export async function submitTask(ctx: Ctx, lang: Lang, dayNum: number, taskId: string, input: ProofInput, nowSec = now()): Promise<TaskResult> {
  const day = getDay(lang, ctx.track, dayNum);
  if (!day) throw new LearnError(404, "day_not_found");
  const task = day.tasks.find((t) => t.id === taskId);
  if (!task) throw new LearnError(404, "task_not_found");
  requireWritable(ctx, dayNum);
  const proof = validateProof(task, input);

  const id = crypto.randomUUID();
  let fileKey: string | null = null;
  if (proof.file) {
    fileKey = `learn/${ctx.userId}/${id}/${safeName(proof.file.name)}`;
    await ctx.env.MEDIA.put(fileKey, proof.file.stream(), {
      httpMetadata: { contentType: proof.file.type || "application/octet-stream" },
      customMetadata: { userId: ctx.userId, taskId, day: String(dayNum) },
    });
  }
  // No-proof tasks are approved automatically; everything else waits for (future) review but already counts as done.
  const status: SubmissionStatus = task.proof === "none" ? "approved" : "submitted";
  const existing = await ctx.env.DB.prepare("SELECT 1 FROM learn_task_progress WHERE user_id = ? AND task_id = ?")
    .bind(ctx.userId, taskId).first();

  await ctx.env.DB.batch([
    ctx.env.DB.prepare(
      `INSERT INTO learn_submissions (id, user_id, day, task_id, lang, proof_type, text_value, url_value, file_key, file_name, file_type, file_size, status, reviewer, reviewed_at, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(
      id, ctx.userId, dayNum, taskId, lang, task.proof, proof.text ?? null, proof.url ?? null, fileKey,
      proof.file?.name.slice(0, 200) ?? null, proof.file?.type || (proof.file ? "application/octet-stream" : null), proof.file?.size ?? null,
      status, task.proof === "none" ? "auto" : null, task.proof === "none" ? nowSec : null, nowSec,
    ),
    ctx.env.DB.prepare(
      `INSERT INTO learn_task_progress (user_id, task_id, day, xp, submission_id, completed_at) VALUES (?,?,?,?,?,?)
       ON CONFLICT (user_id, task_id) DO UPDATE SET submission_id = excluded.submission_id`,
    ).bind(ctx.userId, taskId, dayNum, task.xp, id, nowSec),
  ]);

  const awards = existing ? [] : await emit(ctx.env, ctx.userId, { type: "task.completed", taskId, day: dayNum, xp: task.xp });
  let dayCompleted = false;
  if (!ctx.completedSet.has(dayNum)) {
    const r = await tryCompleteDay(ctx, lang, dayNum, nowSec);
    dayCompleted = r.completed;
    awards.push(...r.awards);
  }
  const fresh = await loadCtx(ctx.env, ctx.userId, nowSec);
  const states = await taskStates(fresh, dayNum);
  return {
    taskId,
    task: states[taskId] ?? { done: true, completedAt: nowSec, submission: null },
    dayCompleted,
    awards,
    nextDay: fresh.schedule.nextDay,
    status: fresh.schedule.status,
  };
}

/** Un-check a task. Only possible while the day isn't completed. Submission history is kept. */
export async function uncheckTask(ctx: Ctx, dayNum: number, taskId: string) {
  if (ctx.completedSet.has(dayNum)) throw new LearnError(409, "day_completed", "This day is already complete.");
  await ctx.env.DB.prepare("DELETE FROM learn_task_progress WHERE user_id = ? AND task_id = ? AND day = ?").bind(ctx.userId, taskId, dayNum).run();
}

async function tryCompleteDay(ctx: Ctx, lang: Lang, dayNum: number, nowSec: number): Promise<{ completed: boolean; awards: Award[] }> {
  const day = getDay(lang, ctx.track, dayNum);
  if (!day) return { completed: false, awards: [] };
  const done = await ctx.env.DB.prepare("SELECT task_id FROM learn_task_progress WHERE user_id = ? AND day = ?").bind(ctx.userId, dayNum).all<{ task_id: string }>();
  const doneIds = new Set(done.results.map((r) => r.task_id));
  const required = day.tasks.filter((t) => !t.optional);
  if (!required.every((t) => doneIds.has(t.id))) return { completed: false, awards: [] };
  const res = await ctx.env.DB.prepare(
    "INSERT OR IGNORE INTO learn_day_progress (user_id, day, track, completed_at, local_date) VALUES (?,?,?,?,?)",
  ).bind(ctx.userId, dayNum, day.track, nowSec, localDate(nowSec, ctx.tz)).run();
  if (!res.meta.changes) return { completed: false, awards: [] };
  ctx.completedSet.add(dayNum);
  const awards = await emit(ctx.env, ctx.userId, { type: "day.completed", day: dayNum, badges: day.badges });
  return { completed: true, awards };
}

/** Explicit day completion (e.g. a day whose tasks are all optional). */
export async function completeDay(ctx: Ctx, lang: Lang, dayNum: number, nowSec = now()): Promise<DayCompleteResult> {
  if (!getDay(lang, ctx.track, dayNum)) throw new LearnError(404, "day_not_found");
  if (ctx.completedSet.has(dayNum)) {
    return { day: dayNum, dayCompleted: false, awards: [], nextDay: ctx.schedule.nextDay, status: ctx.schedule.status };
  }
  requireWritable(ctx, dayNum);
  const r = await tryCompleteDay(ctx, lang, dayNum, nowSec);
  if (!r.completed) throw new LearnError(409, "tasks_incomplete", "Finish the required tasks first.");
  const fresh = await loadCtx(ctx.env, ctx.userId, nowSec);
  return { day: dayNum, dayCompleted: true, awards: r.awards, nextDay: fresh.schedule.nextDay, status: fresh.schedule.status };
}

export interface OnboardingInput {
  lang: Lang;
  track: Track;
  dailyMinutes: number;
  goal: GoalKey | null;
  goalNote?: string | null;
  name?: string | null;
  timezone?: string | null;
}

export async function saveOnboarding(env: Env, userId: string, inp: OnboardingInput, firstTime: boolean): Promise<Award[]> {
  const stmts = [
    env.DB.prepare(
      `UPDATE users SET lang = ?, track = ?, display_name = COALESCE(?, display_name), timezone = COALESCE(?, timezone),
       started_at = COALESCE(started_at, unixepoch()) WHERE id = ?`,
    ).bind(inp.lang, inp.track, inp.name ?? null, inp.timezone ?? null, userId),
    env.DB.prepare(
      `INSERT INTO learn_profiles (user_id, daily_minutes, goal, goal_note) VALUES (?,?,?,?)
       ON CONFLICT (user_id) DO UPDATE SET daily_minutes = excluded.daily_minutes, goal = excluded.goal,
       goal_note = excluded.goal_note, updated_at = unixepoch()`,
    ).bind(userId, inp.dailyMinutes, inp.goal, inp.goalNote ?? null),
  ];
  await env.DB.batch(stmts);
  return firstTime ? emit(env, userId, { type: "onboarding.completed", track: inp.track }) : [];
}

export async function updateProfile(env: Env, userId: string, patch: Partial<Omit<OnboardingInput, "lang">>) {
  const stmts = [];
  if (patch.track) stmts.push(env.DB.prepare("UPDATE users SET track = ? WHERE id = ?").bind(patch.track, userId));
  if (patch.name !== undefined) stmts.push(env.DB.prepare("UPDATE users SET display_name = ? WHERE id = ?").bind(patch.name || null, userId));
  if (patch.timezone) stmts.push(env.DB.prepare("UPDATE users SET timezone = ? WHERE id = ?").bind(patch.timezone, userId));
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (patch.dailyMinutes !== undefined) { sets.push("daily_minutes = ?"); vals.push(patch.dailyMinutes); }
  if (patch.goal !== undefined) { sets.push("goal = ?"); vals.push(patch.goal); }
  if (patch.goalNote !== undefined) { sets.push("goal_note = ?"); vals.push(patch.goalNote); }
  if (sets.length) stmts.push(env.DB.prepare(`UPDATE learn_profiles SET ${sets.join(", ")}, updated_at = unixepoch() WHERE user_id = ?`).bind(...vals, userId));
  if (stmts.length) await env.DB.batch(stmts);
}

/** Owner (or admin) download of a submitted file. */
export async function getSubmissionFile(env: Env, userId: string, id: string, isAdmin: boolean) {
  const row = await env.DB.prepare("SELECT user_id, file_key, file_name, file_type FROM learn_submissions WHERE id = ?")
    .bind(id).first<{ user_id: string; file_key: string | null; file_name: string | null; file_type: string | null }>();
  if (!row || !row.file_key || (row.user_id !== userId && !isAdmin)) return null;
  const obj = await env.MEDIA.get(row.file_key);
  if (!obj) return null;
  return { obj, name: row.file_name ?? "file", type: row.file_type ?? "application/octet-stream" };
}

/** Review hook for future AI / human review. */
export async function reviewSubmission(env: Env, id: string, r: { status: SubmissionStatus; reviewer: string; feedback?: string | null }) {
  const res = await env.DB.prepare("UPDATE learn_submissions SET status = ?, reviewer = ?, feedback = ?, reviewed_at = unixepoch() WHERE id = ?")
    .bind(r.status, r.reviewer, r.feedback ?? null, id).run();
  return res.meta.changes > 0;
}

export async function listSubmissions(env: Env, status: SubmissionStatus | null, limit = 50) {
  const q = status
    ? env.DB.prepare("SELECT * FROM learn_submissions WHERE status = ? ORDER BY created_at DESC LIMIT ?").bind(status, limit)
    : env.DB.prepare("SELECT * FROM learn_submissions ORDER BY created_at DESC LIMIT ?").bind(limit);
  const rows = await q.all<SubmissionRow & { user_id: string; day: number; lang: Lang }>();
  return rows.results.map((r) => ({ ...submissionView(r), userId: r.user_id, day: r.day, taskId: r.task_id, lang: r.lang }));
}
