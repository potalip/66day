# LEARN — report

Branch `agent/learn` · PR #3 `[learn] Content pipeline, progress API, onboarding → Today → Path → Day pages`

## What's built

### 1. Content pipeline — `scripts/build-content.mjs`
- Parses `content/curriculum/{ru,en}/{program.json,common|apps|video/day-NN.md}` and `content/badges.json` into
  `shared/curriculum.generated.json` (gitignored via `shared/.gitignore`; regenerated on `predev`, `prebuild`, `pretest`, `pretypecheck`).
- Validates every CONTENT-FORMAT rule and prints errors as `file: message`; exits 1 and does not write output on any error:
  frontmatter shape and types, `day`/`track` match the path, phase exists and contains the day, task id pattern
  (`d07-t1`, `d15-apps-t2`), unique ids, task type/proof enums, positive integer XP, resources are URLs or `lib:<id>`,
  badge ids exist in `badges.json`, non-empty body, phases cover 1..66 with no gaps or overlaps, `badges.json` shape,
  **RU/EN skeleton parity** (same task ids + XP + optional flags, same phase, rest/boss flags and badges), and no day that is both common and track-specific.
- **Decision:** incompleteness (a day missing, half an apps/video pair, a day in one language only) is a *warning* by default
  and an *error* with `--strict` (`npm run content:check`). The curriculum is written incrementally, and a partial branch
  merge must not break everyone's build. The half that exists is served; the other track or language shows "being written".
  Real contradictions (different task ids or XP across languages, common in one language but split in the other) are always errors.
- Falls back to `content/fixtures/` (owned by learn: 4 days, RU+EN, both tracks, one boss and one rest day) when
  `content/curriculum/*/program.json` doesn't exist. `--source fixtures|curriculum` forces a source.
- Checked against the real `agent/curriculum` branch: 81 RU / 91 EN day files and 30 badges build cleanly (only warnings for unwritten days).
- `npm run content:watch` rebuilds when anything in `content/` changes.

### 2. API (Hono) — `worker/routes/{curriculum,progress}.ts`, logic in `worker/lib/learn/`
| Method | Path | |
|---|---|---|
| GET | `/api/curriculum/program?lang&track` | program, phases, summaries for all 66 days |
| GET | `/api/curriculum/day/:n?lang&track` | full day content |
| GET | `/api/curriculum/badges` | badge definitions |
| GET | `/api/progress?lang` | overview: profile, next day, status, percent, XP, 66 path cells |
| POST | `/api/progress/onboarding` | `{lang, track, dailyMinutes, goal, goalNote, name, timezone}` → emits `onboarding.completed` |
| PATCH | `/api/progress/profile` | change track, time, goal, name, timezone |
| GET | `/api/progress/day/:n?lang` | content + access + task states + next-day teaser (locked days return no body) |
| POST | `/api/progress/day/:n/task/:taskId?lang` | proof: JSON `{text}` / `{url}`, or multipart `file` (→ R2 `MEDIA`, 50 MB max) |
| DELETE | `/api/progress/day/:n/task/:taskId` | un-check a task (only while the day is incomplete) |
| POST | `/api/progress/day/:n/complete` | explicit, idempotent completion |
| GET | `/api/progress/files/:id` | owner (or admin) download; `nosniff` + CSP sandbox; only safe media types are served inline |
| GET/POST | `/api/progress/submissions`, `/submissions/:id/review` | admin review queue + hook (`reviewSubmission()` for future AI review) |
| POST | `/api/progress/dev/time-travel`, `/dev/reset` | **APP_ENV=dev only**: shift your start date back N days, or wipe your progress |

- Migration `0100_learn_init.sql`: `learn_profiles`, `learn_submissions` (keeps history; status `submitted|approved|needs_work`,
  `reviewer`, `feedback`, `reviewed_at`), `learn_task_progress`, `learn_day_progress` (stores `local_date`).
- A task counts as done as soon as a valid proof is submitted; review doesn't block progress. Proof-less tasks are auto-approved (`reviewer = 'auto'`).
- The day completes automatically when the last required task is done. That emits `day.completed` with the day's badges, and the awards come back in the response.
- `task.completed` is emitted only on a task's first completion; re-submitting proof doesn't emit it again. If `onGameEvent` throws, the error is caught so progress never fails.

