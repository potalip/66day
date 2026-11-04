# curriculum → learn

The full curriculum is on `agent/curriculum`: 212 day files, and your `build-content.mjs --strict --check` passes on it.

Please:
- **Boss day 65 (both tracks):** label it "spread over a day". Its 150 minutes span 24 hours, covering launch, staying in the comments, and the report.
- **`estMinutes`:** show it as an estimate ("~90 min").
- **Quiz answers:** keep `<details><summary>…</summary>…</details>` blocks collapsed. Every quiz uses them for hidden answers.
- **Checklists:** render `- [ ]` lines (the "You're done when…" sections) as a visual checklist. They are not tasks and award no XP.
- **Tables:** lessons use GFM tables, so allow horizontal scroll at 390px.

## Update (round 2)
- Quiz answers no longer use `<details>`, because the renderer shows raw HTML as text. Every quiz is now followed by a callout:
  `> **Answers:**` (EN) or `> **Ответы:**` (RU). 90 lessons have one.
  - **Nice to have:** render a callout with that label collapsed, behind a "Show answers" / «Показать ответы» toggle, so students try the quiz first.
- Agent prompts in ```text blocks are now one line per bullet and rely on soft wrapping. Keep `white-space: pre-wrap` on code blocks.
- Checked in the real app with Playwright (light and dark, 390 and 1280 px, EN and RU): tables, callouts, checklists, code blocks and resources all render well.

## Library resources on day pages (round 2)
- `DayView` shows a `lib:<id>` resource as plain grey text with the raw id. So for now the curriculum references library
  resources by their **exact canonical URL** from the library seed. 82 day files use 23 of the 24 seeds; the one left
  out is the outdated "Claude 3.7" video.
- `GET /api/library/resolve?lang=&url=…` already maps those URLs, and `lib:<id>` too, to published cards.
  - **Please:** resolve `day.resources` through it and render cards: title in the student's language, hook, duration.
  - Fall back to the plain link for anything that doesn't resolve.
  - Then I can switch to `lib:<id>` wherever that's cleaner.

## Round 3: pedagogy moderation of onboarding / Today / path / day pages

Walked as RU (video) and EN (apps) beginners at 390 px, light theme.

**Onboarding** (`web/src/features/onboarding/strings.ts`)
1. `track.body`: "Days 1–10 are shared" / «Дни 1–10 общие» is **wrong**. Days 1–14 are shared, and day 12 lets students taste both tracks.
   - EN: "Days 1–14 are shared; on day 12 you try both tracks. After that, your track decides the projects. You can switch later."
   - RU: «Дни 1–14 общие, на 12-й день попробуешь оба трека. Дальше трек определяет проекты. Сменить можно в любой момент.»
2. `welcome.points[0]`: "Most days take an hour or so" undersells. Typical days are 75–120 min, rest days 30–40.
   - EN: "Most days take 1–2 hours; every 7th day is a short rest day."
   - RU: «Обычно 1–2 часа; каждый седьмой день — короткий день отдыха.»
3. `time.options[0]` (30 min, "Tight days. You'll do the core task."): the program can't be done in 30 min/day. Keep the option, but be honest:
   - EN: "Some days will take two or three sittings — that's fine."
   - RU: «Некоторые дни растянутся на два-три подхода — это нормально.»
   - Consider recommending 90 min.
4. `done.body`: "Find an hour today" → "Find about 75 minutes today" / «Найди сегодня около полутора часов».

**Day page / Today** (`web/src/features/learn/strings.ts`, `DayView.tsx`)
5. Proof inputs: add one safety line under text and link proofs, because the lessons repeat it on days 9, 11, 19 and 31.
   - EN: "Never paste passwords or API keys."
   - RU: «Никогда не вставляй пароли и API-ключи.»
6. RU `boss: «День босса»` → «Босс-день». That's what the lessons, landing and profile say.
7. RU `badgeEarned / badgeToEarn` use «значок». Good, keep it (landing is asked to drop «бейджи»).
8. **Day 12 is the track decision day.** When day 12 completes, the celebration could ask: "Stay on Apps / switch to Video?" (link to `/start` change). The lesson tells students to switch in their profile, but nothing in the UI prompts it.
9. **Resources:** resolve `day.resources` via `/api/library/resolve` (see the round 2 note). 82 day files reference library resources by URL today.
10. **Quiz answers:** collapse `> **Answers:**` / `> **Ответы:**` callouts behind a toggle (see the round 2 note).
11. **Boss day 65:** `spreadOverDay` exists; use it for day 65 (both tracks) as well as 13/27/41/55 if they're flagged boss. Only 65 truly spans 24 hours.

What already matches the program well:
- `restHint`, `bossHint`, `doneForTodayBody` (one day per calendar day), the catching-up copy and the celebration lines.

## Final moderator pass (after PR #22)
Checked in the running app (RU/video and EN/apps, 390 px and 1280 px). Onboarding copy, the `secretsHint` on proofs,
«Босс-день», the collapsed «Ответы» toggle and library cards on day pages all match the program now. Thank you.

One last item:
- **Resources heading:** the cards now show library lesson times such as «Урок 1 ч 30 мин» or «Урок 50 мин». On a
  90-minute day, a beginner reads that as required work. Please rename the section:
  - EN: "Go deeper (optional)"
  - RU: «Копнуть глубже (по желанию)»

  If there's room, add a one-line hint under it:
  - EN: "Today's lesson is complete on its own."
  - RU: «Урок дня самодостаточен — это для тех, кому интересно больше.»
