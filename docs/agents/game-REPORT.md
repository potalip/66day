# Game agent — report

## Round 2 (after the first merge)
- **The real `content/badges.json` (30 badges) drives awards.** Its 23 day badges arrive via `day.completed`; if the
  caller sends no `badges`, the day file of the student's own track is used. Its 7 game-rule badges are evaluated in code:
  streak-7/30/66 (frozen days count as kept days), comeback, public-builder (10 `share` tasks),
  night-owl (secret: a `ship` task 00:00–03:59 local) and polyglot (secret: the same day's lesson opened in both RU and EN,
  via `onLessonViewed()` / `POST /api/game/lesson-viewed`). Game-only extras that don't overlap content: first-task,
  streak-3, streak-14, tasks-50, curious, saved-by-freeze, level-5/10/20, and two new secrets (early-bird,
  well-rested). Total: 41 badges, 4 of them secret. A test cross-checks the catalog against content and the generated curriculum.
- **Level curve calibrated to the real XP totals** (apps 6,970 / video 6,890 task XP): `A=65`. Completing everything
  ≈ 8,700–8,800 XP → level 22 (23 with a perfect streak).
- Award `label`s are localised to `users.lang`, as learn asked.
- **End-to-end with learn, verified through its real API:** onboarding plus days 1–8 with text, file and link proofs,
  plus a missed day (shown as "frozen", then the freeze is used and the streak continues). Awards appear in learn's
  responses; `/game/me`, the leaderboard and the profile update. `POST /api/game/dev/time-travel {days}` mirrors learn's
  dev time-travel.
- **Delight, kept calm:**
  - Level-up moment: a dialog with a gold ring filling, the rank name and a one-line meaning of the rank. It fires from
    `showAwards()`, and also detects level-ups that happened elsewhere the next time game data loads.
  - `<StreakNudge/>` appears only when today's action matters (at risk / frozen / just lost), with gentler copy in the evening.
  - Weekly recap card on your own profile: XP vs last week, active days, tasks, a 7-day bar chart, best day, new
    badges and a one-line mood.
  - Secret badges show as "?" until earned.
- **Adopted the shared `@web/ui` kit** across the game pages and widgets. Reward toasts go through the kit's
  `useToast` (tone="reward"); badge art uses the content emoji. Leaderboard links point to `/:lang/u/:userId`.
- Shipped list: link proofs are read from `learn_submissions` (read-only).
- Open asks (one or two lines each): `docs/requests/game-to-{learn,library,design,orchestrator}.md`. The main ones:
  learn should place `<StreakNudge/>` on Today and call `showAwards(res.awards, {toast:false})` and `onLessonViewed`;
  design should mount `<GameLayer/>` in the Shell; library should call `onGameEvent` on "done".


## What's built
**Engine** (`worker/lib/game.ts` → `worker/lib/game/`)
- `onGameEvent(env, userId, ev)`: idempotent per (user, event identity): `task:<taskId>`, `day:<n>`, `onboarding`,
  `res:<resourceId>`, `render:<projectId>`. A retry returns the awards recorded the first time and never double-counts.
  It never throws (it logs and returns `[]`).
- Each event is one D1 batch (one transaction) guarded by a `version` check. On a race the batch rolls back and the
  event is retried with jitter. Tests fire 8 concurrent events and 3 concurrent duplicates.
- XP: task XP comes from the curriculum (clamped 0–500). +20 per completed day, +100 extra on boss days, +10 onboarding,
  +25 per Studio render, +2 per library resource (only the first 10 per day; learning beats farming). Streak milestone
  bonuses: 3/7/14/30/66 days → +15/30/50/100/200.
- Level curve: `54·(L−1)^1.6`, rounded to 10. L2 = 50 XP (first task), L5 = 490, L10 = 1820, L20 = 6100, L22 = 7020.
  At ~85–115 XP/day, 66 days lands at level 20–25 (tested). If `shared/curriculum.generated.json` exists, a test checks
  that the real curriculum total lands at level 18–27. Rank titles follow a leaf's life: Seed → Sprout → Leaf → Sapling →
  Branch → Grove → Tree → Forest.
