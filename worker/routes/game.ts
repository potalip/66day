import { Hono } from "hono";
import type { AppEnv } from "../env";
import type { GameEvent } from "../../shared/types";
import { onGameEvent, onLessonViewed } from "../lib/game";
import { badgeCatalog, getCertificate, getLeaderboard, getMe, getProfile, getQuests, type Period, type TrackFilter } from "../lib/game/queries";
import { syncTrack, loadStats } from "../lib/game/store";
import { seedDemo, clearDemo } from "../lib/game/seed";
import { safeTz } from "../lib/game/time";
import { xpForLevel } from "../lib/game/levels";

// OWNER: game agent (see docs/OWNERSHIP.md).
export const game = new Hono<AppEnv>();

const isDev = (env: { APP_ENV?: string }) => env.APP_ENV === "dev" || env.APP_ENV === "local" || env.APP_ENV === "test";

game.get("/health", (c) => c.json({ ok: true, area: "game", dev: isDev(c.env) }));

/** Current student's game state: level, progress, streak, freezes, badges, ranks, 66-day activity. */
game.get("/me", async (c) => {
  const id = c.get("userId");
  const me = await getMe(c.env.DB, id);
  // keep the leaderboard's copy of the track fresh if the student switched tracks
  const s = await loadStats(c.env.DB, id);
  if (s && me.track && s.track !== me.track) c.executionCtx.waitUntil?.(syncTrack(c.env.DB, id, me.track, s.track));
  return c.json(me);
});

/** Badge catalog (built-ins merged with content/badges.json), localised titles for both languages. */
game.get("/badges", (c) => {
  c.header("cache-control", "public, max-age=300");
  return c.json(badgeCatalog());
});

/** Level curve table (for UI explanations). */
game.get("/levels", (c) => c.json(Array.from({ length: 30 }, (_, i) => ({ level: i + 1, xp: xpForLevel(i + 1) }))));

game.get("/leaderboard", async (c) => {
  const period: Period = c.req.query("period") === "all" ? "all" : "week";
  const t = c.req.query("track");
  const track: TrackFilter = t === "apps" || t === "video" ? t : "all";
  const limit = Math.min(100, Math.max(5, Number(c.req.query("limit")) || 50));
  return c.json(await getLeaderboard(c.env.DB, c.get("userId"), period, track, limit));
});

game.get("/profile/:userId", async (c) => {
  const userId = c.req.param("userId");
  if (!/^[\w-]{1,64}$/.test(userId)) return c.json({ error: "not_found" }, 404);
  const p = await getProfile(c.env.DB, userId, c.get("userId"));
  return p ? c.json(p) : c.json({ error: "not_found" }, 404);
});

/** This week's quests for the current student, with progress. */
game.get("/quests", async (c) => c.json(await getQuests(c.env.DB, c.get("userId"))));

/** Public, verifiable certificate data (complete after day 66; "in progress" before). */
game.get("/certificate/:userId", async (c) => {
  const userId = c.req.param("userId");
  if (!/^[\w-]{1,64}$/.test(userId)) return c.json({ error: "not_found" }, 404);
  const cert = await getCertificate(c.env.DB, userId);
  return cert ? c.json(cert) : c.json({ error: "not_found" }, 404);
});

/** The browser tells us its IANA timezone so streak days follow the student's local midnight. */
game.put("/timezone", async (c) => {
  const body = await c.req.json<{ tz?: string }>().catch(() => ({}) as { tz?: string });
  const tz = typeof body.tz === "string" ? body.tz.slice(0, 64) : "";
  if (!tz || safeTz(tz) !== tz) return c.json({ error: "invalid_timezone" }, 400);
  await c.env.DB.prepare("UPDATE users SET timezone = ? WHERE id = ?").bind(tz, c.get("userId")).run();
  return c.json({ ok: true, tz });
});

/**
 * The client reports which lesson language was opened (zero XP; powers the secret "polyglot" badge).
 * Prefer calling `onLessonViewed()` server-side where the lesson is served; this endpoint is the client fallback.
 */
game.post("/lesson-viewed", async (c) => {
  const body = await c.req.json<{ day?: number; lang?: string }>().catch(() => ({}) as { day?: number; lang?: string });
  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > 66 || (body.lang !== "en" && body.lang !== "ru")) return c.json({ error: "invalid" }, 400);
  return c.json({ awards: await onLessonViewed(c.env, c.get("userId"), day, body.lang) });
});

// ---- dev only -------------------------------------------------------------------------------
/** Fire a game event for the current user (dev only — in prod, events come from the learn/library/studio routes). */
game.post("/dev/event", async (c) => {
  if (!isDev(c.env)) return c.json({ error: "not_found" }, 404);
  const ev = await c.req.json<GameEvent>();
  return c.json({ awards: await onGameEvent(c.env, c.get("userId"), ev) });
});

/**
 * Move the current user's game history N days into the past (pair with POST /api/progress/dev/time-travel)
 * so the next action happens on a "new day" — for demoing streaks, freezes and recaps.
 */
game.post("/dev/time-travel", async (c) => {
  if (!isDev(c.env)) return c.json({ error: "not_found" }, 404);
  const b = await c.req.json<{ days?: number }>().catch(() => ({}) as { days?: number });
  const days = Math.max(1, Math.min(66, Math.round(Number(b.days) || 1)));
  const id = c.get("userId");
  const shift = `-${days} days`;
  const db = c.env.DB;
  await db.batch([
    db.prepare("UPDATE game_events SET created_at = created_at - ?, local_day = date(local_day, ?) WHERE user_id = ?").bind(days * 86400, shift, id),
    db.prepare("UPDATE game_activity SET day = 'x' || day WHERE user_id = ?").bind(id),
    db.prepare("UPDATE game_activity SET day = date(substr(day, 2), ?) WHERE user_id = ?").bind(shift, id),
    db.prepare("UPDATE game_stats SET streak_last_day = date(streak_last_day, ?) WHERE user_id = ? AND streak_last_day IS NOT NULL").bind(shift, id),
    db.prepare("UPDATE game_badges SET awarded_at = awarded_at - ? WHERE user_id = ?").bind(days * 86400, id),
  ]);
  return c.json(await getMe(db, id));
});

game.post("/dev/seed", async (c) => {
  if (!isDev(c.env)) return c.json({ error: "not_found" }, 404);
  return c.json(await seedDemo(c.env.DB));
});

game.delete("/dev/seed", async (c) => {
  if (!isDev(c.env)) return c.json({ error: "not_found" }, 404);
  await clearDemo(c.env.DB);
  return c.json({ ok: true });
});
