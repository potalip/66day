# Agent brief: LIBRARY + SMART RESOURCE PIPELINE (branch `agent/library`)

The founder continuously feeds YouTube videos, Instagram reels and links (and later their own raw videos). You build the
library students browse, and the pipeline that turns each input into ready lesson material in RU and EN.

Read: `CLAUDE.md`, `docs/SPEC.md`, `docs/OWNERSHIP.md`, `worker/lib/claude.ts`, `worker/queue.ts`, `worker/env.ts`.

## Build
1. Data (`0300_library_init.sql`, tables `lib_*`): resources (source type youtube|instagram|link|upload, url, title,
   author, duration, thumbnail, track(s), topics, level, lang of original, status draft|processing|review|published|failed),
   transcripts, generated materials per lang (summary, key takeaways, step-by-step, exercise, quiz JSON, suggested
   curriculum days/tracks, tags), collections.
2. Pipeline (queue kinds `resource.ingest`, `resource.build_lesson`; register your handlers with one line each in
   `worker/queue.ts`):
   - Ingest: metadata via oEmbed (YouTube/Instagram/generic OpenGraph), transcript via YouTube captions when reachable;
     otherwise mark "needs transcript" and let the admin paste text or upload a file (stored in R2 `MEDIA`). Instagram
     often blocks automated access — design for link + uploaded file/transcript.
   - Build lesson: Claude (`claude.ts`) generates material **separately for RU and EN as adaptations** (not translation),
     structured JSON validated with zod; one retry on invalid JSON. Without API key: produce a clear "AI not configured"
     state and keep the resource usable as a plain link.
   - Founder reviews → edits → publishes. Every step visible with status.
   - Leave a clean seam for the later AWS media worker (download + Whisper transcription) — document the HTTP contract.
3. Admin UI (`/:lang/admin`, guarded by ADMIN_TOKEN — simple token entry stored in a cookie): paste one or many URLs
   (bulk), upload file/transcript, queue status board, review/edit generated material side-by-side RU|EN, publish.
4. Student Library UI (`/:lang/library`, `/:lang/library/:id`): search, filters (track, topic, level, type),
   clean cards with thumbnails, resource page with embedded player (YouTube embed; Instagram as link card / embed),
   the generated lesson in the student's language, "add to today" / related curriculum day link.
   Expose `GET /api/library/by-day/:day?track=` so learn can show resources on day pages later.
5. Seed 15–25 real, well-known resources (official Anthropic/Claude Code docs & videos, well-known coding-agent and
   motion-graphics/Remotion tutorials) as published examples with hand-written fixture materials so it's demoable without a key.
6. Vitest for URL parsing, oEmbed parsing, zod schema. Screenshots. Polish. `docs/agents/library-REPORT.md`.
