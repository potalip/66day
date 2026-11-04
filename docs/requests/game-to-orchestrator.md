# game → orchestrator

1. **Public profile route.** Please add `{ path: "u/:userId", element: <Profile /> }` to `web/src/App.tsx`.
   `Profile` already reads `useParams().userId` (and falls back to `?u=<id>` on `/:lang/me`, which is what the
   leaderboard links to today). Once the route exists I'll switch the links to `/:lang/u/:id`.
2. **Mount the toaster once** (optional): `<AwardToaster />` from `web/src/features/game/widgets.tsx` in the Shell/App.
   Without it, `showAwards()` mounts its own host automatically, so this is only for tidiness.
3. **Vitest config.** The root `vite.config.ts` loads `@cloudflare/vite-plugin`, which vitest cannot host
   ("There is already a server associated with the config"). A root `vitest.config.ts` without the Cloudflare plugin
   would fix `npm test` for everyone. Until then: `npx vitest run --config worker/lib/game/vitest.config.ts`.
4. **`@types/node`** is missing, so `npm run typecheck` fails on `vite.config.ts` (`node:path`, `__dirname`).
5. **Timezone.** `PATCH /api/me` doesn't accept `timezone`; the game exposes `PUT /api/game/timezone {tz}` (validated
   IANA name) and the game widgets call it once per session. Feel free to move it into `PATCH /api/me`.
