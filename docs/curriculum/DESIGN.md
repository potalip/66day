# FlowLeaf 66 — curriculum design

> In 66 days, building with AI becomes a habit — and you'll have a portfolio to prove it.

This document is the pedagogy behind the program: who it's for, what they'll be able to do, how the 66 days are
shaped, and why. The day-by-day skeleton is in [`OUTLINE.md`](OUTLINE.md); the authoring rules are in
[`WRITING-GUIDE.md`](WRITING-GUIDE.md); the content contract is [`../CONTENT-FORMAT.md`](../CONTENT-FORMAT.md).

---

## 1. Design principles

1. **Ship on day 2, then every day.** Every single day ends with an artifact that exists outside the student's head:
   a live URL, a commit, a rendered mp4, a bot people can message, a post. No day is "just theory".
2. **The agent types, the student directs.** We don't teach syntax first. We teach *directing*: stating goals,
   giving context, setting constraints, defining "done", reading what came back, testing it, and deciding. Code
   literacy (reading HTML, diffs, errors, SQL) is taught exactly when it's needed to make a decision.
3. **Real people, early.** Day 13 is the first boss: solve one real person's problem. Day 27: three real users.
   Day 41: a real client brief. Day 55: a public beta. Day 65: a public launch. Real feedback beats any grader.
4. **Small wins daily, big wins every two weeks.** Daily tasks are sized so a beginner finishes in 45–120 minutes;
   boss days are bigger milestones that go straight into the portfolio.
5. **Build in public.** Share tasks appear 1–2× a week, from "send your link to one person" (day 2) to a public
   launch. Public building creates accountability, a network and — later — clients.
6. **Habit over heroics.** 66 days is the average time for a behaviour to become automatic. We optimise for
   *showing up*: rest days count for the streak, freezes exist, the comeback badge rewards returning after a miss.
7. **Two native audiences.** Russian and English are separately authored adaptations with the same skeleton:
   examples, platforms, payments, humour and references are chosen for each audience.
8. **Coding agents + APIs only.** No n8n / Make / Zapier. When we automate, we write (have the agent write) code.
   This is what transfers to paid work and to whatever tool comes next.

## 2. Learners

### Personas — English

- **Maya, 29, marketing coordinator (Lisbon).** Uses ChatGPT daily, never opened a terminal. Wants to build small
  internal tools for her team and maybe freelance. Has 1 hour after work. Fear: "I'm not technical." Win condition:
  her team uses something she built. Track: **apps**.
- **Dev, 22, final-year economics student (Bangalore).** Curious, competitive, wants a portfolio that gets him a job
  or remote gigs. Will binge on weekends. Fear: falling behind people who "already code". Track: **apps**.
- **Sam, 35, video editor (Manchester).** Edits by hand in Premiere, sees AI eating the low end of the market. Wants
  to automate repetitive edits and offer AI-powered video at scale. Fear: losing craft. Track: **video**.
- **Lena, 41, small-business owner (Toronto).** Runs a bakery, wants to stop paying for five SaaS tools and make her
  own promo videos. Practical, impatient with jargon. Track: either — usually **video** first, then apps.

### Персоны — русскоязычные

- **Аня, 27, менеджер проектов (Алматы).** Каждый день пользуется нейросетями, но код видела только в чужих
  скриншотах. Хочет делать Telegram-ботов и внутренние инструменты для команды, потом — подработку. Страх: «я
  гуманитарий». Трек: **приложения**.
- **Тимур, 19, студент (Казань).** Хочет портфолио и первые заказы на Kwork / в Telegram-чатах. Много энергии,
  мало системы. Страх: бросить на второй неделе. Трек: **приложения**.
- **Ольга, 34, SMM-специалист (Белград).** Ведёт соцсети нескольким клиентам, монтирует ролики вручную в CapCut.
  Хочет поставить производство коротких видео на поток. Страх: «ИИ-видео выглядит дёшево». Трек: **видео**.
- **Михаил, 45, владелец небольшой автомастерской (Екатеринбург).** Хочет бота для записи клиентов и ролики для
  VK и Telegram-канала. Практик, не терпит «воды». Трек: любой, чаще **приложения**.

Common traits: no prior coding, motivated, 1–2 hours a day, mostly on phones when reading (lessons must read well at
390 px), on a laptop when building. Russian-speaking learners live in many countries; service availability and
payment options differ — lessons say so honestly and offer alternatives without advising anyone to break terms.

## 3. Learning outcomes

By day 66 a graduate can:

**Everyone (common core)**
1. Direct a coding agent through a full build: spec → plan → implement → verify → commit, including rescuing a
   stuck session.
2. Use the terminal, git and GitHub confidently enough to never lose work and to review an agent's diff.
3. Call web APIs and AI models from code, choose a model by quality/latency/cost, and keep keys and budgets safe.
4. Deploy a static site and a serverless backend; ship something a stranger can use.
5. Interview a user, scope a v1, collect feedback and iterate.
6. Present work: a portfolio site, case studies, a demo video, and five real proposals sent.

