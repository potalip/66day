# Library + smart resource pipeline — report

## Round 2 (founder intake, media worker, kit)

### Founder's daily flow (`/:lang/admin`)
1. **Add resources**: paste any text with links. A server-side preview (`POST /api/pipeline/check`, the same parser as
   intake) lists every link with its type and marks ones **already in the library** (with a link to them); ✕ skips one.
   Batch settings apply to all links: tracks, level, lesson languages, **curriculum days**, and a note for Claude.
2. **Live batch tracker** next to the paste box (`GET /api/pipeline/batch?ids=`). Each resource shows five steps,
   Fetch → Transcript → RU lesson → EN lesson → Publish, each one done / in progress / needs you / failed / skipped /
   "your turn", plus a one-line instruction when the founder must act ("needs a transcript…", "starter draft only…").
   Step logic is in `worker/lib/library/progress.ts`, with tests. The batch is remembered in localStorage.
3. **Pipeline board**: status filters with counts, a compact stepper per row, the attention line, live refresh while
   anything runs, and **multi-select bulk actions** (publish / unpublish / rebuild / delete) via `POST /api/admin/bulk`.
4. **Review**: RU | EN editors side by side as before, plus a **review queue** ("2 of 5 in review", previous / next,
   **Publish & next**) and a **curriculum-aware day picker**. It shows real day titles from the learn area's
   `/api/curriculum/program`, with Common / Apps / Video tabs, and falls back to a number input if that's unavailable.
5. **Guide** tab: a short how-to in EN and RU (the four moves, what to do when something needs you, a 2-minute lesson
   checklist, tips).
