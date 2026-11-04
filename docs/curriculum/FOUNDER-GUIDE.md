# Founder guide · Гид для основателя

[English](#english) · [Русский](#русский)

---

## English

### 1. The program in five minutes

- **66 days, 4 phases:**
  - **Foundation** (1–14, everyone) → **Build** (15–35) → **Ship** (36–52) → **Portfolio & Earn** (53–66).
  - The tracks split on day 15: **Apps** and **Video**.
- **Shared days** stay shared all the way: days 1–14, every rest day (7, 14, 21 … 63), the earning block (57–60)
  and graduation (66).
- **Every day** has:
  - a short lesson;
  - 1–4 tasks, each with a proof: link, file, text or none;
  - copy-paste prompts for the coding agent;
  - a "You're done when…" checklist.

  A typical day takes 75–120 min. Rest days take 30–40 min.
- **Boss days:** 13 (one real person's problem), 27 (a real product or a published explainer), 41 (a real client
  brief), 55 (capstone beta) and 65 (public launch). Each one becomes a portfolio piece.
- **RU and EN are two adaptations, not translations.** Task ids and XP are identical, so progress and leaderboards
  are shared. Examples, platforms and payments differ.

Further reading:
- `docs/curriculum/DESIGN.md` — why it's built this way;
- `docs/curriculum/OUTLINE.md` — every day at a glance;
- `docs/curriculum/REVIEW.md` — what was checked, plus the list of facts to re-verify every quarter.

### 2. Adding your own YouTube / Instagram material so it lands on the right day

1. Open **`/en/admin`** (or `/ru/admin`) and enter the admin token. That's `ADMIN_TOKEN`: in `.dev.vars` locally,
   a Worker secret in production.
2. **Add resources → Paste links.** Paste one link or a whole message full of them: YouTube, Instagram reels,
   articles.
3. In **Batch settings**:
   - **Curriculum days:** pick the day(s), and the track for track days. Use the table in §6 to choose. Students on
     those days see the resource on their day page, and it shows up in the library under "Fits the program on".
   - **Write lessons for:** RU, EN or both. A Russian video can get an English lesson and the other way round.
   - **Notes for Claude:** the one thing to focus on, for example "only minutes 3–12, skip the sponsor part; the
     exercise should build on day 18's structured output".
4. The pipeline runs **Fetch → Transcript → RU lesson → EN lesson**. If captions can't be fetched (this is common for
   Instagram), it waits for you to paste the transcript or upload `.srt` / `.vtt`.
5. **Review:** read the lesson Claude drafted in each language, fix anything off, then **Save & approve** and
   **Publish**.
   - Without `ANTHROPIC_API_KEY` you get a starter draft to finish by hand.
   - A published resource with no approved lesson shows up as a plain link.
6. **Your own raw video:** use *Upload a video or a transcript*. Add the transcript yourself, or the media worker
   will transcribe it once it's deployed.

> **Tip:** one resource per day is plenty. The lesson body is self-sufficient, and resources are "go deeper", not
> required watching. Never map a 3-hour video to a busy build day; put long talks on rest days (7, 14, 21, 28…).

### 3. Editing a day file safely

Day files live in `content/curriculum/<lang>/<track>/day-NN.md`: YAML frontmatter plus a markdown body.

- **Change freely:** `title`, `summary` (≤140 chars), task `title`s, the body, `resources`.
- **Never change alone:** `day`, `track`, `phase`, task `id`s, `type`, `xp`, `proof`, task order, `badges`, `rest`,
  `boss`, `estMinutes`.
  - These are the shared skeleton. If one changes, it changes in **OUTLINE.md and in both languages** in the same
    commit.
  - Changing a task id after launch orphans students' progress, so don't.
- **Body rules:**
  - No raw HTML. It shows up as text.
  - Quiz answers go in a `> **Answers:**` / `> **Ответы:**` callout.
  - Agent prompts go in a ```text block, one line per bullet.
  - Callouts are `> **Tip:**`, `> **If you're stuck:**`, `> **Совет:**`, `> **Если застрял:**` and so on.
  - The full guide is `docs/curriculum/WRITING-GUIDE.md`.
- **Before you push:**

```bash
node docs/curriculum/tools/validate.mjs     # skeleton + format, both languages
npm run content:build -- --strict           # the app's own parser
npm run dev                                 # open /en/day/N and /ru/day/N and look at it
```