**Apps track**
7. Build and deploy a full-stack AI web app: UI, database, auth, structured-output AI features, file retrieval with
   citations, tool use, payments (test mode), tests + CI, analytics, background jobs.
8. Build Telegram bots and a Telegram Mini App; make an installable PWA; build a small MCP server.
9. Evaluate AI features with a golden set; defend against prompt injection and runaway costs.

**Video track**
7. Render video entirely from code: ffmpeg, Python motion graphics, kinetic type, Remotion templates, Manim/Motion
   Canvas explainers, data videos, generative visuals.
8. Produce sound, TTS voiceover, word-level captions, dubbing into a second language, AI-generated clips edited by
   code, and vertical shorts that hold attention.
9. Own a reusable pipeline (`make-video "topic"` → finished multi-format video), wrapped as an app, with QC checks,
   rights hygiene and publishing via APIs.

## 4. The arc: four phases

| Phase | Days | Name | The student becomes… |
|---|---|---|---|
| 1 | 1–14 | **Foundation** | someone who ships. Page live on day 2; APIs, AI calls, a backend, a real person helped by day 13. |
| 2 | 15–35 | **Build** | a builder with a craft: a full-stack AI app with users / a fully code-made explainer and a pipeline. |
| 3 | 36–52 | **Ship** | a builder who works with others: launch pages, feedback loops, clients, publishing, parallel agents. Capstone begins. |
| 4 | 53–66 | **Portfolio & Earn** | a professional: capstone launched publicly, portfolio, case study, first pitches, a plan for the next 66 days. |

**Story.** The program is framed as a journey: the student plants a leaf on day 1 (the "66-day promise" page) and the
path map grows into a tree. Each phase has a "boss" guarding the gate. The tone is a calm, witty mentor — not a
hype coach. Small surprises are scattered through rest days (a ritual, a challenge, a tiny game) and the game layer
holds secret badges (night shift, polyglot).

### Why the tracks split on day 15

Days 1–14 are the irreducible common core: an agent, a terminal, git, the web, APIs, models, a backend, debugging.
Both tracks need all of it — video pipelines are software too. Day 12 lets every student taste both tracks in 30
minutes each before choosing; day 13's boss accepts either a tool or a code-made video. Switching tracks later is
allowed (task ids are track-specific, so progress is kept per track).

### Common days after the split

Rest days (21, 28, 35, 42, 49, 56, 63), the earning block (57–60) and graduation (66) are common: they are about the
person, not the stack, and keeping them shared keeps the cohort together for community moments.

## 5. Difficulty ramp

- **Scaffolding fades.** Days 1–6 give full prompts to copy. Days 8–14 give prompt templates with blanks. From day 15
  lessons give a template prompt *and* ask the student to adapt it to their project. From day 36 students write their
  own specs and the lesson provides checklists and review rubrics instead.
- **Scope grows.** One file (day 1) → one repo (2) → frontend + API (8–11) → full-stack app or multi-stage pipeline
  (15–34) → product with users and clients (36–52) → public launch (65).
- **Decisions grow.** Early days decide almost nothing ("use this"). Later days require choices with justification:
  which model (22), which storage (17), what to cut (51), what not to fix before launch (54).
- **Each skill appears three times:** introduced, used in a project, used under pressure on a boss day. Example: git
  — day 2 push, day 6 branches/revert, day 38 parallel agents on worktrees.

## 6. The weekly rhythm

| Day of week | Shape |
|---|---|
| 1 | New concept + build (fresh energy) |
| 2–4 | Build days, each adding one capability to the running project |
| 5 | Integration or a harder build |
| 6 | Boss day (every second week) or a stretch build |
| 7 | **Rest & reflect** — 30–40 min: reflection, a public post, a tidy-up or helping someone. Still counts for the streak. |

Rest days are deliberately small but never empty: each has a reflection prompt, a share or a micro-task, and one
small surprise. They are where the habit is consolidated and the community is touched.

## 7. Boss days

| Day | Boss | Portfolio piece |
|---|---|---|
| 13 | **Foundation boss** — interview one real person and solve their annoyance (tool or 20–30 s video). | Mini case study #1 |
| 27 | **Apps:** full-stack AI app v1 with 3 real users. **Video:** 60-second explainer made 100 % with code, published. | Product / published video |
| 41 | **Client brief** — real business or creator; discovery → build/produce → hand-over → case study. | Client case study |
| 55 | **Capstone beta / premiere** — public, with first metrics and a user quote. | Capstone (beta) |
| 65 | **Capstone launch** — public launch, 24-hour report, thank-you post. | Capstone (launched) |

Boss days run 150–180 minutes (weekend-friendly), carry ~200 XP and a badge, and always end with a public share.

## 8. How proof works

Every task declares a `proof` type:

- `link` — a live URL, repo, commit, PR, CI run, post. The default for build/ship work: if it's real, it has a URL.
- `file` — a screenshot or an mp4 (video track) when a URL isn't natural.
- `text` — a reflection, a pasted spec, a command output, a quote from a user, numbers.
- `none` — reading and quizzes (honour system; quizzes are self-checked with hidden answers).

