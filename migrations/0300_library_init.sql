-- OWNER: library agent. Library + smart resource pipeline.
-- JSON columns hold arrays/objects as TEXT (validated in worker/lib/library/schema.ts).

-- One row per external or uploaded resource.
CREATE TABLE IF NOT EXISTS lib_resources (
  id TEXT PRIMARY KEY,                         -- short slug-ish id, e.g. "r_k3j9x2"
  source_type TEXT NOT NULL CHECK (source_type IN ('youtube','instagram','link','upload')),
  url TEXT,                                    -- original URL (NULL for pure uploads)
  canonical_url TEXT UNIQUE,                   -- normalized URL used for de-duplication
  external_id TEXT,                            -- YouTube video id / Instagram shortcode
  title TEXT NOT NULL DEFAULT '',
  author TEXT,
  author_url TEXT,
  description TEXT,
  duration_sec INTEGER,
  thumbnail_url TEXT,
  tracks TEXT NOT NULL DEFAULT '[]',           -- JSON: subset of ["common","apps","video"]
  topics TEXT NOT NULL DEFAULT '[]',           -- JSON: topic slugs (see TOPICS in schema.ts)
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced')),
  orig_lang TEXT NOT NULL DEFAULT 'en',        -- language of the original: ru | en | other
  audience TEXT NOT NULL DEFAULT '["ru","en"]',-- JSON: which student languages see it
  suggested_days TEXT NOT NULL DEFAULT '[]',   -- JSON: [{ "day": 12, "track": "apps" }]
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','processing','review','published','failed')),
  transcript_state TEXT NOT NULL DEFAULT 'none'
    CHECK (transcript_state IN ('none','fetching','ready','needed','not_applicable')),
  ai_state TEXT NOT NULL DEFAULT 'idle'
    CHECK (ai_state IN ('idle','queued','generating','ready','partial','failed','not_configured')),
  last_error TEXT,
  admin_notes TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  sort_weight INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  published_at INTEGER
);
CREATE INDEX IF NOT EXISTS lib_resources_status ON lib_resources (status, published_at DESC);

-- Transcript / source text (one per resource; latest wins). Large files also kept in R2 MEDIA.
CREATE TABLE IF NOT EXISTS lib_transcripts (
  resource_id TEXT PRIMARY KEY REFERENCES lib_resources(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('youtube_captions','manual','upload','media_worker','page_text')),
  lang TEXT,
  text TEXT NOT NULL,
  r2_key TEXT,
  chars INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Generated lesson material, one row per resource per student language (RU and EN are adaptations).
CREATE TABLE IF NOT EXISTS lib_materials (
  resource_id TEXT NOT NULL REFERENCES lib_resources(id) ON DELETE CASCADE,
  lang TEXT NOT NULL CHECK (lang IN ('ru','en')),
  state TEXT NOT NULL DEFAULT 'empty'
    CHECK (state IN ('empty','queued','generating','ready','failed','not_configured')),
  data TEXT,                                   -- JSON LessonMaterial (schema.ts)
  origin TEXT CHECK (origin IN ('ai','fixture','manual')),
  model TEXT,
  edited INTEGER NOT NULL DEFAULT 0,           -- founder touched it after generation
  error TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (resource_id, lang)
);

-- Pipeline log: every step is visible with a status in the admin board.
CREATE TABLE IF NOT EXISTS lib_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id TEXT NOT NULL REFERENCES lib_resources(id) ON DELETE CASCADE,
  step TEXT NOT NULL,                          -- created | metadata | transcript | build_lesson:ru | publish | ...
  status TEXT NOT NULL CHECK (status IN ('info','ok','warn','error')),
  message TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS lib_events_resource ON lib_events (resource_id, id DESC);

-- Curated collections ("Start here", "Video with code"...).
CREATE TABLE IF NOT EXISTS lib_collections (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS lib_collection_items (
  collection_id TEXT NOT NULL REFERENCES lib_collections(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES lib_resources(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, resource_id)
);

-- Student's personal list: "add to today" + done marks. The learn area can read this later.
CREATE TABLE IF NOT EXISTS lib_user_items (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES lib_resources(id) ON DELETE CASCADE,
  for_date TEXT,                               -- YYYY-MM-DD the student planned it for (UTC)
  done_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, resource_id)
);
