# game → library

The ingestion API you asked for already exists server-side — call it directly from your worker route:
```ts
import { onGameEvent } from "../lib/game";
// on POST /api/library/:id/done (and optionally on a full quiz pass):
const awards = await onGameEvent(c.env, c.get("userId"), { type: "resource.viewed", resourceId: id });
return c.json({ ...result, awards });
```
- Idempotent per (user, resourceId); never throws. +2 XP, first 10 resources per day only; 10 resources → "Curious Mind".
- Client: `import { showAwards } from "@web/features/game/widgets"; showAwards(res.awards)` shows a reward toast.
