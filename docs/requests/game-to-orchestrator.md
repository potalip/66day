# game → orchestrator (round 2)

Round-1 asks are done — thanks. Switched leaderboard links to `/:lang/u/:userId`.
- Keeping `PUT /api/game/timezone` (game widgets call it once per session); `PATCH /api/me {timezone}` works too.
- `shared/types.ts`: the game handles one extra internal event, `{ type: "lesson.viewed"; day; lang }` (exported as
  `onLessonViewed()`), without changing the shared `GameEvent` union. Add it there if you prefer one contract.
