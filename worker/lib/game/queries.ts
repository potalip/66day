// OWNER: game agent. Read models for /api/game/*. Every query is an indexed lookup or an index-ordered LIMIT scan.
import type { Track } from "../../../shared/types";
import { CATALOG } from "./badges";
import { bossTitle, CURRICULUM, isBossDay } from "./curriculum";
import { levelProgress, rankFor } from "./levels";
import { loadStats, type StatsRow } from "./store";
import { MAX_FREEZES, viewStreak } from "./streak";
import { addDays, daysBetween, isoWeek, localDay, safeTz, weekResetsAt } from "./time";
import type { ActivityCell, BadgeInfo, EarnedBadge, GameMe, LeaderboardResponse, LeaderRow, LevelInfo, PublicProfile, ShippedItem, StreakInfo, WeeklyRecap } from "./types";

interface UserRow { id: string; display_name: string | null; track: Track | null; timezone: string | null; started_at: number | null; created_at: number }

export const badgeCatalog = (): BadgeInfo[] =>
  CATALOG.map(({ id, icon, title, description, group, secret }) => ({ id, icon, title, description, group, secret: !!secret }));

function levelInfo(xp: number): LevelInfo {
  const p = levelProgress(xp);
  return { ...p, rank: rankFor(p.level) };
}

function streakInfo(s: StatsRow | null, today: string): StreakInfo {
  const v = viewStreak({ streak: s?.streak ?? 0, best: s?.streak_best ?? 0, lastDay: s?.streak_last_day ?? null, freezes: s?.freezes ?? 0 }, today);
  return { ...v, maxFreezes: MAX_FREEZES };
}

async function badgesOf(db: D1Database, userId: string): Promise<EarnedBadge[]> {
  const r = await db.prepare("SELECT badge_id, awarded_at FROM game_badges WHERE user_id = ? ORDER BY awarded_at").bind(userId).all<{ badge_id: string; awarded_at: number }>();
  return r.results.map((b) => ({ id: b.badge_id, awardedAt: b.awarded_at }));
}

/** 66 cells starting at the student's first day (start date, else first activity, else today). */
async function activityOf(db: D1Database, u: UserRow, tz: string, today: string): Promise<ActivityCell[]> {
  const first = await db.prepare("SELECT MIN(day) d FROM game_activity WHERE user_id = ?").bind(u.id).first<{ d: string | null }>();
  const candidates = [u.started_at ? localDay(new Date(u.started_at * 1000), tz) : null, first?.d ?? null].filter(Boolean) as string[];
  const start = candidates.length ? candidates.sort()[0] : today;
  const end = addDays(start, 65);
  const rows = await db.prepare("SELECT day, xp FROM game_activity WHERE user_id = ? AND day BETWEEN ? AND ?").bind(u.id, start, end).all<{ day: string; xp: number }>();
  const map = new Map(rows.results.map((r) => [r.day, r.xp]));
  return Array.from({ length: 66 }, (_, i) => {
    const day = addDays(start, i);
    return { day, xp: map.get(day) ?? 0, index: i + 1 };
  });
}

async function getUser(db: D1Database, id: string) {
  return db.prepare("SELECT id, display_name, track, timezone, started_at, created_at FROM users WHERE id = ?").bind(id).first<UserRow>();
}

export async function getMe(db: D1Database, userId: string, now = new Date()): Promise<GameMe> {
  const u = (await getUser(db, userId)) ?? { id: userId, display_name: null, track: null, timezone: "UTC", started_at: null, created_at: 0 };
  const tz = safeTz(u.timezone);
  const today = localDay(now, tz);
  const week = isoWeek(now);
  const s = await loadStats(db, userId);
  const xp = s?.xp ?? 0;
  // (track falls back to the game's copy when users.track is unset)
  const weekRow = await db.prepare("SELECT xp FROM game_weekly WHERE week = ? AND user_id = ?").bind(week, userId).first<{ xp: number }>();
  const weekXp = weekRow?.xp ?? 0;
  const [allRank, weekRank] = await Promise.all([
    xp > 0 ? db.prepare("SELECT COUNT(*) n FROM game_stats WHERE xp > ?").bind(xp).first<{ n: number }>() : null,
    weekXp > 0 ? db.prepare("SELECT COUNT(*) n FROM game_weekly WHERE week = ? AND xp > ?").bind(week, weekXp).first<{ n: number }>() : null,
  ]);
  return {
    userId,
    name: u.display_name,
    track: u.track ?? ((s?.track as Track | null) || null),
    timezone: tz,
    today,
    ...levelInfo(xp),
    streak: streakInfo(s, today),
    badges: await badgesOf(db, userId),
    weekXp,
    ranks: { all: allRank ? allRank.n + 1 : null, week: weekRank ? weekRank.n + 1 : null },
    activity: await activityOf(db, u, tz, today),
    recap: await weeklyRecap(db, userId, today, now),
  };
}

