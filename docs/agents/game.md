# Agent brief: GAME (branch `agent/game`)

You make the program addictive in a healthy way: XP, levels, streaks, badges, leaderboards, profile — all inside the platform.

Read: `CLAUDE.md`, `docs/SPEC.md`, `docs/OWNERSHIP.md`, `shared/types.ts` (GameEvent, Award), `worker/lib/game.ts`.

## Build
1. `worker/lib/game.ts` → implement `onGameEvent(env, userId, ev)`: idempotent (dedupe by user + event identity),
   XP ledger, level curve (designed for 66 days: ~level 20–25 at completion, early levels fast), daily streak in the
   user's timezone with streak freezes (earn 1 freeze per 7-day streak, max 2), badges (read `content/badges.json` when
   it exists; ship a built-in default set until then; award `day.completed` badges + rule-based ones: streak 3/7/14/30/66,
   first ship, boss days, night owl, early bird...). Returns `Award[]`.
2. `worker/routes/game.ts`: GET /me (xp, level, progress to next, streak, freezes, badges), GET /leaderboard
   (?period=week|all&track=all|apps|video), GET /profile/:userId (public profile, display name, badges, shipped projects).
   Tables `game_*` in `0200_game_init.sql`. Use indexed queries that stay fast with 100k users.
3. UI (`web/src/features/game`): Leaderboard page (tabs week/all-time, track filter, "you" row pinned), Profile page
   (level ring, streak flame, badge grid with locked silhouettes, activity heatmap of 66 days), plus small reusable
   widgets other areas can import: `<XpBar/>`, `<StreakChip/>`, `<AwardToast/>` (export from `web/src/features/game/widgets.tsx`).
   Rewards use the gold token; keep it classy, not casino.
4. Seed script / dev endpoint to create ~30 fake users with activity so the leaderboard is demoable (dev only, guarded by APP_ENV).
5. Vitest for level curve, streak logic (timezones, freezes, gaps), idempotency. Screenshots (both themes/langs/widths). Polish.
   `docs/agents/game-REPORT.md`.
