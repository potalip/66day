# Agent brief: STUDIO + RENDER SERVER (branch `agent/studio`)

Our own video-creation platform. Inside the web app: the **Studio**. Outside: a Python **render server** (will run on
AWS) that actually renders videos. They talk over HTTPS. Many kinds of videos and lots of choices.

Read: `CLAUDE.md`, `docs/SPEC.md`, `docs/OWNERSHIP.md`, `worker/lib/claude.ts`, `render-server/reference/README.md`
and the reference engine code in `render-server/reference/rcm/` + `storm_spot.py` (pycairo → ffmpeg, scene list,
easing toolkit, parallel scene render, ElevenLabs VO with synth fallback, captions, contact-sheet QA).
Do NOT reuse RoofCraft branding/facts — it was a client. Reuse the architecture.

## Build
1. **Render server** (`render-server/`): FastAPI (or similar) service + generic engine refactored from the reference:
   - `POST /v1/jobs` (Bearer `RENDER_SERVER_TOKEN`) with a storyboard JSON → renders → `GET /v1/jobs/:id` status,
     output mp4 + thumbnail + contact sheet; optional callback to the Worker `POST /api/studio/render-callback`.
     Local storage for dev; S3-compatible upload (works with R2 or S3) when configured.
   - A **template system**: at least 6 video types, each with 2–3 styles and 3 formats (9:16, 1:1, 16:9):
     e.g. kinetic-typography quote/hook, animated explainer (steps), listicle/top-N, data/number reveal,
     code-walkthrough (animated code typing + highlights — great for our students), before/after or product showcase,
     course "Day N" recap card. Each template declares its JSON schema (fields, durations, colors) so the Studio UI and
     Claude can fill it.
   - Voiceover via ElevenLabs if `ELEVENLABS_API_KEY` exists; else synth music + captions (keep the reference fallback).
   - `Dockerfile` (python + ffmpeg + cairo) and `render-server/README.md` with AWS deploy notes (ECS Fargate or EC2 +
     S3), env vars, and the API contract in `render-server/API.md`.
   - Actually render each template locally in this container and **look at the contact sheets** (Read the png) — fix
     anything clipped/ugly. Commit small sample outputs only as thumbnails (no big mp4s in git).
2. **Studio in the web app** (`/:lang/studio`, `/:lang/studio/:id`; tables `studio_*` in `0400_studio_init.sql`;
   queue kinds `studio.plan`, `studio.render`, one line each in `worker/queue.ts`):
   - Gallery of video types with previews → pick type, style, format, language → write a brief or idea →
     "Plan with AI" (Claude fills the template JSON: script, scenes, on-screen text — in RU or EN) → editable
     scene-by-scene form (no raw JSON for students) → Render → status → watch/download.
   - Without the render server configured: show the plan + a live in-browser preview of the storyboard timing (simple
     animated HTML/CSS preview), and a clear "render server not connected" state. Without API key: start from template
     example content.
   - Emit `studio.rendered` game event via `onGameEvent`.
3. Tests (render-server: pytest for schema validation + a tiny render smoke test; worker: vitest for plan validation).
   Screenshots. Polish. `docs/agents/studio-REPORT.md`.
