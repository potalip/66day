-- OWNER: learn. Public portfolio: per-task overrides chosen by the student.
-- Items themselves are the latest submission per task (learn_submissions). Rows here only exist when the student changed
-- something; without a row, visibility defaults to public for boss days / ship tasks and private for everything else.
CREATE TABLE IF NOT EXISTS learn_portfolio_items (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id      TEXT NOT NULL,
  visibility   TEXT CHECK (visibility IN ('public','private')),
  title        TEXT,
  description  TEXT,
  sort         INTEGER,
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, task_id)
);
