# FlowLeaf 66 — product spec

## One line
A 66-day, day-by-day program (in Russian and English) that takes complete beginners from zero to shipping real
apps and real videos **with AI coding agents**, wrapped in a game, a living resource library, and a built-in
video Studio — and later a path to paid work.

Why 66: research on habit formation puts the average time to make a behaviour automatic at ~66 days.
The promise: *"In 66 days, building with AI becomes a habit — and you'll have a portfolio to prove it."*

## Who it's for
- Worldwide, two first-class audiences: Russian-speaking and English-speaking.
- Complete beginners, motivated, 1–2 hours a day. No prior coding.
- Two paths chosen at onboarding (can switch later):
  - **Apps** — solve real problems by building web apps / tools / bots with coding agents (Claude Code and similar)
    and calling a variety of new AI models through APIs.
  - **Video** — make many kinds of videos *with code and AI*: programmatic motion graphics, animated explainers,
    kinetic typography, AI-generated clips + edit, data videos, shorts/reels — using coding agents to build
    their own pipelines (like our Studio).
- Explicitly **no no-code automation tools** (no n8n/Make/Zapier). Everything is coding agents + APIs.

## Language principle
RU and EN are **two separately authored adaptations**, not translations. Same skeleton (day numbers, task ids,
XP, badges) so progress and leaderboards are shared, but examples, references, humor, platforms, payment/hosting
realities and resources are chosen for each audience (e.g. Telegram/VK/YouTube for RU; X/YouTube/TikTok for EN).
UI strings are written natively in both languages. Russian uses "ты".

## Program shape (Curriculum Director owns the details)
- 66 days in phases (e.g. Foundation → Build → Ship → Portfolio/Earn). Shared "common" days first, then the tracks split.
- Every day: short lesson, 1–4 concrete tasks with proof (link/text/file), estimated minutes, XP.
- Every 7th day is a rest / reflect day (lighter, still counts for streaks).
- "Boss days": milestone projects that go in the portfolio.
- Ends with a capstone shipped publicly + a portfolio page (foundation for jobs later).

## Core features (MVP being built now)
1. **Landing + onboarding** — pick language, pick track, set daily time + goal, get Day 1.
2. **Today / Path** — today's lesson and tasks, a 66-cell path map, progress %, day pages, task submissions.
3. **Game layer (inside the platform)** — XP, levels, daily streak (with freeze), badges, weekly + all-time
   leaderboards (global and per track), profile page.
4. **Resource library** — curated YouTube videos, Instagram reels, links, our own lessons; filter by track/topic/lang/level.
5. **Smart resource pipeline** — founder pastes a YouTube/Instagram/link (or uploads a video/transcript) in the admin;
   the pipeline extracts the transcript, and Claude builds lesson material separately for RU and EN
   (summary, key steps, exercise, quiz, tags, suggested curriculum day) → draft → founder approves → published.
6. **Studio** — students (and the founder) create videos: pick a video type and style from many options,
   write/generate a brief → Claude plans script + storyboard → job sent to the external **render server**
   (Python, deployable to AWS; seeded from our pycairo/ffmpeg engine) → video comes back into the Studio.

## Later (do NOT build now, but don't block)
- Real auth via Cloudflare (Google, Telegram, Apple, email). For now: anonymous cookie user (`worker/lib/user.ts`).
- AI review of task submissions (hook point: the submission record — keep it reviewable).
- Paid plan, payments.
- Jobs / gigs marketplace from portfolios.

## Stack
Cloudflare Workers (Hono API) + static React SPA (Vite, React Router, Tailwind v4) in one Worker,
D1 (SQL), R2 (media), Queues (async pipeline + studio jobs). LLM: Claude API via `worker/lib/claude.ts`.
Render server: separate Python service (`render-server/`), deployed to AWS later; talks to the Worker over HTTPS.

## Design
Clean, calm, lots of whitespace, light **and** dark themes (system default + toggle). Editorial typography,
one accent color (leaf green) + gold for rewards. No dark-only, no neon, no heavy gradients.
Mobile-first; most students will be on phones. All tokens live in `web/src/styles.css`.
