-- OWNER: game agent. XP ledger, per-user stats, weekly leaderboard buckets, badges, daily activity.
-- Leaderboard reads only touch game_stats / game_weekly through covering indexes, so they stay fast at 100k+ users.

-- Every accepted game event, once. PK = idempotency key (user + event identity). Doubles as the XP ledger.
CREATE TABLE IF NOT EXISTS game_events (
  user_id    TEXT NOT NULL,
  event_key  TEXT NOT NULL,            -- e.g. "task:d07-apps-t2", "day:7", "onboarding", "res:abc"
  type       TEXT NOT NULL,            -- GameEvent["type"]
  xp         INTEGER NOT NULL DEFAULT 0,
  local_day  TEXT NOT NULL,            -- YYYY-MM-DD in the user's timezone when it happened
  payload    TEXT,                     -- JSON (the original event)
  awards     TEXT,                     -- JSON Award[] returned the first time (replayed on retries)
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, event_key)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS game_events_user_time ON game_events (user_id, created_at);

-- One row per user: the denormalised "current state" everything else reads.
CREATE TABLE IF NOT EXISTS game_stats (
  user_id         TEXT PRIMARY KEY,
  track           TEXT,                -- copy of users.track so leaderboards can filter by index
  xp              INTEGER NOT NULL DEFAULT 0,
  level           INTEGER NOT NULL DEFAULT 1,
  streak          INTEGER NOT NULL DEFAULT 0,
  streak_best     INTEGER NOT NULL DEFAULT 0,
  streak_last_day TEXT,                -- YYYY-MM-DD (user's timezone) of the last streak-counting activity
  freezes         INTEGER NOT NULL DEFAULT 0,
  counters        TEXT NOT NULL DEFAULT '{}', -- JSON: tasks, days, bosses, resources, renders, ... (badge rules)
  version         INTEGER NOT NULL DEFAULT 0, -- optimistic concurrency
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS game_stats_xp ON game_stats (xp DESC, updated_at);
CREATE INDEX IF NOT EXISTS game_stats_track_xp ON game_stats (track, xp DESC, updated_at);

-- XP earned per UTC ISO week (week leaderboard). One row per (week, user).
CREATE TABLE IF NOT EXISTS game_weekly (
  week       TEXT NOT NULL,            -- e.g. "2026-W45"
  user_id    TEXT NOT NULL,
  track      TEXT,
  xp         INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (week, user_id)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS game_weekly_xp ON game_weekly (week, xp DESC, updated_at);
CREATE INDEX IF NOT EXISTS game_weekly_track_xp ON game_weekly (week, track, xp DESC, updated_at);

CREATE TABLE IF NOT EXISTS game_badges (
  user_id    TEXT NOT NULL,
  badge_id   TEXT NOT NULL,
  awarded_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, badge_id)
) WITHOUT ROWID;

-- XP per local calendar day (profile heatmap).
CREATE TABLE IF NOT EXISTS game_activity (
  user_id TEXT NOT NULL,
  day     TEXT NOT NULL,               -- YYYY-MM-DD, user's timezone
  xp      INTEGER NOT NULL DEFAULT 0,
  events  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
) WITHOUT ROWID;
