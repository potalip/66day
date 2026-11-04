# Library + smart resource pipeline — report

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