- Streak: counted on the local calendar day in `users.timezone` (the browser reports it once per session via
  `PUT /api/game/timezone`). Task, day, onboarding and render events count; viewing a resource doesn't.
  One freeze is earned per 7 consecutive days (max 2). Freezes are spent lazily: on your next activity they bridge the
  missed days. `viewStreak()` reports `done / at_risk / frozen / lost / none` without changing anything.
  If the clock or timezone goes backwards, nothing breaks.
- Badges: 22 built-ins with native RU and EN copy, across first steps, streaks, craft (first ship, boss days, render,
  50 tasks, curious), rhythm (saved-by-freeze, comeback, early bird, night owl), levels and the 66/66 finisher.
  `content/badges.json` is merged in when it exists (via `import.meta.glob`, so a missing file is fine). Day badges come
  from the event or from the generated curriculum.

**Data** — `migrations/0200_game_init.sql`: `game_events` (ledger + dedupe), `game_stats`, `game_weekly`
(UTC ISO weeks), `game_badges`, `game_activity`. A test runs `EXPLAIN QUERY PLAN` and asserts every leaderboard
query is an ordered index scan with no temp B-tree.

**API** `/api/game`
- `GET /me`, `GET /leaderboard?period=week|all&track=all|apps|video&limit=`, `GET /profile/:userId`, `GET /badges`,
  `GET /levels`, `PUT /timezone`
- Dev only (when `APP_ENV` is dev/local/test): `POST /dev/event`, `POST /dev/seed` (30 students run through the real
  engine on a simulated clock), `DELETE /dev/seed`

**UI** `web/src/features/game/`
- Leaderboard (`/:lang/leaderboard`): week/all-time, track filter (kept in the URL), ties share a rank, the top 3 get gold
  ranks, your own row is highlighted or pinned at the bottom, plus skeleton, error/retry and empty state (with a dev-only
  seed button).
- Profile (`/:lang/me`, public view via `?u=<id>`): level ring, XP bar, stats, streak status message, 66-day heatmap,
  badge grid with locked silhouettes (tap a badge for details on mobile), shipped list, and inline display-name editing.
- Widgets (`widgets.tsx`): `XpBar`, `StreakChip`, `AwardToast`, `showAwards(awards)` (auto-mounts a toaster and
  refreshes all game widgets), `AwardToaster`, `LevelRing`, `BadgeMedal`, `Avatar`, `notifyGameChanged`.
- Uses only design tokens. Gold appears only on rewards. Respects `prefers-reduced-motion`. Checked in both themes,
  both languages, at 390px and 1280px.

## How to test
```
npm run db:migrate:local && npm run dev
curl -X POST localhost:5173/api/game/dev/seed
# /en/leaderboard  /ru/leaderboard?period=all&track=video  /en/me  /ru/me?u=seed-16
npm test    # game: 43 tests; real SQL + migrations via node:sqlite
```

## Known gaps / decisions
- The public profile route `/:lang/u/:userId` needs an `App.tsx` change (orchestrator); `?u=` works meanwhile.
  See `docs/requests/game-to-orchestrator.md`.
- `npm test` with the root vite config can't host vitest (Cloudflare plugin), so the game tests use their own config.
- "Shipped" relies on the generated curriculum (boss days and `ship` tasks) and, optionally, a `proofUrl` on
  `task.completed` from learn (`docs/requests/game-to-learn.md`).
- The leaderboard streak column is approximate (alive if active within 2 UTC days); the profile streak is exact
  (user timezone).
- The weekly board is global, Monday 00:00 UTC.
- Badges are never revoked. Rule badges are evaluated on every event, so new rules apply retroactively on the next action.

## Next steps
- Wire learn/library/studio calls (`onGameEvent` plus `showAwards` on the client) once those branches land.
- Friends/cohort leaderboards; share card for the profile; per-language boards if wanted.
- Re-tune `LEVEL_A` once the full curriculum XP total is known.