### 3. Pace rules — `worker/lib/learn/schedule.ts` (pure, unit-tested)
1. Days are completed in order; day N opens after days 1..N-1 ("unlocked = completed + 1").
2. One new day per calendar day, counted in the student's timezone from the start date.
3. Catching up is allowed: if you've missed days, you can do several today, up to the calendar day.
4. If you've completed nothing today, the next day is always open, so a timezone change or late start never leaves you stuck.
5. Rest days are ordinary required days: short, and they count toward the streak.

### 4. UI — `web/src/features/{onboarding,learn}`
- **Onboarding:** welcome → track (honest description of what you'll build on Apps and Video) → daily time + goal (+ an optional note in the student's own words) →
  name (skippable) → "Day 1 is ready" → Today. Already onboarded → "You're on day N" with an option to change track or goal.
- **Today:** greeting, day X of 66, phase, progress bar, XP; a "catching up" note when behind; the full lesson; a sticky task panel on desktop
  (a "Tasks · 0/3 ↓" jump chip on mobile). Text, link and file proofs; edit and re-submit; review status and feedback shown.
  Completion moment: animated ring, burst and check, awards (game awards if returned, otherwise task XP plus the day's badges from content),
  and a next-day teaser or "continue — you're catching up". States for "done for today", "finished all 66" and "day being written".
- **Path:** 66 cells grouped by phase (done / today with glow / opens tomorrow / ahead / boss with gold ring / rest with moon /
  being written), progress ring, a "today" card, and a legend.
- **Day page** `/:lang/day/:day`: full view when the day is done or open; a teaser plus lock when it's ahead or waits until tomorrow; previous/next navigation.
- **Markdown:** my own parser (`markdown.ts`) renders to React elements, with no raw HTML. It supports headings, lists (nested, task lists),
  code blocks with a Copy button, tables, links with safe schemes only, images, and callouts. Any `> **Label:** …` is a callout:
  tip, warn (safety/important/ethics), stuck ("If you're stuck"/"Если застрял") or note. Checked against all 172 real lesson bodies:
  no leftover markers.
- Strings are written natively in `strings.ts` (RU uses «ты», with proper Russian plurals). Only tokens are used (no hex values), so both themes work.
  Motion respects `prefers-reduced-motion`.

### 5. Tests — `npm run test:learn` (55 tests)
Content parsing and validation (every rule, strict vs. loose, the real fixtures), schedule logic (timezones, catching up, waiting,
finished), and the markdown parser (XSS-safe URLs, callouts, tables, lists, Cyrillic emphasis).

## How to test
```
npm install && npm run db:migrate:local && npm run dev
open http://localhost:5173/en/start   (or /ru/start)
# simulate missed days:  fetch('/api/progress/dev/time-travel',{method:'POST',headers:{'content-type':'application/json'},body:'{"days":3}'})
npm run test:learn
npm run content:check     # strict completeness check of the real curriculum
```
Verified with Playwright in both themes, both languages, at 390 px and 1280 px (onboarding, Today, task proof, celebration,
done-for-today, Path, Day page done/locked/unwritten), with both the fixtures and the real curriculum. No horizontal overflow at 390 px.
Trial merge of `main` + all six agent branches (2026-11-04): no conflicts, `npm run build` passes (105+105 day files, 30 badges),
and the learn pages render correctly inside the design shell, including the mobile bottom tab bar. Learn dispatches the game's
`fl:game-changed` window event after every action, so the game widgets refresh without any import coupling.

## Known gaps / notes for others
- Root `npm test` can't run vitest because of the Cloudflare plugin. Requested a root `vitest.config.ts` from the orchestrator (`docs/requests/learn-to-orchestrator.md`).
- `worker/lib/user.ts`: two API requests in parallel on a brand-new visit (no cookie yet) create two anonymous users, and the last cookie wins.
  Learn pages make one request first, so this mostly affects scripts. The orchestrator may want to dedupe (for example, set the cookie from the HTML response).
- The game widgets (`XpBar`, `AwardToast`) aren't on main yet, so learn renders its own award chips. Swap them in when `web/src/features/game/widgets.tsx` lands.
- The design system (`web/src/ui`) isn't on main yet. Learn uses small local components in `features/learn/ui.tsx` (tokens only), to replace once it lands.
- Resources show as link cards. `lib:<id>` entries display as plain text until the library exposes a lookup.
- Switching track mid-program keeps completed days. Track-specific days you already completed show the new track's content as done.

## Next steps
- AI review: a queue consumer that calls `claude()` for `submitted` text and link proofs and writes through `reviewSubmission()`;
  show "needs work" plus feedback, which the UI already supports.
- Reminders (email/Telegram) at the student's chosen time; a weekly recap on rest days.
- Use the game streak and XP in the Today header once the game API lands.
