# Studio → orchestrator

1. **`npm test` can't start**: vitest loads `vite.config.ts`, and `@cloudflare/vite-plugin` throws
   "There is already a server associated with the config". Suggest a root `vitest.config.ts` without the cloudflare
   plugin (only the aliases), e.g. `test.include: ["worker/**/*.test.ts", "web/**/*.test.ts", "scripts/**/*.test.ts"]`.
   Until then Studio tests run with `npx vitest run --config worker/lib/studio/vitest.config.ts`.
2. **`anonUser` runs on `/api/studio/render-callback`** (server-to-server, no cookie) so every callback inserts a
   throwaway `users` row. Please skip `anonUser` for that path in `worker/index.ts`, e.g.
   `app.use("*", (c, next) => c.req.path === "/api/studio/render-callback" ? next() : anonUser(c, next));`
3. Secrets/vars for prod: `RENDER_SERVER_URL` (wrangler var) + `RENDER_SERVER_TOKEN` (secret, same value as on the
   render server). Appended `RENDER_SERVER_URL=` to `.dev.vars.example` (dev override).
4. `worker/queue.ts`: added the import + two `jobHandlers["studio.*"]` lines as agreed.
5. **First-visit cookie race** in `anonUser`: when a fresh browser fires several `/api/*` requests in parallel, each
   one mints a different `fl_uid` and the last `Set-Cookie` wins, so data created by an earlier request can end up
   owned by a "lost" user. Studio sequences its first request to dodge it, but a fix in `worker/lib/user.ts` (or the
   SPA calling `/api/me` once before anything else) would protect every area.
