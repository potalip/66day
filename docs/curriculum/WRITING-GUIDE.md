# Writing guide for day files (RU + EN)

Everyone who writes or edits a day file follows this. The skeleton (day, track, task ids, types, XP, proof, badges,
rest/boss flags, phase) comes **verbatim** from `OUTLINE.md`. Everything else — title, summary, body, examples,
resources — is authored natively per language.

## File location and frontmatter

`content/curriculum/<lang>/<track>/day-NN.md` (NN = two digits). Frontmatter must be valid YAML; quote every string
that contains `:` `#` `"` or starts with a special char. Use double quotes and escape inner double quotes, or use
« » in Russian.

```markdown
---
day: 16
track: apps
phase: 2
title: "Интерфейс, который не выглядит сгенерированным"
summary: "Собираешь главный экран своего приложения — сначала для телефона — и улучшаешь его по скриншотам."
estMinutes: 90
badges: [some-id]          # only if OUTLINE lists a badge for that day
rest: true                 # only on rest days
boss: true                 # only on boss days
resources:
  - https://react.dev/learn
tasks:
  - id: d16-apps-t1
    type: read
    title: "Пять правил интерфейса, который выглядит продуманным"
    xp: 10
    proof: none
---
```

- `phase`: 1 for days 1–14, 2 for 15–35, 3 for 36–52, 4 for 53–66.
- `estMinutes` = the minutes in OUTLINE's Outcome cell (same in both languages).
- Task `title` = native, specific, imperative ("Задеплой бота на вебхуке", "Deploy the bot on a webhook").
- `summary`: one sentence, ≤ 140 characters, shown on the path map. Sells the outcome, not the topic.
- `resources`: 1–4 URLs (quoting them, `- "https://…"`, is recommended; the validator accepts both), **only from the vetted list below** (or ones you are certain exist). Language-appropriate
  (RU gets RU versions where they exist). The founder will later add their own videos via the library pipeline — don't
  invent YouTube links.

## Body structure (300–900 words of prose, code blocks not counted; rest days 200–400)

Use this skeleton, with native headings:

