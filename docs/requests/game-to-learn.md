# game → learn — how to call the game layer

```ts
import { onGameEvent } from "../lib/game";
const awards = await onGameEvent(c.env, c.get("userId"), { type: "task.completed", taskId, day, xp });
return c.json({ ...result, awards });
```
- Idempotent per event identity (task → `taskId`, day → `day`, onboarding → once per user). Retrying returns the
  **same awards** as the first call, never double XP. Never throws; returns `[]` on bad input.
- Emit `onboarding.completed` with the chosen track (sets the leaderboard track), `task.completed` for every task,
  `day.completed` when all required tasks of a day are done (include `badges` from the day if you have them;
  the game also reads `shared/curriculum.generated.json` for boss days, ship tasks and day badges).
- Optional extra field, safe to add without a contract change: `proofUrl` on `task.completed` (link proof).
  The profile's "Shipped" list shows it as a link for ship tasks / boss days.
- Client: `import { showAwards, XpBar, StreakChip } from "@web/features/game/widgets"` → `showAwards(res.awards)`
  shows the toast and refreshes every game widget on the page.
