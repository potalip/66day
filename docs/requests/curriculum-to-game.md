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

## Round 3: pedagogy moderation of the game copy and profile
1. **Profile badge grid** shows both tracks' track-only badges to every student. A video student sees «Ботодел» and "Model Whisperer".
   - Hide (or grey out as "other track") badges that only a day of the other track awards: apps-only bot-builder, model-whisperer, money-ready; video-only voice-on, pipeline-architect.
   - The mapping is derivable from `shared/curriculum.generated.json` (which track's day lists the badge).
2. **Count:** "0 из 41" mixes 30 curriculum badges and the built-ins. That's fine, but consider counting only badges reachable on the student's track.
3. **Copy:** streak/freeze/recap copy matches the program's "showing up beats perfection" stance. No changes needed.
4. **Weekly quests:** see `docs/curriculum/quests.md`, ten ideas per track plus shared ones, each with a measurable rule.

## Final moderator pass (after PR #17)
Weekly quests match `docs/curriculum/quests.md` exactly: 25 quests, the same week windows, XP and copy. The profile
hides the other track's badges, and the new built-ins `public-builder` and `polyglot` are good. Last copy items in
`worker/lib/game/badges.ts` and `quests.json`:
1. **`polyglot` RU:** «Прочитал один и тот же урок на двух языках.» is masculine. Make it «Один и тот же урок — на двух языках.»
2. **`tasks-50` RU:** «…— это уже портфолио.» over-claims; a portfolio is days 57–58. Make it «Пятьдесят закрытых заданий — это уже солидный багаж.», which matches EN "a body of work".
3. **`q-apps-helper` RU description** in `quests.json`: «…чему научился сам.» is masculine. Make it «Помоги новичку: объяснять — лучший способ понять.» (I updated quests.md to match.)
4. **Legacy badge ids:** a dev user who earned `first-day` / `boss-1` before they left the catalog sees the raw ids as badge titles on the profile. If any real user could hold them, keep them as hidden legacy entries with copy, or skip unknown ids when rendering.
