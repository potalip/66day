// OWNER: game agent. D1 persistence for the game engine. One optimistic-concurrency transaction per event.
import type { Award, Lang, Track } from "../../../shared/types";
import { emptyCounters } from "./badges";
import { CATALOG_BY_ID } from "./badges";
import { CURRICULUM, type CurriculumIndex } from "./curriculum";
import { eventKey, reduce, type AnyGameEvent, type GameState } from "./engine";
import { isoWeek, safeTz } from "./time";
import { loadWeek, pickQuests, questProgress } from "./quests";

export interface StatsRow {
  user_id: string;
  track: string | null;
  xp: number;
  level: number;
  streak: number;
  streak_best: number;
  streak_last_day: string | null;
  freezes: number;
  counters: string;
  version: number;
  updated_at: number;
}

export interface ApplyOptions {
  now?: Date;
  curriculum?: CurriculumIndex;
  /** max optimistic retries when two events for the same user race */
  retries?: number;
  /** don't evaluate weekly quests after this event (seeding / internal) */
  skipQuests?: boolean;
}

export async function loadStats(db: D1Database, userId: string): Promise<StatsRow | null> {
  return db.prepare("SELECT * FROM game_stats WHERE user_id = ?").bind(userId).first<StatsRow>();
}

export async function loadState(db: D1Database, userId: string): Promise<{ state: GameState; version: number; exists: boolean; tz: string; lang: Lang; userTrack: Track | null }> {
  const [stats, badges, user] = await db.batch([
    db.prepare("SELECT * FROM game_stats WHERE user_id = ?").bind(userId),
    db.prepare("SELECT badge_id FROM game_badges WHERE user_id = ?").bind(userId),
    db.prepare("SELECT timezone, track, lang FROM users WHERE id = ?").bind(userId),
  ]);
  const s = (stats.results[0] as StatsRow | undefined) ?? null;
  const u = user.results[0] as { timezone?: string; track?: Track; lang?: string } | undefined;
  let counters = emptyCounters();
  try {
    if (s) counters = { ...counters, ...JSON.parse(s.counters) };
  } catch { /* corrupted counters: start fresh */ }
  const userTrack = (u?.track as Track) ?? null;
  return {
    exists: !!s,
    version: s?.version ?? 0,
    tz: safeTz(u?.timezone),
    lang: u?.lang === "ru" ? "ru" : "en",
    userTrack,
    state: {
      xp: s?.xp ?? 0,
      level: s?.level ?? 1,
      track: userTrack ?? ((s?.track as Track) || null),
      streak: { streak: s?.streak ?? 0, best: s?.streak_best ?? 0, lastDay: s?.streak_last_day ?? null, freezes: s?.freezes ?? 0 },
      counters,
      badges: new Set((badges.results as { badge_id: string }[]).map((r) => r.badge_id)),
    },
  };
}

const isConflict = (e: unknown) => /malformed JSON|UNIQUE constraint|SQLITE_CONSTRAINT/i.test(String((e as Error)?.message ?? e));

/**
 * Apply one event. Idempotent: the (user, eventKey) row is the dedupe key; a retry returns the awards
 * recorded the first time. Concurrency: the whole write is one D1 batch (= one transaction) guarded by
 * a version check that aborts the batch if another event for this user committed in between.
 */