6. Claude now also gets the **real curriculum day titles** (lazy import of learn's compiled content), so suggested days
   match actual lessons. RU prompt terminology is aligned with the program («ИИ-агент», not «coding-агент»).

### Media worker (`media-worker/`, Python)
FastAPI service: `POST /v1/transcribe` (bearer, 202 + in-memory queue). Each job:
- downloads the uploaded file from the Worker, or audio only via yt-dlp for platforms in `YTDLP_SOURCES` (default `youtube`;
  Instagram is off because of the login wall and its terms);
- converts with ffmpeg to 16 kHz mono mp3 in 20-min parts;
- transcribes with the OpenAI API, faster-whisper or the `fake` backend;
- joins segments into paragraphs and calls back with retries, always (ok or a readable error).

Includes a Dockerfile, README (local run, AWS App Runner/ECS deploy, costs), and 11 pytest tests (real ffmpeg, fake
backend). **Verified end to end locally**: upload without transcript → Worker → media worker → source download → callback
→ transcript saved → lessons queued.
**Not verified**: `docker build`, because the sandbox has no Docker daemon. The Dockerfile is standard python-slim + ffmpeg.

### Design QA (`docs/requests/design-to-library.md`), all addressed
- Cards and resource page show **video length** (▶ 4 min) separately from **lesson time** ("Lesson 25 min").
- RU copy uses «ИИ-агент». Seed JSON fixed, and **`0302_library_seed_refresh.sql`** re-syncs untouched fixtures in
  existing DBs (only rows with `origin='fixture' AND edited=0`). Generator: `seed/build-refresh-sql.mjs`.
- Fade mask on horizontal scrollers on mobile.
- Library and admin now use `@web/ui` (Button, Chip, Badge, Card, Field / Input / Select, EmptyState, Skeleton, Spinner,
  PageHeader, AiNotice, Segmented, Toast, Checkbox) and lucide icons. `Thumb` stays local.

### How to test round 2
```bash
npm run db:migrate:local && npm run dev
# /en/admin (token dev-admin) → Add resources → paste a mixed batch (YouTube + reel + article + one already in the library)
# watch "This batch"; open a row → Review → day picker, Publish & next; Pipeline tab → select several → Publish
cd media-worker && python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt && .venv/bin/pytest -q
MEDIA_WORKER_TOKEN=devtoken TRANSCRIBE_BACKEND=fake .venv/bin/uvicorn app.main:app --port 8790
# + MEDIA_WORKER_URL / MEDIA_WORKER_TOKEN / PUBLIC_BASE_URL in .dev.vars (see media-worker/README.md), restart dev, upload a video
npx vitest run --config worker/lib/library/vitest.config.ts   # 30 tests (whole repo: npm test)
```

### Still open
- The media worker's queue is in memory (a restart loses in-flight jobs; the founder can re-fetch). Move to SQS if volume
  grows.
- The live Claude path still hasn't run in the sandbox (no key). It's covered by the injected-call tests.
- `GET /api/pipeline/media-worker/source/:id` still passes through `anonUser` (see `docs/requests/library-to-orchestrator.md`).

---

## Round 1

Branch `agent/library` · PR #4. Everything in this report runs locally with no `ANTHROPIC_API_KEY`.

## What's built

### Data (`migrations/0300_library_init.sql`, `0301_library_seed.sql`)
| table | purpose |
|---|---|
| `lib_resources` | one row per YouTube / Instagram / link / upload. Holds metadata, tracks/topics/level, original language, `audience` (which student languages see it), suggested curriculum days, `status` draft→processing→review→published / failed, plus `transcript_state` and `ai_state` |
| `lib_transcripts` | captions / page text / pasted / uploaded / media-worker transcript (large files also kept in R2) |
| `lib_materials` | **one lesson per resource per language** (RU and EN are separate adaptations), stored as zod-validated JSON, with state, origin (ai / fixture / manual), model and an edited flag |
| `lib_events` | pipeline log; every step is visible in the admin |
| `lib_collections`, `lib_collection_items` | curated shelves ("Start here", "Video with code", …) |
| `lib_user_items` | student's "add to today" list and done marks |

The seed is **24 real resources**: Anthropic's Claude Code videos and docs, Karpathy ×3, 3Blue1Brown ×2, Fireship ×2, Remotion,
Manim, ffmpeg, Pro Git EN/RU, GitHub Hello World, Cloudflare Workers, MDN EN/RU, and a Russian Git video. Each has a
**hand-written** lesson for every audience it's shown to: 21 EN and 21 RU, written natively. RU uses «ты», says honestly when
the original is in English, and gives tips on subtitles and auto-translation. YouTube IDs were checked against search
results (YouTube itself is blocked from the dev sandbox). Source data lives in `worker/lib/library/seed/*.json`; `validate.mjs`
checks it against the schema and `build-seed-sql.mjs` regenerates the migration. The seed never overwrites founder edits and
skips any URL the founder already added.

### Pipeline (`worker/lib/library/*`, queue kinds `resource.ingest` and `resource.build_lesson`)
1. **Intake.** URLs are pulled out of any pasted text, classified (YouTube watch / short / live / embed / youtu.be,
   Instagram reel / p / tv, generic), canonicalized (tracking params stripped) and de-duplicated.
2. **Ingest**, per source:
   - YouTube: oEmbed, plus the watch page for duration, description and caption tracks. Manual captions are preferred over
     auto; the timedtext XML becomes text.
   - Links: OpenGraph, plus readable page text, which is used as the transcript.
   - Instagram: tries OpenGraph and expects a login wall.
   - Uploads go to R2.
   - When no text is found, the resource is marked **needs transcript** with a clear message. The founder pastes text or
     uploads `.srt`/`.vtt`/`.txt`, which triggers a rebuild, or the media worker fills it in.
3. **Build lesson.** One Claude call per language, each with its own audience brief (adaptation, not translation), the
   program outline (so it can suggest days), and the transcript clipped head + tail to 60k chars.
   - Output must pass `lessonMaterialSchema`. On failure there is **one retry** with the validator errors fed back.
   - AI tracks/topics/days are adopted only where the founder left the field empty.
4. **No API key.** `ai_state = not_configured`, and an editable **starter draft** is prefilled from the metadata. Starter
   drafts are never shown to students. Published resources without an approved lesson show as plain links.
5. **Review.** The founder edits and approves either language, or publishes. While a lesson is being regenerated, students
   keep seeing the last good version.
6. **Queue fallback.** If the queue send fails, the job runs inline via `waitUntil`, so dev never gets stuck in "queued".
7. **Media worker seam.** Download + Whisper on AWS; the HTTP contract is in `worker/lib/library/MEDIA-WORKER.md`.

### API
- **Public** (`worker/routes/library.ts`):
  - `GET /api/library?lang&q&track&topic&level&type&limit&offset` returns items, total and facets. Search handles RU and ё.
  - `GET /api/library/collections?lang`
  - `GET /api/library/resolve?lang&url=…&url=…` maps raw curriculum URLs (or `lib:<id>`) to published cards
  - **`GET /api/library/by-day/:day?track=&lang=`**, for learn's day pages
  - `GET /api/library/:id?lang` returns the lesson in that language, related resources and saved state
  - `POST|DELETE /api/library/:id/today`, `POST /api/library/:id/done`, `GET /api/library/me`
  - `GET /api/library/media/:id` streams an R2 upload, with range support
- **Admin, intake** (`worker/routes/pipeline.ts`, admin cookie / `x-admin-token`):
  - `POST /resources` (bulk) and `POST /upload` (multipart)
  - `POST /resources/:id/transcript|ingest|build`
  - `GET /board`, `GET /status`, plus the media-worker callback and source routes (bearer token)
- **Admin, session and review** (`worker/routes/admin.ts`):
  - `GET /session`, `POST /login|logout` (token in an httpOnly SameSite=Strict cookie, constant-time compare)
  - `GET /collections`, `PUT /resources/:id/collections` (shelf membership)
  - `GET|PATCH|DELETE /resources/:id`, `PUT|DELETE /resources/:id/materials/:lang` (zod-validated, returns per-field issues),
    `POST /resources/:id/publish|unpublish`

### UI
- **Student, `/:lang/library`:**
  - Search with debounce, kept in the URL.
  - Track and type chips, level and topic selects, a result count.
  - Curated shelves (horizontal scroll on phones), then a grid.
  - Skeletons, plus empty and error states with retry.
  - Card thumbnails fall back to an icon + host tile.
- **Student, `/:lang/library/:id`:**
  - Header: adapted title and hook, original title and author, plus an "In English" badge when the original's language
    differs from the student's.
  - YouTube is click-to-load (youtube-nocookie); Instagram shows a card with an optional embed; uploads use `<video>`;
    articles get a link card.
  - The lesson: summary, takeaways, steps, an exercise card and an interactive quiz with score.
  - Actions: "Add to today", "Mark done", "Open original" (above the lesson on mobile, a sticky sidebar on desktop).
  - Curriculum day links, topic and tag pills, related resources.
- **Student, `/:lang/library/me`:** today's list plus everything saved.
- **Admin, `/:lang/admin`:**
  - Token gate, an AI on/off badge with an explanation, and a status board with counts, filters, search and live refresh
    while anything is processing.
  - "Add resources": bulk paste with a live link count, track/level/audience/notes options, and upload of a file and/or
    transcript.
  - Review screen: details form, transcript panel (paste/upload), pipeline log, and **RU | EN lesson editors side by side**
    (tabs below xl). Editors are structured (steps, quiz with answer picker…) with server-side validation errors shown
    inline. Plus publish, unpublish, re-fetch, rebuild per language or both, and delete.
- All copy is in `strings.ts` per feature, written natively in EN and RU.
- Checked with Playwright in light and dark, RU and EN, at 390px and 1280px.

## How to test
```bash
npm install && npm run db:migrate:local && npm run dev       # http://localhost:5173
# student
open http://localhost:5173/ru/library   /en/library/seed-mastering-claude-code
# founder (ADMIN_TOKEN=dev-admin in .dev.vars)
open http://localhost:5173/en/admin  → Add resources → paste links → watch the board → open one → edit → Save & approve → Publish
# API
curl -c j -X POST localhost:5173/api/admin/login -H 'content-type: application/json' -d '{"token":"dev-admin"}'
curl -b j -X POST localhost:5173/api/pipeline/resources -H 'content-type: application/json' -d '{"text":"https://youtu.be/AJpK3YTTKZ4 https://code.claude.com/docs/en/overview"}'
curl -b j localhost:5173/api/pipeline/board
curl 'localhost:5173/api/library/by-day/3?track=apps&lang=en'
# tests (24): URL parsing, oEmbed/OpenGraph/watch-page/caption/SRT parsing, zod schema, generate-with-retry, starter draft
npx vitest run --config worker/lib/library/vitest.config.ts
node --experimental-strip-types worker/lib/library/seed/validate.mjs
```
With `ANTHROPIC_API_KEY` set, "Rebuild both lessons" generates real RU and EN lessons. That path is covered by unit tests
with an injected model call, but it has not been run against the live API from the sandbox, which has no key.

## Known gaps
- **YouTube captions** go through the watch page's `captionTracks`. YouTube increasingly wants PO tokens for timedtext, so
  expect "captions not reachable" often in production. The fallback is a pasted transcript now and the media worker later.
- **Instagram** metadata is best effort. Expect title "Instagram reel <code>" until the founder edits it.
- Shelves: the founder can put a resource on existing shelves (review screen). Creating, renaming or reordering shelves is
  still done in SQL / seed JSON.
- `resource.viewed` isn't sent to the game layer yet (no ingestion API; see `docs/requests/library-to-game.md`).
- Uploaded videos have no thumbnail unless the founder sets one, and files over 500 MB need the media worker. The upload
  form reads the whole file into the Worker request (fine for reels, not for hour-long raw footage). Next step: R2 presigned
  multipart upload.
- The admin is reachable only by URL (no nav link). That's intentional for a single founder.
- Root `npm test` can't run vitest because of the cloudflare plugin, so the library has its own config. See
  `docs/requests/library-to-orchestrator.md`.

## Next steps
1. A live run with a real key on a handful of URLs; tune the prompt on real output (length, quiz quality, RU tone).
2. Media worker on AWS (yt-dlp + Whisper) per `MEDIA-WORKER.md`; R2 presigned uploads for large raw videos.
3. Shelf create/rename/reorder in the admin.
4. Learn uses `/api/library/resolve` to render curriculum `resources:` URLs as rich cards on day pages.
5. Emit `resource.viewed` / quiz-passed events to the game layer for XP.
