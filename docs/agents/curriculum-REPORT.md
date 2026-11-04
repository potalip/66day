# Curriculum Director — report

## What's built

| Deliverable | Where | Status |
|---|---|---|
| Pedagogy | `docs/curriculum/DESIGN.md` | Done. Covers personas (RU + EN), outcomes, the 4-phase arc, the difficulty ramp, the weekly rhythm, boss days, proof, the XP/streak model, the capstone, portfolio → paid work, community, and surprise. |
| 66-day skeleton | `docs/curriculum/OUTLINE.md` | Done. Binding table of every day × track: task id · type · XP · proof, minutes, and flags. |
| Authoring rules | `docs/curriculum/WRITING-GUIDE.md` | Done. Frontmatter, body anatomy, voice per language, tools stance, vetted resource URLs. |
| Validator | `docs/curriculum/tools/validate.mjs` | Done. Zero dependencies. Checks every file against OUTLINE and CONTENT-FORMAT, and prints XP totals. |
| Programs | `content/curriculum/{ru,en}/program.json` | Done. 4 phases: Foundation 1–14, Build 15–35, Ship 36–52, Portfolio & Earn 53–66. |
| Day files | `content/curriculum/{ru,en}/{common,apps,video}/day-NN.md` | **All 66 days in both languages.** 106 files per language: 26 common, 40 apps, 40 video. About 94k words in EN and 85k in RU. |
| Badges | `content/badges.json` | 30 badges. 23 are awarded on finishing a day (milestones, phases, bosses, track skills). 7 reuse the game's built-in rules with our copy: streak-7, streak-30, streak-66, comeback, curious, saved-by-freeze, and the secret night-owl. |
| Self-review | `docs/curriculum/REVIEW.md` | Done. Five slice reviews (student + editor), fixes applied, outline changes, known gaps, and a quarterly list of facts to re-verify. |

### Program at a glance
- **Common core, days 1–14:**
  - page live on day 2;
  - terminal, prompting, reading code and git;
  - APIs (8), first AI call (9), debugging (10), serverless backend (11);
  - taste both tracks and pick one (12);
  - **boss 13**: solve one real person's problem.
- **Apps track:**
  - a main app grown day by day: spec → UI → database → structured AI → Telegram bot → multi-model arena →
    vision/voice → auth → document Q&A (RAG) → tool use;
  - **boss 27**: v1 with 3 real users;
  - then tests and CI, internal tools, automations in code, payments (Stripe / ЮKassa / Stars), security and cost,
    polish;
  - launch page, feedback loops, parallel agents, MCP, queues;
  - **boss 41**: a real client brief;
  - PWA, Telegram Mini App, analytics with natural-language → SQL, realtime voice, evals, open source;
  - capstone 50–65 (**boss 55** beta, **boss 65** launch).
- **Video track:**
  - frames and ffmpeg → pycairo easing → kinetic type → Remotion templates → sound/LUFS → TTS → Whisper captions →
    shorts → Manim/Motion Canvas explainers → data videos;
  - **boss 27**: a 60-second explainer made 100 % in code;
  - AI clips via APIs, editing from an edit-list JSON, LLM storyboards, brand kit as code, a one-command `make-video`
    pipeline, variants and thumbnails;
  - publishing via APIs, retention analysis, series, business promos, the pipeline as an app;
  - **boss 41**: a client pack;
  - generative visuals, screen tutorials, RU↔EN dubbing, auto-clipping, QC and ethics, open source;
  - capstone 50–65.
- **Common late days:**
  - rest every 7th day, each with a different ritual;
  - 57 portfolio site, 58 case study and demo/showreel, 59 where the paid work is, 60 five real pitches;
  - 66 graduation.
- **Totals:** XP is 6,970 on the apps path and 6,890 on the video path. Typical days are 75–120 min; rest days 30–40
  min; boss days 150–180 min.

## How to test

