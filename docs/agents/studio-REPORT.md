# Studio + render server — report

Branch `agent/studio` · PR #6 `[studio] Render server (7 templates) + web Studio: plan → edit → preview → render`

## What's built

### Render server (`render-server/`, Python 3.12, FastAPI)
- **Engine** generalised from the reference (`reference/rcm`), no client branding: pycairo frames → ffmpeg, scenes
  rendered in parallel (forkserver pool), wipe/fade/cut transitions, burned-in captions from each scene's narration,
  film grain/vignette per style, synth music + SFX (ElevenLabs VO/SFX/music when `ELEVENLABS_API_KEY` is set;
  scenes stretch to fit the spoken line), two-pass loudnorm to −14 LUFS, thumbnail + 12-frame contact sheet per render.
- **Resolution-independent layout**: design units (`f.s`), safe areas for Reels/TikTok/Shorts, every user string is
  wrapped/fitted into its box (`fit()`), so AI- or student-written text never clips.
- **7 templates × 2–4 styles × 3 formats (9:16, 1:1, 16:9)**, each with natively written EN + RU examples:
  `kinetic-quote`, `explainer`, `listicle`, `numbers`, `code-walkthrough` (pygments syntax colours, typing, line
  highlights, terminal), `before-after` (swipe reveal, side-by-side, screenshot in phone/browser mockup, features),
  `day-recap` (66-cell progress grid, XP in gold, streak, tomorrow teaser). 6 palettes: paper, night, forest, sunrise,
  terminal, ink. Small vector icon set.
- **Template declarations = the contract**: fields/scene kinds/durations/hints in Python → exported to
  `worker/lib/studio/catalog.generated.json` (`python -m flowleaf_render.cli catalog --out …`), used by the Worker,
  the web editor and the Claude prompt. Validation is mirrored in TS.
- **API** (`API.md`): `POST /v1/jobs`, `GET /v1/jobs/:id`, `DELETE`, `/v1/validate`, `/v1/preview` (PNG frame),
  `/v1/templates`, `/health`; Bearer auth; jobs persisted on disk and resumed after restart; status callbacks with
  retry; outputs on local disk with HMAC-signed links or uploaded to any S3-compatible bucket (S3 / R2 / MinIO).
- **Images** for screenshot scenes are fetched SSRF-safely (public IPs only, size cap, decoded/verified, cached).
- `Dockerfile`, `README.md` (env vars, AWS ECS Fargate + EC2 deploy notes, cost guide), CLI for render/stills/samples.
- Every template was rendered in all three formats and both languages; contact sheets were reviewed and layouts
  fixed (examples in `render-server/samples/*.jpg`). Speed on 4 vCPU: ~23 s 1080×1920 video in ~27 s; draft ~8 s.

### Worker
- `migrations/0400_studio_init.sql`: `studio_projects`, `studio_renders` (render history, R2 keys).
- `worker/routes/studio.ts`: catalog, status (render-server health), projects CRUD, `plan` (queue `studio.plan`),
  `render` (queue `studio.render`), `render-callback` (Bearer `RENDER_SERVER_TOKEN`), image uploads
  (`POST /projects/:id/assets` → R2, public unguessable URLs), media from R2 with HTTP Range (seekable `<video>`).
  Queue handlers registered with two lines in `worker/queue.ts`; falls back to `waitUntil` if the queue is unavailable.
- `worker/lib/studio/`: `storyboard.ts` (types + validation port), `plan.ts` (Claude prompt with template schema,
  example and language rules; JSON extraction; one repair round-trip; pins the student's style/format/lang),
  `service.ts` (submit, callback/poll sync — local dev works without a reachable callback —, R2 ingest, game event
  `studio.rendered` via `onGameEvent` on final renders).

### Web (`/:lang/studio`, `/:lang/studio/:id`)
- Gallery of the 7 types with real rendered previews (per style, per language), style swatches, "your videos" grid
  with render thumbnails and live status.
- Create dialog: style (preview tiles), format, video language, idea → creates the project from the template example
  and, if AI is configured, starts planning.
- Editor (autosave, debounced): idea + **Plan with AI**; look & sound (style, format, language, music, transitions,
  voiceover, captions, template fields); **scene-by-scene form** (kind switcher, fields per type, list/code/number/
  select/image inputs with counters and inline validation, narration with "will stretch to N s" hint, length slider,
  reorder/duplicate/delete, add scene); **live in-browser preview** (animated HTML/CSS sketch of every scene kind,
  scaled stage, captions, transitions, scrubber, scene timeline; jumps to the scene you edit); render panel
  (final / quick draft, progress + stage, video player, download, frame overview, history).
- States: "AI not configured" (start from example), "render server not connected / not responding" (plan + edit +
  preview still work), loading skeletons, errors with retry, not-found.
- Built on the shared design system (`@web/ui`: Button, Card, Badge, Input/Textarea/Select, Switch, Segmented,
  ProgressBar) through thin adapters in `web/src/features/studio/ui.tsx`.
- RU written natively (ты), EN; light + dark; checked at 390 px and 1280 px (`docs/agents/studio-screens/`).
- Hardened after an independent review: no lost edits (edit generations, functional updates, flush before
  plan/render), editor locked while the AI plans, stale plan/ingest recovery, no double submission, resilient polling.

## How to test
```bash
pip install --break-system-packages -r render-server/requirements.txt
cd render-server && RENDER_SERVER_TOKEN=devtoken FLR_ALLOW_PRIVATE_FETCH=1 uvicorn flowleaf_render.server:app --port 8080
# repo root: .dev.vars → RENDER_SERVER_URL=http://localhost:8080  RENDER_SERVER_TOKEN=devtoken
npm run db:migrate:local && npm run dev        # open /ru/studio or /en/studio
cd render-server && pytest -q                  # 8 tests: schema, every template × format draws, render smoke, API lifecycle, SSRF
npx vitest run --config worker/lib/studio/vitest.config.ts   # 9 tests: validation, AI plan parsing/prompt, assets
python -m flowleaf_render.cli render listicle --fmt 16x9 --lang ru   # → data/out/renders/…/video.mp4 + contact.png
```
Without the render server: Studio shows "render server not connected", everything except Render works.
Without `ANTHROPIC_API_KEY`: "AI not configured", projects start from the template example.

## Known gaps
- **Not verified live**: Claude planning (no API key in this container — prompt/parse/repair are unit-tested) and
  ElevenLabs voice (reference code path kept; synth fallback verified). Docker image not built here (no Docker daemon).
- `npm test` at the root can't start because of the Cloudflare vite plugin — see `docs/requests/studio-to-orchestrator.md`
  (plus: skip `anonUser` on the callback route; first-visit cookie race in `anonUser`).
- In-browser preview is a sketch (icons are simplified, fonts are the web fonts); the rendered video is the truth.
- Jobs queue in-process on the render server: scale vertically or run one service per URL; SQS is the next step.
- Day-recap doesn't auto-fill from the student's real progress yet (game/learn APIs weren't merged).

## Next steps
1. Prefill `day-recap` from `/api/progress` + `/api/game` (day, tasks done, XP, streak) — one-click daily post.
2. Add a toast on render finished; share link for finished videos (public R2 key).
3. More templates (talking-points over an uploaded clip, AI-image slideshow with Ken Burns, quiz/poll short),
   per-word karaoke captions from ElevenLabs timestamps, brand kits (student's own colours/logo).
4. Render server: SQS-backed queue for horizontal scale, per-user rate limits, webhook signature (HMAC) instead of
   the shared bearer.
