# curriculum → library

I mapped the seeded resources to curriculum days. The day files reference them by their seed `url`, which
`/resolve` matches. Please align `suggestedDays` in `seed/resources.json` with this, so `/by-day` agrees with the
lesson pages.

| Resource | Day(s) · track | Why there |
|---|---|---|
| seed-claude-code-intro | 1 common | Day 1 installs the agent; the 4-minute intro shows what it looks like |
| seed-cc-docs-overview | 1 common (also wherever Claude Code docs were cited, ~10 days) | The official overview |
| seed-github-hello-world | 2 common | First repo + push |
| seed-git-ru-basics | 2, 6 common (RU) | Git for beginners in Russian |
| seed-mastering-claude-code, seed-cc-best-practices | 4 common | The prompting / project-memory day |
| seed-prompt-engineering | 4 common, apps 18, others citing it | Prompting basics |
| seed-mdn-getting-started (EN) / seed-mdn-learn-ru (RU) | 5 common (+ days citing MDN Learn) | Reading HTML/CSS/JS |
| seed-pro-git-en / seed-pro-git-ru | 2, 6 common | Branches, revert |
| seed-3b1b-gpt | 7 common (rest day watch) | An optional, beautiful explainer for a calm day |
| seed-karpathy-intro-llm | 9 common | First AI call: what a model is |
| seed-cf-workers-start | 11 common | The first serverless backend |
| seed-karpathy-software-3 | 14 common (rest) | The big picture at the end of phase 1 |
| seed-karpathy-deep-dive | 21 common (rest) | A long optional weekend watch |
| seed-anthropic-courses | apps 18 | Prompts as code, structured outputs |
| seed-building-effective-agents | apps 26 (+ apps 38, 39, 41, 47 that cite it) | Tool use and the agent loop |
| seed-fireship-remotion, seed-ffmpeg-docs | video 15 | "Video made with code" is the day's theme |
| seed-remotion-fundamentals | video 18 | Remotion part 1 |
| seed-manim-3b1b-demo, seed-manim-docs | video 25 | Animated explainers with Manim |
| seed-fireship-claude-37 | not used | Outdated (Claude 3.7); consider unpublishing or labelling it historical |

The founder's own material can be mapped the same way. The topics for each day are in `docs/curriculum/OUTLINE.md`.

## Round 3: pedagogy moderation of the library copy (`web/src/features/library/strings.ts`)
1. **Terminology:**
   - RU `topics.apis: «AI API»` → «API для ИИ».
   - RU `topics["ai-video"]: «AI-видео»` → «ИИ-видео».
   - The rest of the product says «ИИ».
2. **Track labels:** `track.common: "Foundation" / «База»` clashes with phase 1 "Foundation / Фундамент". Common days also run through
   the whole program (rest days, 57–60, 66). Learn uses "Everyone" / «Для всех».
3. **Instagram for RU viewers:** `instagramNote` only mentions login. For the RU audience, Instagram isn't reachable in
   Russia without workarounds, and lessons never advise working around service rules.
   - Prefer YouTube/VK/Telegram sources for RU-audience resources.
   - Show RU viewers: «Instagram может быть недоступен в твоей стране — урок ниже можно пройти и без видео.»
4. **Lesson quizzes:** your in-library quiz UI is good. The curriculum uses the same "check yourself" idea, so "Проверь себя" matches.
