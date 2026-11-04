# Agent brief: LEARN (branch `agent/learn`)

You build the student's core loop: onboarding → Today → tasks with proof → progress → Path map → Day pages.

Read: `CLAUDE.md`, `docs/SPEC.md`, `docs/OWNERSHIP.md`, `docs/CONTENT-FORMAT.md`, `shared/types.ts`.

## Build
1. `scripts/build-content.mjs`: parse `content/curriculum/**` (YAML frontmatter + md) → `shared/curriculum.generated.json`,
   validate every rule in CONTENT-FORMAT.md, exit non-zero with clear messages. Wire it so `npm run dev`/`build` run it
   (add a `predev`/`prebuild` script — you may edit package.json scripts for this). Create a small realistic fixture in
   `content/fixtures/` (3–4 days, ru+en, both tracks) used when `content/curriculum` is empty, so you're never blocked.
2. API (`worker/routes/curriculum.ts`, `progress.ts`): program + day lookup by lang/track; task completion with proof
   (text/link/file → R2 via `MEDIA`), day completion, current day calculation (unlocked days = completed + 1; allow
   catching up; rest days), progress summary. Tables `learn_*` in migration `0100_learn_init.sql`.
   Store submissions so AI review can be added later (status: submitted | approved | needs_work, reviewer, feedback).
   Call `onGameEvent()` from `worker/lib/game.ts` on task/day/onboarding completion and return awards in the response.
3. UI (`web/src/features/onboarding`, `web/src/features/learn`):
   - Onboarding: welcome → choose track (Apps / Video, with honest description of what you'll build) → daily time & goal → name → Day 1.
   - Today: today's day card, lesson body (render markdown nicely — write a small safe renderer or add one tiny dep),
     task checklist with proof inputs, completion moment (celebration micro-animation, awards shown), next-day teaser.
   - Path: 66-cell map grouped by phases, states (done/today/locked/rest/boss), progress %.
   - Day page `/:lang/day/:day`.
   Use per-feature `strings.ts` with natively written RU + EN.
4. Tests for content parsing/validation and current-day logic. Playwright screenshots of all screens (both themes, both
   languages, 390px + 1280px). Then polish. Then `docs/agents/learn-REPORT.md`.