Rules: never paste secrets as proof (lessons say so explicitly on day 9 and 11); proof is stored on the submission
record so AI review can be added later without changing content; each lesson ends with "You're done when…" which
maps checklist items one-to-one to proof.

## 9. XP, streaks and effort

XP is a proxy for effort, not for talent:

| Task type | XP | Why |
|---|---|---|
| read / watch | 10 | Necessary but cheap |
| quiz | 15 | Retrieval practice |
| reflect | 15–30 | Reflection is where learning sticks |
| share | 20–30 | Public building is scary; reward courage |
| build | 20–80 | Scales with scope |
| ship | 50–120 | Putting it in front of people is the point |

A normal day is 90–140 XP, a rest day 35–45, a boss day 170–240. Totals: **apps path 6,970 XP, video path 6,890 XP**
(close enough that per-track leaderboards and global leaderboards stay fair). A rest day is worth less XP but the
same streak credit as any day: the streak rewards showing up, XP rewards doing.

Streak = days with at least one completed task. Streak freezes (game layer) protect against life. Badges for
streak 7 / 30 / 66 and a **comeback** badge for returning after a gap — we celebrate returning, not perfection.

## 10. The capstone

Days 49–65. Day 49 (rest) asks for a shortlist of three ideas; day 50 picks one and writes a spec with milestones and
kill criteria; 51–54 build, polish and test with real people; 55 opens a public beta/premiere; 61–64 productize,
prepare the launch and dry-run it; 65 is launch day; 66 puts it into the portfolio.

- **Apps capstone:** a real product with real users and AI at the core (often the evolved main app from phase 2).
- **Video capstone:** a series of 5+ episodes, a video tool/pipeline product, or a client-grade showreel.

Criteria: real users or viewers, AI doing meaningful work, public, and something the student cares about enough to
keep after day 66.

## 11. From portfolio to paid work

The program deliberately ends on earning, not on a certificate:

1. Boss days generate case-study material from day 13 onward (problem → what I built → reaction).
2. Day 41 is a real client brief — often the first testimonial.
3. Days 57–58: portfolio site, a written case study, a 60–90 s demo/showreel.
4. Days 59–60: market scan of real postings (EN: Upwork, Contra, local businesses, creators; RU: Kwork, FL.ru,
   Хабр Фриланс, Telegram order chats, local business), a one-sentence offer with a price, five tailored pitches.
5. Day 61: productize — a starter kit (apps) or a sellable pipeline service (video) that makes the next client
   faster and cheaper to serve.
6. Later (platform roadmap): verified portfolios feed a jobs/gigs marketplace; boss-day proofs become credentials.

## 12. Community touchpoints

- Day 2: send your link to one person. Day 7: first public post. Day 12: start a public build log.
- Weekly share tasks (show-and-tell on rest days).
- Day 42: help a newer learner — explaining is the best test of understanding (badge **Hand Up**).
- Boss days end with public case studies; launch day asks students to be present in the comments.
- RU community lives where RU learners are (Telegram chats/channels, VK); EN community on X/Threads/LinkedIn,
  Discord-style groups. The platform's leaderboards (weekly, all-time, per track) make the cohort visible.

## 13. Entertainment and surprise

- Boss framing and badge names with personality ("It's Alive", "Night Shift").
- Rest-day rituals that change every week (a letter to day-66 you, a tidy-up, a show-and-tell, a fear inventory).
- Challenge formats inside lessons: bug hunts with planted bugs (day 10), hook battles (video 24), model arenas
  (apps 22), headline votes (apps 36), "re-skin by config only" (video 32).
- Secret badges discovered by behaviour, not announced on the path map.

## 14. Lesson anatomy

Every day file: hook (why today matters for *your* project) → minimal concept with one analogy → numbered steps with
copy-pasteable agent prompts and real commands → callouts ("Tip", "If you're stuck", "Safety") → quiz with hidden
answers where relevant → **You're done when…** checklist → a one-line teaser for tomorrow. 300–900 words; rest days
200–400. Time estimates assume a beginner on their first try (the agent types; the student reads, decides, tests).

## 15. Resources and the library

Each day lists 1–4 vetted official resources (docs and well-known references, language-appropriate). The founder's
own YouTube/Instagram material will be added later through the smart resource pipeline: the library suggests a
curriculum day for each processed resource and, once approved, appends `lib:<id>` entries to that day's
`resources` (the content format already accepts both URLs and `lib:` ids). Lessons never depend on a resource to
be completable — the lesson body is self-sufficient.

## 16. Maintenance

- `node docs/curriculum/tools/validate.mjs` checks every day file against the skeleton in `OUTLINE.md` (ids, XP,
  proof, flags, badges, phase, minutes) and the content-format rules; run it before every push.
- Tools move fast. Lessons name tool *families* and say "check the current docs"; model ids appear only where
  required. `REVIEW.md` lists items to re-verify each quarter.
