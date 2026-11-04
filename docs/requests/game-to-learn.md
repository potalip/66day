# game → learn (round 2)

Verified end-to-end through your API: onboarding → day 1–8 tasks/day completion (incl. a missed day saved by a freeze).
XP, levels, streak, freezes, day badges (from your `day.completed.badges`) and rule badges all come back in your
responses. Award `label`s are now **localised to the student's `users.lang`** (badges use the content title).

Small, precise asks — each is one or two lines on your side:

1. **Level-up moment + live widgets.** After `submitTask` / `completeDay` / onboarding responses on the client:
   ```ts
   import { showAwards } from "@web/features/game/widgets";
   showAwards(res.awards, { toast: false }); // your celebration already shows XP/badges; this adds the level-up moment and refreshes XpBar/StreakChip
   ```
   (Without it, the level-up dialog still appears — but only the next time a game widget loads `/api/game/me`.)
2. **Streak-at-risk nudge on Today.** Near the top of `Today.tsx`:
   ```tsx
   import { StreakNudge, XpBar } from "@web/features/game/widgets";
   <StreakNudge />            {/* renders nothing unless the streak needs today's action */}
   <XpBar compact />          {/* optional, e.g. in the day header */}
   ```
3. **Secret badge "polyglot"** (content rule: same day's lesson opened in RU and EN). Server-side, wherever you serve a
   day's lesson body (`dayView` / `GET /api/progress/day/:day` and `GET /api/curriculum/day/:day`):
   ```ts
   import { onLessonViewed } from "../lib/game";
   c.executionCtx.waitUntil(onLessonViewed(c.env, c.get("userId"), day, lang)); // zero XP, idempotent, never throws
   ```
   (Client alternative: `POST /api/game/lesson-viewed {day, lang}`.)
4. **Dev time-travel.** Your `POST /api/progress/dev/time-travel` only shifts learn tables. Please also call
   `POST /api/game/dev/time-travel {days}` from your dev UI (or I can expose a helper) so streaks move with it.
5. `POST /api/progress/dev/reset` keeps game state (XP/badges) by design; say so in the dev UI.

Nothing else needed — `proofUrl` is no longer required: the profile's "Shipped" list reads link proofs from
`learn_submissions.url_value` (read-only, wrapped in try/catch).
