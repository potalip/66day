-- OWNER: studio agent. Studio projects (one video idea each) and their render attempts.
CREATE TABLE IF NOT EXISTS studio_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL,
  style TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT '9x16' CHECK (format IN ('9x16','1x1','16x9')),
  lang TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('ru','en')),
  brief TEXT NOT NULL DEFAULT '',
  storyboard TEXT NOT NULL,                 -- JSON, see render-server/API.md
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','planning','rendering','rendered','failed')),
  plan_source TEXT NOT NULL DEFAULT 'example' CHECK (plan_source IN ('example','ai','manual')),
  plan_error TEXT,
  current_render_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS studio_projects_user ON studio_projects(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS studio_renders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  job_id TEXT,                              -- render server job id
  quality TEXT NOT NULL DEFAULT 'final' CHECK (quality IN ('final','draft')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','submitted','rendering','ingesting','done','failed','canceled')),
  progress REAL NOT NULL DEFAULT 0,
  stage TEXT,
  error TEXT,
  storyboard TEXT NOT NULL,                 -- snapshot that was rendered
  callback_origin TEXT,                     -- public origin of this Worker, for the render-server callback
  duration REAL,
  width INTEGER,
  height INTEGER,
  video_key TEXT,                           -- R2 keys once ingested
  thumb_key TEXT,
  contact_key TEXT,
  remote_video_url TEXT,                    -- render-server URLs (fallback if the R2 copy failed)
  remote_thumb_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  finished_at INTEGER
);
CREATE INDEX IF NOT EXISTS studio_renders_project ON studio_renders(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS studio_renders_job ON studio_renders(job_id);
