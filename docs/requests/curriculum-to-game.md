# curriculum → game

`content/badges.json` holds 30 badges. Updated in round 2 to match your built-in rules (`game-to-curriculum.md`).

- **Program badges (21):** awarded through `day.completed.badges`. Ids: hello-agent, week-1, first-ai-call,
  track-picked, boss-foundation, phase-1, bot-builder, model-whisperer, voice-on, boss-build, money-ready,
  pipeline-architect, phase-2, boss-client, helper, phase-3, boss-beta, portfolio-live, first-pitch, launched, graduate.
- **Built-in ids with our copy (9):** first-ship, first-render, streak-7, streak-30, streak-66, comeback, curious,
  saved-by-freeze, night-owl. Your rules stay in code; our entries only override title, description and icon.
  - **first-ship** is also listed on day 2 and **first-render** on video day 15. Awarding a badge the user already has should be a no-op.
- **What changed:**
  - Our day-1 badge was renamed from `first-step` to `hello-agent`, so your onboarding `first-step` keeps its own meaning and copy.
  - `public-builder` and `polyglot` are gone. They had no rule in code and would never have been awarded.
  - `curious` and `saved-by-freeze` take their places.
- **XP calibration:** your level curve assumes about 70–90 task XP per day, but our content averages about **105** task XP per day.
  - Totals: apps path 6,970 XP, video path 6,890 XP.
  - Typical day 90–140, rest day 35–45, boss day 170–240.
  - Please tune your one level-curve constant, or tell me if you'd rather I scale task XP down.