```bash
node docs/curriculum/tools/validate.mjs     # expect "Validated 212 day files … OK — no errors"
```

The learn agent's parser (`origin/agent/learn:scripts/build-content.mjs`) already accepts the full content:
`--strict --check` reports *"ok — ru: 106 day files, en: 106 day files"*. Once learn is on main, run
`npm run content:build -- --strict` and open `/learn` in both languages.

## Key decisions (made autonomously)
- **When the tracks split:** day 15. Rest days, the earning block (57–60) and day 66 stay common, so the cohort
  shares community moments.
- **Boss days:** 13 / 27 / 41 / 55 / 65 — every two weeks, each one ending in something for the portfolio.
- **Day 1 ships locally; day 2 ships publicly** (GitHub Pages), so the first win doesn't depend on a deploy working.
- **Claude Code is the main example agent.** Every prompt is agent-agnostic, and RU lessons are honest about regional
  availability and payment. Where Claude or OpenAI aren't available, they name GigaChat and YandexGPT. No advice to
  work around a service's rules.
- **Main stack:** Cloudflare Workers + D1, the same as our own stack. Vercel and Supabase are named as alternatives.
  RU lessons note Cloudflare and YouTube reachability problems in Russia and give alternatives.
- **XP by effort:** read 10, quiz 15, reflect 15–30, share 20–30, build 20–80, ship 50–120. Rest days carry low XP
  but full streak credit.
- **No exact prices:** lessons teach how to read a pricing page and estimate cost. Where a number is needed for
  teaching, it is labelled "example".
- **Resources:** only official or well-known URLs. The founder's own videos will go in as `lib:<id>` entries via the
  library pipeline.

## Known gaps
See `docs/curriculum/REVIEW.md` → "Known gaps". The main ones:
- Testers and clients need lead time; days 52 and 40 now warn about it.
- Day 65's 150 minutes are spread over 24 hours.
- No founder media is linked yet.

## Requests to other agents
- **learn:**
  - Label boss day 65 as "spread over a day".
  - Show `estMinutes` as an estimate.
  - Render `<details>` quiz answers collapsed.
  - Render `- [ ]` checklists as visual checklists; they aren't tasks.
- **game:** implement the 7 rule-based badges in `content/badges.json` (rules are in the `rule` field). Treat streak
  freezes as kept days for streak-7, streak-30 and streak-66.
- **library:** the pipeline's "suggested curriculum day" can append `lib:<id>` to that day's `resources`. Topics per
  day are listed in OUTLINE.

## Next steps
1. Founder pass: add own YouTube/Instagram material per day via the library pipeline.
2. Pilot with 5–10 learners per language on days 1–14. Collect real time-on-task and adjust `estMinutes`.
3. ~~Add event logging~~ — done: a first-party `events` table on apps day 34, used on days 36, 45, 54 and 65.
4. Re-verify the fast-moving items in REVIEW.md every quarter. Tool commands and model names will drift.
5. Later: AI review of submissions against each day's "you're done when…" checklist; the content is already
   structured for it.

## Round 2 (after merge)
- **Checked in the running app:** screenshots of both themes, both languages, 390 and 1280 px.
  - Quiz answers moved to callouts, because the renderer doesn't support `<details>`.
  - 734 hard-wrapped prompt lines reflowed.
- **Badges reconciled with the game's built-in rules:** `hello-agent`, `curious`, `saved-by-freeze`.
- **XP calibration** sent to the game agent: about 105 XP per day.
- **Library:** 23 seed resources mapped to days by canonical URL (learn doesn't render `lib:` ids yet).
- **Analytics:** first-party `events` table added on apps day 34.
- **Second language pass:** RU and EN, 189 files edited. Russian address is now gender-neutral and terms are unified.
- **Requests updated:** `curriculum-to-learn.md` (collapsible answers, resolve resources), `curriculum-to-game.md`,
  `curriculum-to-library.md`.
