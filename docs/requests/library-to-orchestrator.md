# library → orchestrator

1. **`worker/env.ts`** — please add the optional vars the library pipeline already reads (typed locally as `LibEnv` in
   `worker/lib/library/pipeline.ts`):
   ```ts
   MEDIA_WORKER_URL?: string;   // external transcription service (worker/lib/library/MEDIA-WORKER.md)
   MEDIA_WORKER_TOKEN?: string;
   PUBLIC_BASE_URL?: string;    // public origin, used for callback URLs
   ```
   They're already appended to `.dev.vars.example`. Once they're in `Env`, the `LibEnv` cast can go.
2. **Tests** — the root `vite.config.ts` loads the Cloudflare plugin, and `vitest` then fails with "There is already a server
   associated with the config". Library tests run with `npx vitest run --config worker/lib/library/vitest.config.ts`.
   Suggestion: a root `vitest.config.ts` without the cloudflare plugin (`include: ["worker/**/*.test.ts", "web/**/*.test.ts"]`),
   so `npm test` covers every area.
3. **Admin entry point** — `/:lang/admin` is reachable only by URL. That's fine for now, since only the founder uses it.
