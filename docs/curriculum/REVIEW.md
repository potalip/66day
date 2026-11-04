# Curriculum self-review (moderation pass)

**Scope:** all 212 day files (106 RU + 106 EN), `program.json` ×2, `badges.json`.
**Method:** five independent review passes, one each for common days, apps 15–41, apps 43–65, video 15–41 and
video 43–65. Each pass read every file in its slice in both languages twice:
- as a **skeptical beginner** — no coding background, 1–2 hours a day, possibly on Windows;
- as a **strict editor** — technical accuracy, outdated advice, repetition, continuity, safety, and native language
  quality.

Fixes were made in place. After that I (the director) resolved cross-slice items and changes to the outline. The
validator (`docs/curriculum/tools/validate.mjs`) and the learn agent's `scripts/build-content.mjs --strict` both pass
on the final state.

## Verdict

The program is complete and consistent:
- Every day produces something real.
- Every build or ship task has copy-pasteable agent prompts and a clear proof.
- Every day ends with a "you're done when…" checklist.
- RU and EN are genuine adaptations, with different running examples, platforms, payment rails and humour.
- The task skeleton is identical across the two languages.

Most problems found were at the **seams between writers** (folders, file names, script names, terms) and in
**beginner pitfalls on real machines** (PowerShell, Homebrew Python, `master` vs `main`). There were also a handful of
technical bugs that would have stopped students cold. All of these are fixed.

## Most important fixes

### Things that would have broken for a student
- **Day 2:** older git versions create `master`, so the Pages instruction "pick `main`" failed. Added
  `git config --global init.defaultBranch main` plus a fallback.
- **Day 8 (Windows):** `curl` in Windows PowerShell is an alias for another command. Students now use `curl.exe`.
- **Day 11 (Windows):** PowerShell blocks `npx` scripts by default. Added the execution-policy fix and referenced it
  from later days.
- **Days 12, 13, 15:** a plain `pip install` fails on Homebrew Python and recent Ubuntu
  (externally-managed-environment). Python work now happens in a project `.venv`; the video track has one shared
  `~/66/video/.venv`.
- **Day 9:** the API-key folder could have ended up inside the public promise-page repo. It is now a separate folder.
- **Day 14:** the folder setup produced nested git repos. Fixed: apps gets its repo on day 15, video's repo is
  created on day 14.
- **Apps 20:** local long-polling code can't reach a D1 binding. Added a storage interface: SQLite locally, D1 in
  production.
- **Apps 31, the cron-to-Telegram automation:** three blockers fixed.
  - The bot secrets were missing from the main Worker.
  - `getUpdates` conflicts with the day-20 webhook.
  - The local cron test used the wrong port.
- **Apps 32 (ЮKassa):** the idempotence key must be one per purchase and reused on retry. Also added an explicit note
  that a Stripe `trigger` event has no `client_reference_id`.
- **Apps 39 (MCP):** the app's API now accepts a bearer token, so the MCP server can authenticate.
- **Apps 44 (Mini App):** the Telegram script was loaded on a condition that could never be true.
- **Apps 46:** iOS Safari records mp4/AAC, not webm.
- **Video 32:** the "re-skin by config only" check could never pass. Video 44: ffmpeg `crop` cannot animate its size.
- **Video 55/62:** they called a non-existent `upload.py`. They now reuse the day-36 upload scripts, and warn that an
  unverified Google project locks uploads to private.

### Continuity and conventions unified across writers
- **Folders:**
  - `~/66-day-promise` (days 1–6);
  - `~/66/apps/main-app` as the single apps repo, with `bot/` and `mcp/` inside it and client projects in
    `~/66/apps/<client>`;
  - `~/66/video/pipeline/` from video day 29;
  - `runs/<capstone>/NN/` for capstone outputs.
- **Script evolution:** `make.py` (video 27, v0) becomes `make-video` (video 33, v1). `brand.json` is a single source
  starting from the day-18 brand.
- **Apps capstone files:** `docs/CAPSTONE.md`, `docs/BUILDLOG.md`, `docs/LATER.md` and `docs/COSTS.md` are introduced
  on days 50–52 and reused through day 65.
- **Day 50 promises now match what days 51–65 actually ask for.** Video series: 3–5 episodes. Showreel: 3–5 pieces
  plus a reel cut on common day 58.
- **Callbacks between days are true:** the day-1 answer, the day-14 letter and the day-21 commit count all return on
  day 66. The day-13 mini case study becomes the day-58 draft.
- **Track boundaries:** common days no longer reference track-only days (day 57 pointed to apps day 16). Video
  students never did the apps bot days, so video day 36 (RU) and video day 40 now include a compact Telegram bot primer.
- **RU terminology unified:** «дневник сборки» (build log), «эксплейнер» (explainer), «крючок (хук)» (hook),
  «минут».

### Honesty, safety and ethics
- **Regional reality:**
  - Claude and OpenAI are unavailable in Russia, so lessons name GigaChat and YandexGPT and give fallbacks without
    advising anyone to work around a service's rules.
  - Cloudflare and YouTube are slow or throttled in Russia, so lessons point to VK Видео, Rutube, Telegram and Yandex
    Cloud alternatives.
  - Paid posts in Russian Telegram channels need the legally required ad marking.
- **Earning block:**
  - Students are told plainly that the first paid job usually takes weeks.
  - They are told to check how freelance income is registered and taxed where they live (самозанятость/НПД is
    mentioned neutrally).
  - Outreach is one-to-one only; mass mailing is spam.
