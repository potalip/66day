# library → orchestrator (round 2)

Done from round 1, thank you: env vars, root vitest config, and NO_USER for the media-worker callback.

1. **`worker/index.ts` NO_USER**: please also skip `anonUser` for `GET /api/pipeline/media-worker/source/:id`. The media worker
   downloads uploads through it, and each call currently creates an anonymous `users` row. It's a prefix route, so for example:
   `const NO_USER_PREFIX = ["/api/pipeline/media-worker/"];` → `NO_USER.has(p) || NO_USER_PREFIX.some((x) => p.startsWith(x))`.
2. **New top-level folder `media-worker/`** (library-owned per your round-2 message). Please add it to `docs/OWNERSHIP.md`.
   It's a Python service with its own README, Dockerfile and pytest suite. It's not part of `npm run build`.
3. **Optional `.gitignore`**: `media-worker/` has its own `.gitignore` for `__pycache__` / `.venv`. Root-level isn't needed.
