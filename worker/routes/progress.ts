import { Hono, type Context } from "hono";
import type { AppEnv } from "../env";
import type { Lang } from "../../shared/types";
import type { OnboardingResult, SubmissionStatus } from "../lib/learn/api-types";
import { TOTAL, isLang, isTrack } from "../lib/learn/content";
import { isValidTimeZone } from "../lib/learn/schedule";
import {
  GOALS, LearnError, completeDay, dayView, getSubmissionFile, listSubmissions, loadCtx, overview, profileOf,
  reviewSubmission, saveOnboarding, submitTask, uncheckTask, updateProfile, type ProofInput,
} from "../lib/learn/store";
import { requireAdmin } from "../lib/user";

// OWNER: learn. Student progress: onboarding, overview (today + path), day pages, task proofs, day completion.
export const progress = new Hono<AppEnv>();

progress.get("/health", (c) => c.json({ ok: true, area: "progress" }));

progress.onError((err, c) => {
  if (err instanceof LearnError) return c.json({ error: err.code, message: err.message }, err.status);
  console.error("progress error", err);
  return c.json({ error: "internal", message: "Something went wrong." }, 500);
});

const langOf = (c: Context<AppEnv>): Lang => {
  const l = c.req.query("lang");
  return isLang(l) ? l : "en";
};
const dayParam = (c: Context<AppEnv>) => {
  const n = Number(c.req.param("day"));
  if (!Number.isInteger(n) || n < 1 || n > TOTAL) throw new LearnError(404, "day_not_found");
  return n;
};
const clampMinutes = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(240, Math.max(15, n)) : 60;
};
const cleanText = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().replace(/\s+/g, " ").slice(0, max) : null);

/** GET /api/progress?lang= — everything Today + Path need. */
progress.get("/", async (c) => {
  const ctx = await loadCtx(c.env, c.get("userId"));
  return c.json(await overview(ctx, langOf(c)));
});

/** POST /api/progress/onboarding { lang, track, dailyMinutes, goal, goalNote?, name?, timezone? } */
progress.post("/onboarding", async (c) => {
  const b = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  if (!isTrack(b.track)) throw new LearnError(400, "track_required", "Pick a track: apps or video.");
  const lang = isLang(b.lang) ? b.lang : langOf(c);
  const before = await loadCtx(c.env, c.get("userId"));
  const awards = await saveOnboarding(c.env, c.get("userId"), {
    lang,
    track: b.track,
    dailyMinutes: clampMinutes(b.dailyMinutes),
    goal: GOALS.includes(b.goal as never) ? (b.goal as (typeof GOALS)[number]) : null,
    goalNote: cleanText(b.goalNote, 280),
    name: cleanText(b.name, 40),
    timezone: isValidTimeZone(b.timezone) ? b.timezone : null,
  }, !before.profile); // first full onboarding → onboarding.completed (game dedupes per user anyway)
  const ctx = await loadCtx(c.env, c.get("userId"));
  const body: OnboardingResult = { awards, overview: await overview(ctx, lang) };
  return c.json(body);
});

/** PATCH /api/progress/profile { track?, dailyMinutes?, goal?, goalNote?, name?, timezone? } */
progress.patch("/profile", async (c) => {
  const b = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  const ctx = await loadCtx(c.env, c.get("userId"));
  if (!profileOf(ctx)) throw new LearnError(409, "not_onboarded", "Finish onboarding first.");
  await updateProfile(c.env, c.get("userId"), {
    track: isTrack(b.track) ? b.track : undefined,
    dailyMinutes: b.dailyMinutes !== undefined ? clampMinutes(b.dailyMinutes) : undefined,
    goal: b.goal === undefined ? undefined : GOALS.includes(b.goal as never) ? (b.goal as (typeof GOALS)[number]) : null,
    goalNote: b.goalNote === undefined ? undefined : cleanText(b.goalNote, 280),
    name: b.name === undefined ? undefined : cleanText(b.name, 40),
    timezone: isValidTimeZone(b.timezone) ? b.timezone : undefined,
  });
  return c.json(await overview(await loadCtx(c.env, c.get("userId")), langOf(c)));
});

/** GET /api/progress/day/:day?lang= — day content + access + task states + next-day teaser. */
progress.get("/day/:day", async (c) => {
  const ctx = await loadCtx(c.env, c.get("userId"));
  return c.json(await dayView(ctx, langOf(c), dayParam(c)));
});

/**
 * POST /api/progress/day/:day/task/:taskId?lang=
 * JSON { text?, url? } or multipart/form-data { file, text? } for file proofs.
 */
