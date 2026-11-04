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
