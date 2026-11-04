# FlowLeaf 66 — status for the founder

Built on 2026-11-04 by six Claude agents working in parallel, coordinated by an orchestrator session.
Everything is on `main`. `npm run build` passes, `npx vitest run` passes (286 tests), all 11 D1 migrations apply,
and every page was opened in a real browser (EN light 1280px and RU dark 390px) with no errors.

## Try it locally (5 minutes)
```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```
Open the URL Vite prints → `/ru` or `/en`.
- **Student flow:** landing → "Start free" → onboarding → Today → Day 1 tasks → Path → Library → Studio → Leaderboard → Profile.
- **Admin:** `/en/admin`, token `dev-admin` (from `.dev.vars`). Paste YouTube/Instagram links, review the RU/EN lessons, publish.
  Tab "Stats" = your dashboard (signups, drop-off by day, stuck days, pipeline health).
- **Demo data:** on the leaderboard press "Fill with demo students".
- **UI kit:** `/en/ui`.
- **Video rendering** (optional): start the render server (see `render-server/README.md`), then set
  `RENDER_SERVER_URL=http://localhost:8080` and `RENDER_SERVER_TOKEN=dev-render` in `.dev.vars` and restart `npm run dev`.

## What's built

| Area | What you get | Read more |
|---|---|---|
| **Curriculum** | 66 days in RU and EN, written as separate adaptations, not translations (106 + 106 day files). Days 1–14 are shared, then Apps and Video tracks. Rest every 7th day, boss days 13/27/41/55/65, 30 badges, 25 weekly quests. | `docs/curriculum/FOUNDER-GUIDE.md` (RU+EN), `OUTLINE.md`, `DESIGN.md` |
| **Learn** | Onboarding, Today, the 66-day path map, day pages (lessons, tasks with text/link/file proof, "Go deeper" library cards), celebrations, share cards, public portfolio `/:lang/portfolio/:id` with link previews. | `docs/agents/learn-REPORT.md` |
| **Game** | XP, ~22 levels over 66 days, streaks with freezes, per-track badges, weekly quests, week/all-time leaderboards, profiles, public certificate `/:lang/certificate/:id` (prints to A4 PDF). | `docs/agents/game-REPORT.md` |
| **Library + pipeline** | Student library with search and filters. Admin intake: paste many links → metadata → transcript → Claude builds RU and EN lessons → you review side by side → publish to days. 24 seeded resources. `media-worker/` = Python service for AWS (yt-dlp + Whisper). | `docs/agents/library-REPORT.md` (starts with your daily workflow) |
| **Studio + render server** | Students pick a video type, style and format (9:16, 1:1, 16:9) and a language; AI plans the scenes; they edit them; the video renders on our own Python server (`render-server/`, Docker, for AWS). Verified end to end: a 17-second RU code-walkthrough mp4. | `docs/agents/studio-REPORT.md`, `render-server/README.md`, `render-server/API.md` |
| **Design** | Clean light and dark themes, a component kit, mobile tab bar, accessibility (axe: 101 issues → 1), RU/EN landing aligned with the real curriculum. | `docs/DESIGN.md`, `docs/agents/design-REPORT.md` |

## To go live (your steps; agents can't create accounts)
1. **Cloudflare**: create the D1 database `flowleaf-66day`, the R2 bucket `flowleaf-66day-media` and the queue `flowleaf-66day-jobs`.
   Put the real D1 `database_id` into `wrangler.jsonc` (it's a placeholder of zeros now).
2. **Secrets** (`wrangler secret put …`): `ANTHROPIC_API_KEY` (turns on AI lesson building and AI video planning),
   `ADMIN_TOKEN` (pick a long random string), `RENDER_SERVER_TOKEN`, and optionally `MEDIA_WORKER_TOKEN`.
   Set the `PUBLIC_BASE_URL` var to your domain.
3. `npm run deploy`, then `wrangler d1 migrations apply DB --remote`.
4. **AWS**: deploy `render-server/` (Dockerfile; ECS Fargate 4 vCPU / 8 GB recommended) and optionally `media-worker/`.
   Set `RENDER_SERVER_URL` / `MEDIA_WORKER_URL` to their URLs. Add `ELEVENLABS_API_KEY` on the render server for AI voiceover.
   Neither Docker image has been built yet (this sandbox has no Docker daemon), so build and smoke-test both first.

## Known gaps / next decisions
- **Auth is temporary**: each browser gets an anonymous cookie user. Real login (Google, Telegram, Apple, email) is the next
  project; it's one file to swap (`worker/lib/user.ts`), and everything else uses the user id it provides.
- **AI review of submissions**: not built (as you asked). Submissions already have a status, reviewer and feedback field, ready for it.
- **Payments / paid tier and jobs marketplace**: not built. The public portfolio + certificate are the foundation for jobs.
- **Instagram** blocks automated downloads, so for reels paste the link plus upload the video or transcript (the admin guides you).
- **No real users yet**: run the 2-week pilot in `docs/curriculum/FOUNDER-GUIDE.md` (5–10 students per language) and
  recalibrate time estimates from the dashboard.
- The design skills page you shared (aiuxplayground.com) was blocked by this environment's network policy, so the design
  direction was set by the Design agent (documented in `docs/DESIGN.md`).

## How the repo is organised
`docs/SPEC.md` is the product spec. `docs/OWNERSHIP.md` says which folder belongs to which area. `CLAUDE.md` has the rules any
future Claude session follows. Cross-area requests live in `docs/requests/`. To continue with agents, start a session on this
repo with one of the briefs in `docs/agents/*.md`.