progress.post("/day/:day/task/:taskId", async (c) => {
  const day = dayParam(c);
  const ct = c.req.header("content-type") ?? "";
  let input: ProofInput = {};
  if (ct.includes("multipart/form-data")) {
    const form = await c.req.formData();
    const file = form.get("file");
    input = {
      file: file && typeof file !== "string" ? (file as File) : undefined,
      text: typeof form.get("text") === "string" ? (form.get("text") as string) : undefined,
      url: typeof form.get("url") === "string" ? (form.get("url") as string) : undefined,
    };
  } else if (ct.includes("application/json")) {
    const b = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
    input = { text: typeof b.text === "string" ? b.text : undefined, url: typeof b.url === "string" ? b.url : undefined };
  }
  const ctx = await loadCtx(c.env, c.get("userId"));
  return c.json(await submitTask(ctx, langOf(c), day, c.req.param("taskId"), input));
});

/** DELETE /api/progress/day/:day/task/:taskId — un-check (only before the day is completed). */
progress.delete("/day/:day/task/:taskId", async (c) => {
  const ctx = await loadCtx(c.env, c.get("userId"));
  await uncheckTask(ctx, dayParam(c), c.req.param("taskId"));
  return c.json(await dayView(await loadCtx(c.env, c.get("userId")), langOf(c), dayParam(c)));
});

/** POST /api/progress/day/:day/complete — explicit completion (idempotent). */
progress.post("/day/:day/complete", async (c) => {
  const ctx = await loadCtx(c.env, c.get("userId"));
  return c.json(await completeDay(ctx, langOf(c), dayParam(c)));
});

/** GET /api/progress/files/:id — the student's own uploaded proof (admins can read any). */
progress.get("/files/:id", async (c) => {
  const isAdmin = !!c.env.ADMIN_TOKEN && c.req.header("x-admin-token") === c.env.ADMIN_TOKEN;
  const f = await getSubmissionFile(c.env, c.get("userId"), c.req.param("id"), isAdmin);
  if (!f) return c.json({ error: "not_found" }, 404);
  const inline = /^(image\/(png|jpeg|gif|webp|avif)|video\/[\w.+-]+|audio\/[\w.+-]+|application\/pdf)$/.test(f.type);
  return new Response(f.obj.body, {
    headers: {
      "content-type": f.type,
      "content-disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(f.name)}`,
      "cache-control": "private, max-age=3600",
      "x-content-type-options": "nosniff",
      "content-security-policy": "sandbox; default-src 'none'; img-src 'self'; media-src 'self'",
    },
  });
});

/** Admin: review queue + review hook (future AI review writes through the same function). */
progress.get("/submissions", requireAdmin, async (c) => {
  const s = c.req.query("status");
  const status = s === "submitted" || s === "approved" || s === "needs_work" ? (s as SubmissionStatus) : null;
  return c.json(await listSubmissions(c.env, status, Math.min(200, Number(c.req.query("limit")) || 50)));
});

progress.post("/submissions/:id/review", requireAdmin, async (c) => {
  const b = await c.req.json<{ status?: string; feedback?: string }>().catch(() => ({}) as { status?: string; feedback?: string });
  if (b.status !== "approved" && b.status !== "needs_work" && b.status !== "submitted") throw new LearnError(400, "bad_status");
  const ok = await reviewSubmission(c.env, c.req.param("id"), { status: b.status, reviewer: "human:admin", feedback: cleanText(b.feedback, 2000) });
  return ok ? c.json({ ok: true }) : c.json({ error: "not_found" }, 404);
});

/**
 * DEV ONLY (APP_ENV=dev): move your start date back N days (to demo catching up / tomorrow's day),
 * or reset your learn progress. Never available in production.
 */
progress.post("/dev/time-travel", async (c) => {
  if (c.env.APP_ENV !== "dev") return c.json({ error: "not_found" }, 404);
  const b = await c.req.json<{ days?: number }>().catch(() => ({}) as { days?: number });
  const days = Math.max(1, Math.min(66, Math.round(Number(b.days) || 1)));
  const id = c.get("userId");
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE users SET started_at = COALESCE(started_at, unixepoch()) - ? WHERE id = ?").bind(days * 86400, id),
    c.env.DB.prepare("UPDATE learn_day_progress SET completed_at = completed_at - ?, local_date = date(local_date, ?) WHERE user_id = ?").bind(days * 86400, `-${days} days`, id),
    c.env.DB.prepare("UPDATE learn_task_progress SET completed_at = completed_at - ? WHERE user_id = ?").bind(days * 86400, id),
  ]);
  return c.json(await overview(await loadCtx(c.env, id), langOf(c)));
});

progress.post("/dev/reset", async (c) => {
  if (c.env.APP_ENV !== "dev") return c.json({ error: "not_found" }, 404);
  const id = c.get("userId");
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM learn_day_progress WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM learn_task_progress WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM learn_submissions WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM learn_profiles WHERE user_id = ?").bind(id),
    c.env.DB.prepare("UPDATE users SET track = NULL, started_at = NULL WHERE id = ?").bind(id),
  ]);
  return c.json({ ok: true });
});
