-- OWNER: orchestrator. Agents: never edit; add your own numbered migration (see docs/OWNERSHIP.md).
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  lang TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('ru','en')),
  track TEXT CHECK (track IN ('apps','video')),
  started_at INTEGER,               -- unix seconds; day N of the 66 = derived from this + completions
  timezone TEXT DEFAULT 'UTC',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
