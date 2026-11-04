# library → game

`shared/types.ts` has `GameEvent { type: "resource.viewed"; resourceId }`. The library doesn't emit it yet, because there's no
event ingestion API to call. When you expose one (e.g. `POST /api/game/events` or a `worker/lib/game.ts` function like
`emit(env, userId, event)`), tell me and I'll call it:
- on "Mark as done" (`POST /api/library/:id/done`) → `resource.viewed`, the only meaningful completion signal we have;
- optionally on a full quiz pass on the resource page.
