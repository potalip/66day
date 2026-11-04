# curriculum → design (landing copy) — round 3, pedagogy moderation

I walked the landing page as a RU and an EN beginner at 390 px. The copy is strong. These lines contradict the program
or promise things it doesn't deliver (file: `web/src/features/landing/strings.ts`):

| # | Where | Now | Problem | Suggested |
|---|---|---|---|---|
| 1 | `en.apps.items[1]` | "Telegram and Discord bots…" | The program teaches Telegram bots only (apps 19–20, Mini App on 44). Discord never appears. | "Telegram bots and mini apps that do one useful thing well" |
| 2 | `whyBody` (both) | "average time… about 66 days" / «в среднем… около 66 дней» | The study (Lally et al., 2009) reports a **median** of ~66 days with a wide range (18–254). Day 66 teaches this honestly. | EN: "Habit research found that a new behaviour takes a median of about 66 days to become automatic — not 21, and it varies a lot from person to person." RU: «Исследование привычек показало: новое действие становится автоматическим в среднем (по медиане) примерно за 66 дней — не за 21, и у всех по-разному.» |
| 3 | `gameItems[2].d` (both) | "First deploy, first user, first 1,000 views" | No badge exists for 1,000 views or a first user. | EN: "Your first deploy, your first boss day, your public launch. Earned, not given." RU: «Первый деплой, первый босс-день, публичный запуск. Только за дело.» |
| 4 | `profile.badges` (both) | "Bot whisperer" / «Заклинатель ботов» | The real badge is "Bot Builder" / «Ботодел» (`content/badges.json`). | EN: ["It's Alive", "Bot Builder", "7-Day Streak"] · RU: ["Оно живое!", "Ботодел", "Неделя без пропусков"] |
| 5 | `faq[3].a` (both) | "we show the cheapest ways to get going" / «покажем самые недорогие способы, в том числе из России» | Day 1 is honest: Claude Code needs a paid plan or API credits, and in Russia Claude isn't officially available. "From Russia" over-promises. | EN: "Starting is free. You'll need an AI coding agent — usually a paid plan or API credits; day 1 walks you through the options, including cheaper ones." RU: «Начать — бесплатно. Нужен доступ к ИИ-агенту — обычно это платная подписка или оплата API. В первый день честно разбираем варианты, в том числе доступные в разных странах.» |
| 6 | `finalTitle` (both) | "Day 1 takes about an hour" | Day 1 is estimated at 75 min. | EN: "Day 1 takes about 75 minutes." RU: «Первый день — около полутора часов.» |
| 7 | RU `video.lead`, `studioTypes`, `studioBrief` | «объяснялки», «Объяснялка» | The lessons settled on «эксплейнер» (video days 25, 27, …). | «эксплейнеры», «Эксплейнер» |
| 8 | RU `dayTitle` | «Достаточно мало, чтобы начать. Достаточно, чтобы был толк.» | Sounds clumsy in Russian. | «Начать легко. Результат — настоящий.» |
| 9 | RU `gameItems`, `gameSub` | «Бейджи» | The rest of the product (profile, celebrations) says «Значки». | «Значки» |
| 10 | `phases[0].d` (both) | "your first real user" | Fine; consider "your first real person helped (day 13)" to match the boss. | optional |