- **Launch rules:** no upvote rings on Show HN, Product Hunt or Reddit. Habr self-promotion goes through a useful
  article or the «Я пиарюсь» hub.
- **Video rights:**
  - consent for voice cloning;
  - disclosure when a video is dubbed or uses an AI voice;
  - "credit is not a licence" when clipping someone else's content;
  - Silero TTS is non-commercial and Remotion needs a company licence;
  - the Pixabay Content ID caveat.
- **Day 66:** the habit-research claim was corrected to a *median* of about 66 days, with a wide range between people
  (Lally et al., 2009).

### Language quality
- **RU:** calques removed (e.g. «думательная работа», «Новичковые приложения»), the post templates made
  gender-neutral, English leftovers removed from prose, and «ёлочки» quotes used.
- **EN:** reads natural and global; no changes needed beyond clarity edits.

## Changes to the outline after review

| Change | Reason |
|---|---|
| Day 2: 75 → 90 min | GitHub account + 2FA + installing git/gh (+ Homebrew on macOS) + Pages takes longer for a beginner |
| Apps 20: 120 → 130 min | Per-user memory, a dual-storage adapter and a webhook deploy in one day |
| Apps 32: 135 min | ЮKassa needs a public URL (tunnel) before the first notification arrives |
| Apps 46: 135 min | A streaming voice pipeline plus latency tuning |
| Video 33 and 40: 150 min | An eight-stage pipeline; a web form + worker + failure tests |
| Video 36 t2: "private or unlisted test" | YouTube locks API uploads from unverified projects to private |
| Video 50 outcome: precise scope per capstone type | It now matches what days 51–65 deliver |
| Phase 3 "running thread" paragraphs for both tracks | Writers and readers see the arc |
| Day-40 teaser (both tracks): book tomorrow's client call today | The day-41 boss needs lead time |

## Known gaps (not fixed, deliberately or out of scope)

- ~~**Apps 45:** asks for activation numbers before event logging exists.~~ **Fixed after review:** apps day 34 now
  builds a first-party `events` table in D1 with a `track()` helper (session_started, signup_completed,
  core_action_done, ai_called, upgrade_clicked; anonymous id linked on sign-up; no personal data). Day 36 adds
  `cta_clicked`, day 45 queries the table, day 54 adds the beta events to it, and day 65's report reads it.
  Plausible/PostHog are now an optional mirror.
- **Apps 29:** the optional Playwright test in CI would need a local D1 migration step. It is described only in
  prose.
- **Apps 53–54 and video 54:** need outside testers with a 24–48-hour lead time. Day 52 already tells students to
  line testers up, but the time estimate covers only the student's own effort.
- **Boss days 65:** the estimate covers 150 minutes of the student's own effort, spread over 24 hours. The learn UI
  might want to label this ("over a day").
- **Bodies with code:** some go above 900 words when code blocks are counted. Prose is within 300–900 everywhere;
  prompts are the point of those days.
- **Resource links:** every day has 1–4 vetted official docs. None of the founder's own videos are linked yet. They
  are meant to arrive via the library pipeline as `lib:<id>` entries.

## Re-verify every quarter (fast-moving facts)

- **Agents & models**
  - Claude Code install commands and plan requirement; availability by country.
  - Model ids (`claude-sonnet-5-5`, `claude-opus-5-5`) and structured-output parameters.
  - OpenAI, Gemini and Groq free tiers; OpenRouter key limits; GigaChat certificate and free tier; YandexGPT model
    names.
  - MCP SDK package names; `claude mcp add` flags; Claude Code slash commands.
- **Install & tooling**
  - winget ids (Python, Node, FFmpeg, GitHub CLI); `gh` in apt; git's default branch name.
  - Wrangler config, the Cloudflare Vite plugin and its local scheduled-test URL; Queues on the free plan; the Rate
    Limiting binding; FTS5 in D1.
  - GitHub `actions/*` major versions; the 60-day auto-disable of scheduled workflows.
  - Playwright CLI; Lighthouse/axe; `vite-plugin-pwa`; `node-sql-parser`; Better Auth on Workers.
- **Telegram:** grammY Workers adapter; Bot API limits; Mini App `signature` field; Stars (XTR) policy and
  `refundStarPayment`; the Login widget's `/setdomain`.
- **Payments & money**
  - Stripe CLI and the countries where Stripe is available; Paddle / Lemon Squeezy / Gumroad payout countries.
  - ЮKassa API v3, test shop requirements and test cards.
  - самозанятость limits; Upwork, Contra and FL.ru fees and rules.
- **Video**
  - Video-generation models (Veo via the Gemini API, Runway, Luma, Kling) — names, availability, pricing.
  - TTS providers: OpenAI, ElevenLabs, SpeechKit, and the Silero licence.
  - Remotion licence threshold and `<Audio>` API; MoviePy v2.
  - YouTube Data API: audit/private-lock, `publishAt`, the synthetic-media field, quota, Shorts length.
  - VK ID token flow and `video.save`.
  - ffmpeg `atempo` range and `zoompan` behaviour.
- **Platforms & rules**
  - YouTube and Cloudflare reachability from Russia.
  - Platform AI-labelling rules: YouTube, TikTok/Meta (C2PA), and RU platforms and law.
  - The Russian ad-marking law; iOS PWA behaviour (push, storage eviction).
  - Product Hunt, Show HN, Reddit and Habr launch rules.

## How to re-run the checks

```bash
node docs/curriculum/tools/validate.mjs          # skeleton + format, both languages
npm run content:build -- --strict                # learn's parser (once merged on main)
```