1. **Hook** — 2–4 sentences: why today matters, tied to the student's running project. No fluff, no "In this lesson we will".
2. **Concept** (`## …`) — the minimum theory, in plain words with one concrete analogy or example. Short paragraphs.
3. **Step by step** (`## …`) — numbered steps matching the tasks. Each build/ship step includes **a copy-pasteable
   prompt for the coding agent** in a fenced block (```text). Prompts follow goal → context → constraints → done-when. Don't hard-wrap prompt lines: one bullet = one line (the
   code block wraps softly, and agents get clean input on paste).
   Show real commands in ```bash blocks where useful.
4. Callouts as blockquotes: `> **Tip:** …`, `> **Важно:** …`, `> **If you're stuck:** …`, `> **Безопасность:** …`.
   At least one "if you're stuck" callout on build days.
5. For quiz tasks: a short `## Quiz` / `## Мини-тест` section with 3–4 questions, followed by the answers in a
   callout: `> **Answers:**` / `> **Ответы:**` (every line prefixed with `>`). **No raw HTML** — the lesson renderer
   shows HTML as text, so `<details>` doesn't work.
6. **You're done when…** (`## You're done when…` / `## Готово, когда…`) — a checklist (`- [ ]`) mapping to the tasks and
   their proof ("you pasted the live link").
7. Optional one-line **Tomorrow** teaser (story continuity).

## Voice

  If a resource exists in the library seed (`worker/lib/library/seed/resources.json`), use its exact `url`, so
  `/api/library/resolve` can match it to the library card. `lib:<id>` is valid too, but use it only once the learn UI
  resolves ids (see `docs/requests/curriculum-to-learn.md`).
- **RU**: на «ты», живо и по-человечески, как сильный старший товарищ. No calques ("давай погрузимся", "в этом уроке
  мы будем"). Natural tech slang where devs use it (задеплоить, коммит, репозиторий, промпт). Local realities where they
  matter: Telegram, VK, Rutube, Дзен, Habr, VC.ru, Kwork/FL.ru/Хабр Фриланс, ЮKassa/CloudPayments/Telegram Stars,
  Timeweb Cloud/Selectel/Yandex Cloud; Yandex SpeechKit / Silero for Russian TTS; GigaChat/YandexGPT as regional model
  options. The audience is Russian-speaking worldwide (Russia, Kazakhstan, Armenia, Georgia, Serbia, Israel, EU…):
  where service availability or payments differ by country, say so honestly and briefly ("если сервис недоступен в твоей
  стране — вот альтернатива"), never advise breaking a service's terms.
- **EN**: warm, direct, global English. Examples from a global context (X/Threads, YouTube, TikTok, Reels, Product Hunt,
  Show HN, Reddit, Upwork/Contra, Stripe). Avoid US-only assumptions.
- Both: second person, active voice, concrete numbers ("15 minutes", "3 people"), small wins, a little humor, zero
  hype. No lorem ipsum, no "[insert here]". Explain every new term once.
- Not translations: different examples, jokes and platforms are encouraged; the tasks must be equivalent.

## Tools stance (late 2026)

- Coding agents: Claude Code is the primary example (terminal, desktop app, web). Always say any capable agent works
  (Codex CLI, Gemini CLI, Cursor, etc.) and write prompts that are agent-agnostic. Project memory file:
  `CLAUDE.md` (Claude Code) / `AGENTS.md` (most other agents).
- Models: refer to model *families and tiers* (fast/cheap vs smart/expensive) and tell students to check the provider's
  current model list; when naming Claude ids use `claude-sonnet-5-5` (default) and `claude-opus-5-5` (heavy). Other
  providers: OpenAI, Google Gemini, open-weight models via OpenRouter or Groq. Don't quote exact prices — teach how to
  read a pricing page and estimate.
- Hosting: GitHub Pages (static), Cloudflare Workers/Pages, Vercel. Databases: Cloudflare D1, SQLite, Supabase.
- Telegram: grammY (JS/TS) or aiogram (Python). Payments: Stripe (EN), ЮKassa / Telegram Stars (RU, + Stripe where
  available).
- Video: ffmpeg, Python + pycairo (or Pillow), Remotion, Manim, Motion Canvas, MoviePy; Whisper / faster-whisper;
  TTS via ElevenLabs, OpenAI, Yandex SpeechKit, Silero; video generation via APIs (e.g. Google Veo via Gemini API,
  Runway, Luma, or aggregators like Replicate / fal).
- **No no-code automation tools** (n8n, Make, Zapier) — ever. Automation = code + APIs.
- Safety: never paste API keys into chats or commits; `.env` + `.gitignore`; set spend limits; consent for voices and
  likeness; respect licences and robots.txt.

## Vetted resource URLs

General / agents: https://docs.anthropic.com/en/docs/claude-code/overview · https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview ·
https://docs.anthropic.com/en/docs/build-with-claude/tool-use · https://www.anthropic.com/engineering/building-effective-agents ·
https://modelcontextprotocol.io/ · https://missing.csail.mit.edu/

Web basics: https://developer.mozilla.org/en-US/docs/Learn · https://developer.mozilla.org/ru/docs/Learn ·
https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview · https://developer.mozilla.org/ru/docs/Web/HTTP/Overview ·
https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps · https://www.json.org/json-en.html · https://www.json.org/json-ru.html ·
https://react.dev/learn · https://ru.react.dev/learn · https://tailwindcss.com/docs · https://vite.dev/guide/

Git: https://git-scm.com/book/en/v2 · https://git-scm.com/book/ru/v2 · https://learngitbranching.js.org/ ·
https://docs.github.com/en/pages/getting-started-with-github-pages · https://docs.github.com/en/get-started/start-your-journey/hello-world ·
https://docs.github.com/en/actions · https://choosealicense.com/

Runtimes: https://nodejs.org/en/learn · https://docs.python.org/3/tutorial/ · https://docs.astral.sh/uv/

APIs & models: https://docs.anthropic.com/en/api/getting-started · https://platform.openai.com/docs · https://ai.google.dev/gemini-api/docs ·
https://openrouter.ai/docs · https://console.groq.com/docs · https://open-meteo.com/en/docs · https://www.cbr-xml-daily.ru/ ·
https://jsonplaceholder.typicode.com/

Backend & data: https://developers.cloudflare.com/workers/ · https://developers.cloudflare.com/d1/ · https://developers.cloudflare.com/queues/ ·
https://developers.cloudflare.com/workers/configuration/cron-triggers/ · https://vercel.com/docs · https://supabase.com/docs ·
https://www.sqlite.org/docs.html · https://www.sqlite.org/fts5.html · https://12factor.net/ · https://12factor.net/ru/ · https://vitest.dev/ · https://playwright.dev/

Telegram: https://core.telegram.org/bots/tutorial · https://core.telegram.org/bots/api · https://core.telegram.org/bots/webapps ·
https://core.telegram.org/bots/payments-stars · https://core.telegram.org/widgets/login · https://grammy.dev/ · https://docs.aiogram.dev/

Payments & security: https://docs.stripe.com/payments/checkout · https://docs.stripe.com/webhooks · https://yookassa.ru/developers ·
https://owasp.org/www-project-top-10-for-large-language-model-applications/ · https://plausible.io/docs · https://posthog.com/docs

Video: https://ffmpeg.org/documentation.html · https://trac.ffmpeg.org/wiki · https://pycairo.readthedocs.io/ · https://www.remotion.dev/docs/ ·
https://docs.manim.community/ · https://motioncanvas.io/docs/ · https://zulko.github.io/moviepy/ · https://github.com/openai/whisper ·
https://github.com/SYSTRAN/faster-whisper · https://elevenlabs.io/docs · https://platform.openai.com/docs/guides/text-to-speech ·
https://yandex.cloud/ru/docs/speechkit/ · https://github.com/snakers4/silero-models · https://developers.google.com/youtube/v3 ·
https://dev.vk.com/ · https://p5js.org/ · https://www.shadertoy.com/ · https://docs.replicate.com/ · https://fal.ai/docs ·
https://pixabay.com/music/ · https://freesound.org/ · https://fonts.google.com/ · https://ourworldindata.org/

Work & launch: https://www.producthunt.com/ · https://news.ycombinator.com/showhn.html · https://www.upwork.com/ · https://contra.com/ ·
https://kwork.ru/ · https://www.fl.ru/ · https://freelance.habr.com/ · https://habr.com/ · https://vc.ru/

## Self-check before you finish a file

- Frontmatter skeleton identical to OUTLINE; same in RU and EN.
- Every build/ship task has a prompt block and a clear proof instruction.
- Time realistic for a beginner (the agent does the typing; the student reads, decides, tests).
- A "you're done when" checklist exists.
- Body word count in range. No English leftovers in RU and vice versa (code/commands excepted).