export async function getProfile(db: D1Database, userId: string, viewerId: string, now = new Date()): Promise<PublicProfile | null> {
  const u = await getUser(db, userId);
  if (!u) return null;
  const tz = safeTz(u.timezone);
  const today = localDay(now, tz);
  const s = await loadStats(db, userId);
  return {
    userId,
    name: u.display_name,
    track: u.track,
    isMe: userId === viewerId,
    joinedAt: u.created_at,
    ...levelInfo(s?.xp ?? 0),
    streak: streakInfo(s, today),
    badges: await badgesOf(db, userId),
    activity: await activityOf(db, u, tz, today),
    shipped: await shippedOf(db, userId, u.track ?? ((s?.track as Track | null) || null)),
    recap: userId === viewerId ? await weeklyRecap(db, userId, today, now) : null,
  };
}

const safeUrl = (v: unknown): string | null => {
  if (typeof v !== "string" || v.length > 500) return null;
  try {
    const url = new URL(v);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
};

/**
 * Shipped work = completed boss days + completed "ship" tasks. Proof links come from the event payload
 * (`proofUrl`) or, if the learn area's submissions table exists, the latest link submitted for that task.
 */
async function shippedOf(db: D1Database, userId: string, track: Track | null): Promise<ShippedItem[]> {
  const r = await db
    .prepare("SELECT event_key, type, payload, created_at FROM game_events WHERE user_id = ? AND type IN ('task.completed','day.completed') ORDER BY created_at DESC LIMIT 400")
    .bind(userId)
    .all<{ event_key: string; type: string; payload: string | null; created_at: number }>();
  const links = await proofLinks(db, userId);
  const out: ShippedItem[] = [];
  for (const e of r.results) {
    let p: Record<string, unknown> = {};
    try { p = JSON.parse(e.payload ?? "{}"); } catch { /* ignore */ }
    const day = typeof p.day === "number" ? p.day : null;
    if (e.type === "day.completed" && day && isBossDay(CURRICULUM, day, track)) {
      out.push({ kind: "boss", key: e.event_key, day, title: bossTitle(CURRICULUM, day, track), url: safeUrl(p.proofUrl) ?? links.day.get(day) ?? null, at: e.created_at });
    } else if (e.type === "task.completed" && CURRICULUM.taskType.get(String(p.taskId)) === "ship") {
      out.push({ kind: "ship", key: e.event_key, day, title: CURRICULUM.titles.get(`task:${p.taskId}`) ?? {}, url: safeUrl(p.proofUrl) ?? links.task.get(String(p.taskId)) ?? null, at: e.created_at });
    }
  }
  return out.slice(0, 30);
}

/** Read-only peek at learn's submissions (if that table exists) for public proof links. */
async function proofLinks(db: D1Database, userId: string) {
  const task = new Map<string, string>();
  const day = new Map<number, string>();
  try {
    const r = await db
      .prepare("SELECT task_id, day, url_value FROM learn_submissions WHERE user_id = ? AND url_value IS NOT NULL ORDER BY created_at ASC LIMIT 500")
      .bind(userId)
      .all<{ task_id: string; day: number; url_value: string }>();
    for (const x of r.results) {
      const u = safeUrl(x.url_value);
      if (!u) continue;
      task.set(x.task_id, u);
      day.set(x.day, u);
    }
  } catch { /* learn tables not present */ }
  return { task, day };
}

/** Last 7 local days (incl. today) vs the 7 before. */
export async function weeklyRecap(db: D1Database, userId: string, today: string, now = new Date()): Promise<WeeklyRecap> {
  const from = addDays(today, -6);
  const prevFrom = addDays(today, -13);
  const [act, tasks, badges] = await db.batch([
    db.prepare("SELECT day, xp FROM game_activity WHERE user_id = ? AND day BETWEEN ? AND ?").bind(userId, prevFrom, today),
    db.prepare("SELECT COUNT(*) n FROM game_events WHERE user_id = ? AND type = 'task.completed' AND local_day BETWEEN ? AND ?").bind(userId, from, today),
    db.prepare("SELECT badge_id FROM game_badges WHERE user_id = ? AND awarded_at >= ? ORDER BY awarded_at").bind(userId, Math.floor(now.getTime() / 1000) - 7 * 86400),
  ]);
  const rows = act.results as { day: string; xp: number }[];
  const cur = rows.filter((r) => r.day >= from);
  const prev = rows.filter((r) => r.day < from);
  const best = cur.reduce<{ day: string; xp: number } | null>((b, r) => (!b || r.xp > b.xp ? r : b), null);
  return {
    from,
    to: today,
    xp: cur.reduce((n, r) => n + r.xp, 0),
    prevXp: prev.reduce((n, r) => n + r.xp, 0),
    activeDays: cur.filter((r) => r.xp > 0).length,
    tasks: (tasks.results[0] as { n: number }).n,
    badges: (badges.results as { badge_id: string }[]).map((b) => b.badge_id),
    bestDay: best && best.xp > 0 ? best : null,
    days: Array.from({ length: 7 }, (_, i) => {
      const d = addDays(from, i);
      return { day: d, xp: cur.find((r) => r.day === d)?.xp ?? 0 };
    }),
  };
}

export type Period = "week" | "all";
export type TrackFilter = "all" | Track;

/** Approximate "current streak" for leaderboard rows: alive if active within the last 2 UTC days. */
const liveStreak = (streak: number, last: string | null, today: string) => (last && daysBetween(last, today) <= 2 ? streak : 0);

export async function getLeaderboard(
  db: D1Database, viewerId: string, period: Period, track: TrackFilter, limit = 50, now = new Date(),
): Promise<LeaderboardResponse> {
  const week = isoWeek(now);
  const today = now.toISOString().slice(0, 10);
  const tf = track === "all" ? "" : " AND x.track = ?";
  const params: unknown[] = period === "week" ? [week] : [];
  if (track !== "all") params.push(track);

  const from =
    period === "week"
      ? `FROM game_weekly x JOIN game_stats s ON s.user_id = x.user_id WHERE x.week = ? AND x.xp > 0${tf}`
      : `FROM game_stats x WHERE x.xp > 0${tf}`;
  const select =
    period === "week"
      ? "SELECT x.user_id, x.xp, s.level, x.track, s.streak, s.streak_last_day, u.display_name"
      : "SELECT x.user_id, x.xp, x.level, x.track, x.streak, x.streak_last_day, u.display_name";
  const fromWithUser = from.replace(" WHERE", " JOIN users u ON u.id = x.user_id WHERE");

  type Row = { user_id: string; xp: number; level: number; track: Track | null; streak: number; streak_last_day: string | null; display_name: string | null };
  const toRow = (r: Row, rank: number): LeaderRow => ({
    rank, userId: r.user_id, name: r.display_name, xp: r.xp, level: r.level, track: r.track,
    streak: liveStreak(r.streak, r.streak_last_day, today), isMe: r.user_id === viewerId,
  });

  const [list, total, mine] = await db.batch([
    db.prepare(`${select} ${fromWithUser} ORDER BY x.xp DESC, x.updated_at ASC LIMIT ?`).bind(...params, limit),
    db.prepare(`SELECT COUNT(*) n ${from}`).bind(...params),
    db.prepare(`${select} ${fromWithUser} AND x.user_id = ?`).bind(...params, viewerId),
  ]);

  // Competition ranking: ties share a rank.
  const rows: LeaderRow[] = [];
  (list.results as Row[]).forEach((r, i) => {
    const prev = rows[i - 1];
    rows.push(toRow(r, prev && prev.xp === r.xp ? prev.rank : i + 1));
  });

  let me: LeaderRow | null = rows.find((r) => r.isMe) ?? null;
  const myRow = (mine.results as Row[])[0];
  if (!me && myRow) {
    const ahead = await db.prepare(`SELECT COUNT(*) n ${from} AND x.xp > ?`).bind(...params, myRow.xp).first<{ n: number }>();
    me = toRow(myRow, (ahead?.n ?? 0) + 1);
  }
  return {
    period, track, week,
    resetsAt: Math.floor(weekResetsAt(now).getTime() / 1000),
    total: (total.results[0] as { n: number }).n,
    rows,
    me,
  };
}
