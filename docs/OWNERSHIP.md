# Who owns what (parallel agents — read before touching any file)

Six agents build in parallel on separate branches. **Only edit files you own.** If you need a change in someone
else's file, write it in `docs/requests/<your-agent>-to-<owner>.md` and work around it (or build a local adapter).

| Agent (branch) | Owns |
|---|---|
| **curriculum** (`agent/curriculum`) | `content/curriculum/**`, `content/badges.json`, `docs/curriculum/**` |
| **learn** (`agent/learn`) | `web/src/features/{onboarding,learn}/**`, `worker/routes/{curriculum,progress}.ts`, `worker/lib/learn/**`, `scripts/build-content.mjs`, `shared/curriculum.generated.*`, migrations `01xx_*.sql` |
| **game** (`agent/game`) | `web/src/features/game/**`, `worker/routes/game.ts`, `worker/lib/game.ts`, `worker/lib/game/**`, migrations `02xx_*.sql` |
| **library** (`agent/library`) | `web/src/features/{library,admin}/**`, `worker/routes/{library,pipeline,admin}.ts`, `worker/lib/library/**`, `media-worker/**`, migrations `03xx_*.sql` |
| **studio** (`agent/studio`) | `web/src/features/studio/**`, `worker/routes/studio.ts`, `worker/lib/studio/**`, `render-server/**`, migrations `04xx_*.sql` |
| **design** (`agent/design`) | `web/src/styles.css`, `web/src/ui/**`, `web/src/Shell.tsx`, `web/src/features/landing/**`, `web/public/**`, `docs/DESIGN.md` |
| **orchestrator** (main) | everything else: `worker/index.ts`, `worker/env.ts`, `worker/queue.ts`, `worker/lib/{user,claude}.ts`, `web/src/App.tsx`, `web/src/i18n/**`, `shared/types.ts`, `wrangler.jsonc`, `package.json`, `migrations/0001_core.sql`, `CLAUDE.md`, `docs/SPEC.md` |

## Shared-file exceptions (small, append-only)
- `worker/queue.ts` — library and studio may each add **one line** registering their handlers
  (`jobHandlers["resource.ingest"] = ...`). Keep it to your own lines.
- `package.json` — add deps with `npm i` if you truly need them; mention them in your PR. Prefer zero new deps.
- `.dev.vars.example` — append your secret names.

## Conventions
- DB tables prefixed by area: `learn_*`, `game_*`, `lib_*`, `studio_*`. Reference users by `users.id`.
- Migrations in your numeric range only (`0100_learn_init.sql`, `0101_...`). Never edit another range.
- UI strings: per-feature `strings.ts` with `{ en, ru }`, used via `useStrings()`. Never put strings in `web/src/i18n/*`.
- Styling: Tailwind classes using tokens (`bg-surface text-fg border-line bg-accent text-gold`…), and components from
  `web/src/ui/` once design ships them. Never hard-code hex colors.
- The current user is `c.get("userId")` (worker). Never read the cookie directly.
- LLM calls only through `worker/lib/claude.ts`; must work (degrade) when `ANTHROPIC_API_KEY` is missing.
