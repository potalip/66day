# FlowLeaf 66 — instructions for every Claude session

Read `docs/SPEC.md` (what we build) and `docs/OWNERSHIP.md` (what you may edit) first. Your personal brief is in
`docs/agents/<your-agent>.md`.

## Setup
```
npm install
cp .dev.vars.example .dev.vars        # if missing
npm run db:migrate:local              # applies all migrations to local D1
npm run dev                           # Vite + Worker on one port; API under /api
npm run build                         # must pass before every push
```
If pages stop loading after you change `.dev.vars` (Vite's dep optimizer can hang), stop the dev server,
`rm -rf node_modules/.vite`, and start it again.
Python render server: see `render-server/README.md` (`pip install --break-system-packages -r render-server/requirements.txt`, needs ffmpeg).

## How to work
- Work on your branch `agent/<name>`. Commit small and often; **push at least every ~45 minutes** so progress is never lost
  (`git push -u origin agent/<name>`). Before pushing: `git fetch origin main && git rebase origin/main`, then `npm run build`.
- When a coherent slice works end-to-end, open (or update) one PR from your branch to `main` titled `[<agent>] ...`
  with a short what/how-to-test. The orchestrator merges. Keep working after opening it; push more commits to the same PR.
- **Verify in the real app**, not just types: run `npm run dev`, hit your API with curl, and screenshot your pages with
  Playwright (Chromium is preinstalled: `require('playwright')`, `chromium.launch()`), in **both themes, both languages,
  at 390px and 1280px**. Look at the screenshots and fix what's ugly or broken.
- Write a few focused tests with Vitest for logic that matters (XP math, streaks, content parsing, pipeline parsing).
- Never commit secrets. Missing `ANTHROPIC_API_KEY` must not crash anything — show a clear "AI not configured" state
  and use deterministic fallbacks / fixtures so the feature is still demoable.
- No placeholder lorem ipsum in shipped UI. Real copy, in both languages, written natively.
- Don't stop at "done": when your brief is complete, polish (empty states, loading, errors, mobile, a11y), then
  write `docs/agents/<name>-REPORT.md` (what's built, how to test, known gaps, next steps) and push.

## Design rules (short; full system in docs/DESIGN.md once written)
Clean and calm. Light and dark both first-class. Generous spacing, clear hierarchy, max ~70ch reading width,
rounded cards with 1px `border-line`, accent green for primary actions, gold only for rewards. Mobile-first.

## Model ids (Claude API)
Default `claude-sonnet-5-5` (env `CLAUDE_MODEL`); heavy reasoning `claude-opus-5-5` (env `CLAUDE_MODEL_SMART`).