> **Tip:** to see a later day locally, use the dev-only helpers: `POST /api/progress/dev/time-travel` and complete
> earlier days. Or read the file in GitHub's preview, which renders the same markdown.

### 4. Two-week pilot plan

**Who:** 5–10 beginners per language, mixed operating systems (at least 3 on Windows), mixed tracks. Start everyone
on the same Monday.

**What they do:** days 1–14 (the shared foundation), one day per calendar day, as designed. A small group chat per
language, plus one 20-minute video call at the end of each week.

**What to measure:**

| Signal | How | Healthy |
|---|---|---|
| Day completion | `learn_day_progress` rows per day | ≥ 80 % finish day 2; ≥ 60 % finish day 13 |
| Where people drop | the first day each student never completed | no single day loses > 15 % |
| Real time per day | ask in the day-7 and day-14 reflections: "how long did each day take?"; compare with `estMinutes` | within ±30 % of the estimate |
| Stuck points | the reflection tasks (d04-t4, d07-t1, d14-t1) plus chat questions; tag each by day and step | no step blocks > 2 people |
| Proof quality | read `learn_submissions` (admin: `/api/progress/submissions`); score 0–2 per proof | median ≥ 1.5 |
| Streak health | streak ≥ 5 on day 7; returns after a miss | ≥ 70 %; anyone who missed came back |
| Track choice | the day-12 reflection (d12-t3) vs the track picked at onboarding | note who switches and why |
| Boss outcome | day 13: did a real person get something useful? (d13-t3 quote) | ≥ 70 % have a real quote |
| Love / pain | day 14: "How likely are you to recommend this to a friend, 0–10, and why?" | mostly 8+ |

Example queries (locally add `--local`; in production add `--remote`):

```bash
# completions per day
npx wrangler d1 execute DB --command "SELECT day, COUNT(*) AS students FROM learn_day_progress GROUP BY day ORDER BY day"
# the last finished day of each student (where did people stop?)
npx wrangler d1 execute DB --command "SELECT user_id, MAX(day) AS last_day FROM learn_day_progress GROUP BY user_id ORDER BY last_day"
# reflections for one day, to read
npx wrangler d1 execute DB --command "SELECT task_id, text_value FROM learn_submissions WHERE day = 7 AND proof_type = 'text'"
```

**After the pilot:**
1. Fix every step that blocked more than 2 people.
2. Adjust `estMinutes` using real times (OUTLINE plus both languages).
3. Rewrite the most-confusing paragraph of each day.
4. Re-run `validate.mjs`.

Then open days 15–28 to the same group.

### 5. Your weekly founder routine (30 min)

- Read 10 random proofs.
- Add 1–3 resources through the admin, mapped to days.
- Re-check one item on the "Re-verify every quarter" list in REVIEW.md.
- Post one student win (with permission) in each language's channel.

### 6. Which day for which kind of material

| Your material is about… | Day(s) |
|---|---|
| What coding agents are; first look at Claude Code | 1 |
| Git, GitHub, publishing a page | 2, 6 |
| Terminal basics; installing tools | 3 |
| Prompting an agent, CLAUDE.md / AGENTS.md | 4 |
| Reading HTML/CSS/JS, DevTools | 5 |
| APIs, JSON | 8 |
| LLMs explained, choosing models, API keys | 9 (long talks → 7, 14, 21) |
| Debugging with an agent | 10 |
| Serverless backends (Cloudflare Workers, Vercel) | 11 |
| Python + ffmpeg first video | 12 |
| Apps: UI / database / structured output / Telegram bots | apps 16 / 17 / 18 / 19–20 |
| Apps: multi-model, vision & voice, auth, RAG, tool use | apps 22 / 23 / 24 / 25 / 26 |
| Apps: tests & CI, internal tools, automations, payments, security | apps 29 / 30 / 31 / 32 / 33 |
| Apps: launch pages, feedback loops, parallel agents, MCP, queues | apps 36 / 37 / 38 / 39 / 40 |
| Apps: PWA, Telegram Mini Apps, analytics/SQL, voice agents, evals | apps 43 / 44 / 45 / 46 / 47 |
| Video: ffmpeg basics, pycairo motion, kinetic type, Remotion | video 15 / 16 / 17 / 18–19 |
| Video: sound, TTS, captions, shorts, explainers (Manim), data video | video 20 / 22 / 23 / 24 / 25 / 26 |
| Video: AI-generated clips, editing with code, scripts, brand kits, pipelines | video 29 / 30 / 31 / 32 / 33–34 |
| Video: publishing APIs, analytics, series, promos, pipeline as an app | video 36 / 37 / 38 / 39 / 40 |
| Video: generative visuals, tutorials, dubbing, auto-clipping, QC & ethics | video 43 / 44 / 45 / 46 / 47 |
| Portfolio, case studies, finding paid work, pitching | 57 / 58 / 59 / 60 |
| Launching publicly | apps/video 62, 65 |

