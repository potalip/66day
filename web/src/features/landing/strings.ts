// Landing copy. OWNER: design agent. RU and EN are separate adaptations, not translations. RU uses "ты".
export const landing = {
  en: {
    meta: "FlowLeaf 66 — build with AI every day for 66 days",
    eyebrow: "A 66-day program · in English and Russian",
    heroA: "In 66 days, building with AI",
    heroB: "becomes a",
    heroEm: "habit",
    heroEnd: ".",
    sub: "A day-by-day program for complete beginners. One to two hours a day with real AI coding agents, real projects you ship in public — and a portfolio to prove it.",
    ctaStart: "Start free",
    ctaHow: "See how a day works",
    trust: ["No coding experience needed", "1–2 hours a day", "Free to start"],
    map: { label: "Your 66-day path", today: "Today", done: "Done", boss: "Boss day", rest: "Rest day", day: "Day" },
    float: { task: "Day 12 · Ship your first bot", xp: "+40 XP", streak: "9-day streak" },

    whyTitle: "Why 66?",
    whyBody: "Habit research puts the average time for a behaviour to become automatic at about 66 days. Not 21. We built the whole program around that number: a short, clear session every day until opening your editor and talking to an agent feels as normal as checking messages.",

    pathsEyebrow: "Two paths",
    pathsTitle: "Pick what you want to make. Switch any time.",
    pathsSub: "The first two weeks are shared — tools, prompting, your first deploy. Then the tracks split.",
    apps: {
      name: "Apps",
      lead: "Solve real problems with web apps, tools and bots — built with Claude Code and other coding agents, powered by the newest AI models through their APIs.",
      items: ["A personal site and landing pages that are actually live", "Telegram and Discord bots that do one useful thing well", "Small tools for your job: parsers, dashboards, AI helpers", "A capstone app with real users and a public launch"],
      tag: "For builders",
    },
    video: {
      name: "Video",
      lead: "Make many kinds of video with code and AI: motion graphics, animated explainers, kinetic type, data videos and shorts — through pipelines you build yourself.",
      items: ["Kinetic typography and motion graphics, rendered from code", "Explainers and data videos with AI-written scripts", "AI-generated clips cut into reels and shorts", "Your own repeatable video pipeline, like our Studio"],
      tag: "For storytellers",
    },
    noNoCode: "No drag-and-drop automation tools. Just coding agents, APIs and you — the skills that last.",

    dayEyebrow: "How a day works",
    dayTitle: "Small enough to start. Big enough to matter.",
    steps: [
      { t: "Read the lesson", d: "Ten minutes, one idea, written for today's task. No hour-long lectures.", m: "10 min" },
      { t: "Build with an agent", d: "You describe, the agent writes code, you steer. Every day ends with something that runs.", m: "45–90 min" },
      { t: "Show the proof", d: "A link, a screenshot or a file. Your work stays reviewable and lands in your portfolio.", m: "2 min" },
      { t: "Earn and reflect", d: "XP, streaks and badges. Every seventh day is lighter: rest, review, look back.", m: "5 min" },
    ],
    todayCard: { label: "Today", title: "Day 12 · Your first bot", meta: "Apps · about 70 min", tasks: ["Read: what a bot actually is", "Ask the agent to scaffold a Telegram bot", "Make it answer one real question", "Paste the bot link as proof"], xp: "+120 XP" },

    gameEyebrow: "The game layer",
    gameTitle: "Progress you can feel, every single day.",
    gameSub: "Streaks keep you coming back. Badges mark real milestones, not clicks. Weekly leaderboards reset, so it's never too late to climb.",
    gameItems: [
      { t: "XP and levels", d: "Every task and finished day adds up. Boss days are worth more." },
      { t: "Streaks with freezes", d: "Missed a day? A freeze saves your streak — life happens." },
      { t: "Badges", d: "First deploy, first user, first 1,000 views. Earned, not given." },
      { t: "Leaderboards", d: "Weekly and all-time, global and by track." },
    ],
    profile: { name: "Maya Chen", track: "Apps · Level 4", streak: "days", xp: "XP", rank: "this week", badges: ["First deploy", "Bot whisperer", "7-day streak"] },

    studioEyebrow: "Studio",
    studioTitle: "Describe a video. Get a video.",
    studioSub: "Pick a type and a style, write a short brief. Claude plans the script and storyboard, the render server turns it into a finished file — right inside the platform.",
    studioTypes: ["Kinetic type", "Explainer", "Data story", "Product promo", "Short / reel"],
    studioBrief: "30-second explainer: why sleep matters for learning. Calm, minimal, green accents.",
    studioScenes: ["Hook", "Problem", "Idea", "Proof", "Call to action"],
    studioStatus: "Rendering · scene 3 of 5",

    libEyebrow: "The library",
    libTitle: "The best of the internet, turned into lessons.",
    libSub: "Curated videos, reels and articles about building with AI. Each one comes with a summary, key steps, an exercise and a quiz — written separately for each language, not machine-translated.",
    libItems: [
      { kind: "YouTube", t: "Building a full app with Claude Code in one sitting", meta: "Apps · 18 min" },
      { kind: "Reel", t: "3 prompts that make your agent write cleaner code", meta: "Apps · 1 min" },
      { kind: "Article", t: "Motion design basics for people who code", meta: "Video · 9 min read" },
    ],
    libMore: "Summary · Steps · Exercise · Quiz",

    phasesEyebrow: "The 66 days",
    phasesTitle: "From your first prompt to a public launch.",
    phases: [
      { t: "Foundation", d: "Tools, terminal, prompting, your first deploy." },
      { t: "Build", d: "Real projects every day, with boss days as milestones." },
      { t: "Ship", d: "Users, feedback, polish, going public." },
      { t: "Portfolio", d: "A capstone and a portfolio page you can send to anyone." },
    ],
    phaseDays: ["Days 1–14", "Days 15–35", "Days 36–52", "Days 53–66"],

    faqTitle: "Questions, answered",
    faq: [
      { q: "I've never written code. Is this for me?", a: "Yes — that's who it's for. You'll work with AI coding agents from day one. You learn to read code, steer the agent and debug calmly, not to memorise syntax." },
      { q: "How much time do I need?", a: "One to two hours a day. Every day shows an estimate up front, and every seventh day is lighter." },
      { q: "What if I miss a day?", a: "Nothing breaks. Streak freezes cover the occasional miss, and you can always catch up at your own pace." },
      { q: "What does it cost?", a: "Starting is free. You'll need access to an AI coding agent; we show the cheapest ways to get going." },
      { q: "English or Russian?", a: "Both, as equals. Each language has its own program with examples, platforms and resources picked for that audience. You can switch any time." },
    ],

    finalTitle: "Day 1 takes about an hour.",
    finalSub: "Pick a path, set your daily time, and ship something small today.",
    finalNote: "Free to start · No credit card",
  },

  ru: {
    meta: "FlowLeaf 66 — 66 дней создавай с ИИ каждый день",
    eyebrow: "Программа на 66 дней · на русском и английском",
    heroA: "За 66 дней создавать с ИИ",
    heroB: "станет",
    heroEm: "привычкой",
    heroEnd: ".",
    sub: "Программа «день за днём» для тех, кто начинает с нуля. Час-два в день с настоящими ИИ-агентами, реальные проекты, которые ты публикуешь, — и портфолио, которое это доказывает.",
    ctaStart: "Начать бесплатно",
    ctaHow: "Как устроен день",
    trust: ["Опыт в коде не нужен", "1–2 часа в день", "Начать — бесплатно"],
    map: { label: "Твой путь на 66 дней", today: "Сегодня", done: "Пройдено", boss: "Босс-день", rest: "День отдыха", day: "День" },
    float: { task: "День 12 · Первый бот готов", xp: "+40 XP", streak: "9 дней подряд" },

    whyTitle: "Почему 66?",
    whyBody: "Исследования привычек говорят: чтобы действие стало автоматическим, в среднем нужно около 66 дней. Не 21. Вся программа построена вокруг этого числа — короткое понятное занятие каждый день, пока открыть редактор и поговорить с агентом не станет так же естественно, как проверить сообщения.",

    pathsEyebrow: "Два пути",
    pathsTitle: "Выбери, что хочешь создавать. Сменить можно в любой момент.",
    pathsSub: "Первые две недели — общие: инструменты, промпты, первый деплой. Дальше треки расходятся.",
    apps: {
      name: "Приложения",
      lead: "Решай реальные задачи веб-приложениями, сервисами и ботами — с помощью Claude Code и других ИИ-агентов, на свежих моделях через API.",
      items: ["Личный сайт и лендинги, которые реально работают в сети", "Telegram-боты, которые хорошо делают одну полезную вещь", "Инструменты для работы: парсеры, дашборды, ИИ-помощники", "Итоговое приложение с живыми пользователями и публичным запуском"],
      tag: "Для тех, кто строит",
    },
    video: {
      name: "Видео",
      lead: "Делай разные видео с помощью кода и ИИ: моушн-графику, анимированные объяснялки, кинетическую типографику, видео на данных и шортсы — через пайплайны, которые соберёшь сам.",
      items: ["Кинетическая типографика и моушн, отрисованные кодом", "Объясняющие ролики и видео на данных со сценарием от ИИ", "ИИ-клипы, смонтированные в рилсы и шортсы для YouTube и VK", "Свой повторяемый видео-пайплайн — как наша Студия"],
      tag: "Для тех, кто рассказывает",
    },
    noNoCode: "Никаких конструкторов и автоматизаций «мышкой». Только ИИ-агенты, API и ты — навыки, которые останутся с тобой.",

    dayEyebrow: "Как устроен день",
    dayTitle: "Достаточно мало, чтобы начать. Достаточно много, чтобы был толк.",
    steps: [
      { t: "Прочитай урок", d: "Десять минут, одна идея — ровно под сегодняшнюю задачу. Без часовых лекций.", m: "10 мин" },
      { t: "Собери с агентом", d: "Ты описываешь, агент пишет код, ты направляешь. Каждый день заканчивается тем, что работает.", m: "45–90 мин" },
      { t: "Покажи результат", d: "Ссылка, скриншот или файл. Работа сохраняется и попадает в портфолио.", m: "2 мин" },
      { t: "Получи XP и оглянись", d: "Опыт, серии и бейджи. Каждый седьмой день — полегче: отдых, повторение, рефлексия.", m: "5 мин" },
    ],
    todayCard: { label: "Сегодня", title: "День 12 · Первый бот", meta: "Приложения · около 70 мин", tasks: ["Прочитай: что такое бот на самом деле", "Попроси агента создать Telegram-бота", "Научи его отвечать на один реальный вопрос", "Вставь ссылку на бота как результат"], xp: "+120 XP" },

    gameEyebrow: "Игровой слой",
    gameTitle: "Прогресс, который чувствуешь каждый день.",
    gameSub: "Серии возвращают тебя завтра. Бейджи отмечают настоящие этапы, а не клики. Недельный рейтинг обнуляется — подняться никогда не поздно.",
    gameItems: [
      { t: "XP и уровни", d: "Каждая задача и каждый день идут в копилку. Босс-дни ценнее." },
      { t: "Серии с заморозкой", d: "Пропустил день? Заморозка сохранит серию — жизнь бывает разной." },
      { t: "Бейджи", d: "Первый деплой, первый пользователь, первая тысяча просмотров. Только за дело." },
      { t: "Рейтинги", d: "За неделю и за всё время, общий и по трекам." },
    ],
    profile: { name: "Аня Смирнова", track: "Приложения · Уровень 4", streak: "дней", xp: "XP", rank: "за неделю", badges: ["Первый деплой", "Заклинатель ботов", "Серия 7 дней"] },

    studioEyebrow: "Студия",
    studioTitle: "Опиши видео — получи видео.",
    studioSub: "Выбери тип и стиль, напиши короткий бриф. Claude продумает сценарий и раскадровку, рендер-сервер соберёт готовый файл — прямо внутри платформы.",
    studioTypes: ["Кинетический текст", "Объяснялка", "История на данных", "Промо продукта", "Шортс / рилс"],
    studioBrief: "Объяснялка на 30 секунд: почему сон важен для учёбы. Спокойно, минималистично, зелёные акценты.",
    studioScenes: ["Крючок", "Проблема", "Идея", "Доказательство", "Призыв"],
    studioStatus: "Рендер · сцена 3 из 5",

    libEyebrow: "Библиотека",
    libTitle: "Лучшее из интернета — в виде уроков.",
    libSub: "Отобранные видео, рилсы и статьи о создании с ИИ. К каждому — конспект, ключевые шаги, упражнение и квиз. Для каждого языка — свои, а не машинный перевод.",
    libItems: [
      { kind: "YouTube", t: "Целое приложение на Claude Code за один вечер", meta: "Приложения · 18 мин" },
      { kind: "Рилс", t: "3 промпта, после которых агент пишет чище", meta: "Приложения · 1 мин" },
      { kind: "Telegram", t: "Основы моушн-дизайна для тех, кто пишет код", meta: "Видео · 9 мин чтения" },
    ],
    libMore: "Конспект · Шаги · Упражнение · Квиз",

    phasesEyebrow: "66 дней",
    phasesTitle: "От первого промпта до публичного запуска.",
    phases: [
      { t: "Фундамент", d: "Инструменты, терминал, промпты, первый деплой." },
      { t: "Практика", d: "Реальные проекты каждый день, босс-дни как контрольные точки." },
      { t: "Запуск", d: "Пользователи, обратная связь, доводка, выход в публичное поле." },
      { t: "Портфолио", d: "Итоговый проект и страница-портфолио, которую не стыдно отправить." },
    ],
    phaseDays: ["Дни 1–14", "Дни 15–35", "Дни 36–52", "Дни 53–66"],

    faqTitle: "Частые вопросы",
    faq: [
      { q: "Я никогда не писал код. Мне подойдёт?", a: "Да — программа именно для этого. С первого дня ты работаешь с ИИ-агентами. Учишься читать код, направлять агента и спокойно разбираться с ошибками, а не зубрить синтаксис." },
      { q: "Сколько нужно времени?", a: "Час-два в день. У каждого дня заранее указано, сколько он займёт, а каждый седьмой — полегче." },
      { q: "А если пропущу день?", a: "Ничего не сломается. Заморозка серии прикроет редкий пропуск, а догнать программу можно в своём темпе." },
      { q: "Сколько это стоит?", a: "Начать — бесплатно. Понадобится доступ к ИИ-агенту; покажем самые недорогие способы, в том числе из России." },
      { q: "На русском или на английском?", a: "На обоих, на равных. У каждого языка своя программа: примеры, платформы и материалы подобраны под свою аудиторию. Переключиться можно в любой момент." },
    ],

    finalTitle: "Первый день — примерно час.",
    finalSub: "Выбери путь, назначь время на каждый день и опубликуй что-то маленькое уже сегодня.",
    finalNote: "Бесплатно · Без карты",
  },
};
export type LandingStrings = typeof landing.en;