export async function applyEvent(db: D1Database, userId: string, ev: AnyGameEvent, opts: ApplyOptions = {}): Promise<Award[]> {
  const key = eventKey(ev); // throws InvalidEvent on garbage
  const now = opts.now ?? new Date();
  const retries = opts.retries ?? 8;

  for (let attempt = 0; ; attempt++) {
    const existing = await db.prepare("SELECT awards FROM game_events WHERE user_id = ? AND event_key = ?").bind(userId, key).first<{ awards: string | null }>();
    if (existing) return parseAwards(existing.awards);

    const { state, version, exists, tz, lang } = await loadState(db, userId);
    const out = reduce(state, ev, { now, tz, lang, curriculum: opts.curriculum ?? CURRICULUM, catalog: CATALOG_BY_ID });
    const s = out.state;
    const ts = Math.floor(now.getTime() / 1000);
    const week = isoWeek(now);

    const stmts: D1PreparedStatement[] = [
      // Guard: json('x') raises → batch rolls back if someone else bumped the version meanwhile.
      exists
        ? db.prepare("SELECT CASE WHEN (SELECT version FROM game_stats WHERE user_id = ?1) = ?2 THEN 1 ELSE json('x') END").bind(userId, version)
        : db.prepare("SELECT CASE WHEN (SELECT COUNT(*) FROM game_stats WHERE user_id = ?1) = 0 THEN 1 ELSE json('x') END").bind(userId),
      // Plain INSERT: a duplicate key also aborts the batch.
      db.prepare("INSERT INTO game_events (user_id, event_key, type, xp, local_day, payload, awards, created_at) VALUES (?,?,?,?,?,?,?,?)")
        .bind(userId, key, ev.type, out.xp, out.localDay, JSON.stringify(ev).slice(0, 2000), JSON.stringify(out.awards), ts),
      db.prepare(
        `INSERT INTO game_stats (user_id, track, xp, level, streak, streak_best, streak_last_day, freezes, counters, version, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,1,?10)
         ON CONFLICT(user_id) DO UPDATE SET track=?2, xp=?3, level=?4, streak=?5, streak_best=?6, streak_last_day=?7,
           freezes=?8, counters=?9, version=version+1, updated_at=?10`,
      ).bind(userId, s.track, s.xp, s.level, s.streak.streak, s.streak.best, s.streak.lastDay, s.streak.freezes, JSON.stringify(s.counters), ts),
    ];
    if (out.xp > 0) {
      stmts.push(
        db.prepare(
          `INSERT INTO game_weekly (week, user_id, track, xp, updated_at) VALUES (?1,?2,?3,?4,?5)
           ON CONFLICT(week, user_id) DO UPDATE SET xp = xp + ?4, track = ?3, updated_at = ?5`,
        ).bind(week, userId, s.track, out.xp, ts),
      );
    } else if (s.track !== state.track) {
      stmts.push(db.prepare("UPDATE game_weekly SET track = ? WHERE week = ? AND user_id = ?").bind(s.track, week, userId));
    }
    if (out.xp > 0) stmts.push(
      db.prepare(
        `INSERT INTO game_activity (user_id, day, xp, events) VALUES (?1,?2,?3,1)
         ON CONFLICT(user_id, day) DO UPDATE SET xp = xp + ?3, events = events + 1`,
      ).bind(userId, out.localDay, out.xp),
    );
    for (const b of out.newBadges) {
      stmts.push(db.prepare("INSERT OR IGNORE INTO game_badges (user_id, badge_id, awarded_at) VALUES (?,?,?)").bind(userId, b, ts));
    }

    try {
      await db.batch(stmts);
      if (ev.type === "quest.completed" || ev.type === "lesson.viewed" || opts.skipQuests) return out.awards;
      return [...out.awards, ...(await checkQuests(db, userId, now, opts))];
    } catch (e) {
      if (!isConflict(e) || attempt >= retries) throw e;
      // Lost a race (or a concurrent duplicate): back off with jitter, reload and try again;
      // the dedupe check at the top handles duplicates.
      await new Promise((r) => setTimeout(r, Math.random() * 15 * (attempt + 1)));
    }
  }
}

/** Complete any weekly quest whose goal is now met. Each completion is its own idempotent event. */
export async function checkQuests(db: D1Database, userId: string, now: Date, opts: ApplyOptions = {}): Promise<Award[]> {
  try {
    const u = await db.prepare("SELECT s.track AS st, u.track AS ut, u.lang AS lang FROM users u LEFT JOIN game_stats s ON s.user_id = u.id WHERE u.id = ?")
      .bind(userId).first<{ st: Track | null; ut: Track | null; lang: string | null }>();
    const track = u?.ut ?? u?.st ?? null;
    const lang = u?.lang === "ru" ? "ru" : "en";
    const wk = await loadWeek(db, userId, now, opts.curriculum);
    const awards: Award[] = [];
    for (const q of pickQuests(wk.week, track)) {
      if (wk.done.has(q.id) || questProgress(q, wk.events) < q.goal.target) continue;
      awards.push(...(await applyEvent(db, userId, { type: "quest.completed", questId: q.id, week: wk.week, xp: q.xp, title: q.title[lang] }, { ...opts, now })));
    }
    return awards;
  } catch (e) {
    console.error("game: quest check failed", e);
    return [];
  }
}

function parseAwards(s: string | null): Award[] {
  try {
    const v = JSON.parse(s ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Keep the denormalised track in sync when the user switches tracks (cheap; called on reads of /me). */
export async function syncTrack(db: D1Database, userId: string, track: Track | null, current: string | null, now = new Date()) {
  if (!track || track === current) return;
  await db.batch([
    db.prepare("UPDATE game_stats SET track = ? WHERE user_id = ?").bind(track, userId),
    db.prepare("UPDATE game_weekly SET track = ? WHERE week = ? AND user_id = ?").bind(track, isoWeek(now), userId),
  ]);
}