---

## Русский

### 1. Программа за пять минут

- **66 дней, 4 этапа:**
  - **Фундамент** (1–14, для всех) → **Сборка** (15–35) → **Запуск** (36–52) → **Портфолио и заработок** (53–66).
  - С 15-го дня треки расходятся: **Приложения** и **Видео**.
- **Общими** остаются дни 1–14, все дни отдыха (7, 14, 21 … 63), блок про заработок (57–60) и выпускной (66).
- **В каждом дне:**
  - короткий урок;
  - 1–4 задания, у каждого своё доказательство: ссылка, файл, текст или без доказательства;
  - готовые промпты для агента;
  - чек-лист «Готово, когда…».

  Обычный день занимает 75–120 минут, день отдыха — 30–40.
- **Босс-дни:** 13 (проблема одного живого человека), 27 (настоящий продукт или опубликованный эксплейнер),
  41 (бриф от реального заказчика), 55 (бета финального проекта) и 65 (публичный запуск). Каждый из них становится
  работой в портфолио.
- **RU и EN — две адаптации, а не перевод.** Идентификаторы заданий и XP совпадают, поэтому прогресс и рейтинги
  общие. Примеры, площадки и способы оплаты — разные.

Что почитать:
- `docs/curriculum/DESIGN.md` — почему программа устроена именно так;
- `docs/curriculum/OUTLINE.md` — все дни одной таблицей;
- `docs/curriculum/REVIEW.md` — что уже проверено и что перепроверять раз в квартал.

### 2. Как добавить свои ролики с YouTube и Instagram, чтобы они попали в нужный день

1. Открой **`/ru/admin`** и введи токен администратора. Это `ADMIN_TOKEN`: локально он лежит в `.dev.vars`,
   в продакшене это секрет Worker.
2. **Добавить → Вставить ссылки.** Вставь одну ссылку или целое сообщение со ссылками: YouTube, рилсы Instagram,
   статьи.
3. В **настройках пачки**:
   - **Дни программы:** выбери день (или несколько) и трек, если день трековый. Подсказка — таблица в §6.
     Ученики этого дня увидят материал на странице урока, а в библиотеке он будет помечен как «Подходит к программе».
   - **Для кого писать уроки:** RU, EN или оба. К русскому ролику можно сделать английский урок, и наоборот.
   - **Заметки для Claude:** на чём сделать акцент. Например: «только с 3-й по 12-ю минуту, рекламу пропусти;
     упражнение — продолжение структурированного вывода с 18-го дня».
4. Конвейер идёт так: **Загрузка → Расшифровка → Урок RU → Урок EN**. Если субтитры не скачались (с Instagram это
   частая история), конвейер ждёт, пока ты вставишь расшифровку или загрузишь `.srt` / `.vtt`.
5. **Проверка:** прочитай черновик урока на каждом языке, поправь, что режет глаз, затем **Сохранить и одобрить**
   и **Опубликовать**.
   - Без `ANTHROPIC_API_KEY` получится стартовый черновик, его нужно дописать руками.
   - Опубликованный материал без одобренного урока ученики видят как обычную ссылку.
6. **Своё сырое видео:** раздел «Загрузить видео или расшифровку». Приложи расшифровку сам — или её сделает
   медиа-воркер, когда его задеплоят.

> **Совет:** одного материала на день достаточно. Урок самодостаточен, а материалы — это «копнуть глубже», а не
> обязательный просмотр. Трёхчасовую лекцию не ставь на плотный день сборки: длинным разговорам место в днях
> отдыха (7, 14, 21, 28…).

