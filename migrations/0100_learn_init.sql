-- OWNER: learn agent. Student progress through the 66-day program.
-- Content itself is NOT in the DB: it's compiled from /content into shared/curriculum.generated.json.

-- Onboarding answers (track + display_name + timezone + started_at live on `users`).
CREATE TABLE IF NOT EXISTS learn_profiles (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_minutes  INTEGER NOT NULL DEFAULT 60,
  goal           TEXT,                 -- preset key: portfolio | job | project | habit | curious
  goal_note      TEXT,                 -- optional free text, the student's own words
  onboarded_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Every proof a student submits (history kept; latest per task is the current one).
-- Reviewable: AI/human review later flips status and writes reviewer + feedback.
CREATE TABLE IF NOT EXISTS learn_submissions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day          INTEGER NOT NULL,
  task_id      TEXT NOT NULL,
  lang         TEXT NOT NULL CHECK (lang IN ('ru','en')),
  proof_type   TEXT NOT NULL CHECK (proof_type IN ('none','link','text','file')),
  text_value   TEXT,
  url_value    TEXT,
  file_key     TEXT,                   -- R2 key in MEDIA
  file_name    TEXT,
  file_type    TEXT,
  file_size    INTEGER,
  status       TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','needs_work')),
  reviewer     TEXT,                   -- 'auto' | 'ai:<model>' | 'human:<userId>'
  feedback     TEXT,
  reviewed_at  INTEGER,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS learn_submissions_user_task ON learn_submissions (user_id, task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS learn_submissions_review ON learn_submissions (status, created_at);

-- A task counts as done once a valid proof is submitted (review does not block progress).
CREATE TABLE IF NOT EXISTS learn_task_progress (
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id        TEXT NOT NULL,
  day            INTEGER NOT NULL,
  xp             INTEGER NOT NULL DEFAULT 0,
  submission_id  TEXT,
  completed_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, task_id)
);
CREATE INDEX IF NOT EXISTS learn_task_progress_day ON learn_task_progress (user_id, day);

-- Completed days. local_date = calendar date in the user's timezone at completion (pace + streak logic).
CREATE TABLE IF NOT EXISTS learn_day_progress (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day           INTEGER NOT NULL CHECK (day BETWEEN 1 AND 66),
  track         TEXT NOT NULL,          -- content track completed: common | apps | video
  completed_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  local_date    TEXT NOT NULL,          -- YYYY-MM-DD
  PRIMARY KEY (user_id, day)
);