> **Важно:** Instagram в России без обходных путей недоступен, а советовать обход правил сервисов мы не можем. Для
> русскоязычной аудитории лучше подходят YouTube, VK Видео и Telegram. Рилс можно перезалить к себе — если права
> на него твои.

### 3. Как безопасно править файл дня

Файлы лежат в `content/curriculum/<язык>/<трек>/day-NN.md`: YAML-шапка плюс текст в markdown.

- **Можно менять свободно:** `title`, `summary` (до 140 символов), названия заданий, текст урока, `resources`.
- **Нельзя менять в одиночку:** `day`, `track`, `phase`, `id` заданий, `type`, `xp`, `proof`, порядок заданий,
  `badges`, `rest`, `boss`, `estMinutes`.
  - Это общий скелет программы. Если что-то из этого меняется, то в **OUTLINE.md и в обоих языках** одним коммитом.
  - Идентификаторы заданий после запуска не трогай: у учеников «потеряется» прогресс.
- **Правила текста:**
  - Никакого HTML — он покажется как текст.
  - Ответы к тестам — во врезке `> **Ответы:**`.
  - Промпты для агента — в блоке ```text, один пункт на строку.
  - Врезки — `> **Совет:**`, `> **Если застрял:**`, `> **Важно:**`.
  - Полные правила — в `docs/curriculum/WRITING-GUIDE.md`.
- **Перед пушем:**

```bash
node docs/curriculum/tools/validate.mjs     # скелет и формат, оба языка
npm run content:build -- --strict           # собственный парсер приложения
npm run dev                                 # открой /ru/day/N и /en/day/N и посмотри глазами
```

### 4. План пилота на две недели

**Кто:** по 5–10 новичков на каждый язык. Разные системы (минимум трое на Windows), разные треки. Все стартуют
в один понедельник.

**Что делают:** дни 1–14 (общий фундамент), как задумано — один день программы в один календарный день. Небольшой
чат на каждый язык и один созвон на 20 минут в конце каждой недели.

**Что измеряем:**

| Сигнал | Как | Норма |
|---|---|---|
| Прохождение дней | строки `learn_day_progress` по дням | день 2 закрывают ≥ 80 %, день 13 — ≥ 60 % |
| Где отваливаются | первый день, который человек так и не закрыл | ни один день не теряет больше 15 % |
| Реальное время | вопрос в рефлексиях дня 7 и дня 14: «сколько занял каждый день?»; сравни с `estMinutes` | в пределах ±30 % от оценки |
| Где застревают | рефлексии (d04-t4, d07-t1, d14-t1) плюс вопросы в чате; размечай по дню и шагу | ни один шаг не блокирует больше двух человек |
| Качество доказательств | читай `learn_submissions` (в админке: `/api/progress/submissions`), ставь 0–2 за каждое | медиана ≥ 1,5 |
| Серии | серия ≥ 5 к 7-му дню; возвращаются ли после пропуска | ≥ 70 %; все пропустившие вернулись |
| Выбор трека | рефлексия дня 12 (d12-t3) против трека из онбординга | записывай, кто переключился и почему |
| Итог босса | день 13: получил ли живой человек что-то полезное (цитата в d13-t3) | ≥ 70 % с настоящей цитатой |
| Восторг и боль | день 14: «Насколько вероятно, что посоветуешь другу, от 0 до 10, и почему?» | в основном 8+ |

Примеры запросов — в §4 английской части выше, они одинаковые.

**После пилота:**
1. Исправь каждый шаг, на котором застряли больше двух человек.
2. Поправь `estMinutes` по реальному времени (в OUTLINE и в обоих языках).
3. Перепиши самый непонятный абзац каждого дня.
4. Прогони `validate.mjs`.

Потом открой той же группе дни 15–28.

### 5. Еженедельная рутина основателя (30 минут)

- Прочитай 10 случайных доказательств.
- Добавь 1–3 материала через админку и привяжи их к дням.
- Перепроверь один пункт из списка «Re-verify every quarter» в REVIEW.md.
- С разрешения ученика расскажи об одной его победе в канале каждого языка.

### 6. Какой материал в какой день

Таблица одна на оба языка — она в §6 английской части выше. Ориентир такой: тема материала = тема дня в OUTLINE.md.
Длинные обзорные лекции уходят в дни отдыха.
