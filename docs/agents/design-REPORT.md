# Design agent — report

Branch `agent/design` · PR #1 `[design] Design system: tokens, UI kit (web/src/ui), Shell, landing`.

## What's built
- **`docs/DESIGN.md`** covers principles, type scale, color tokens (light/dark), spacing, radii, elevation, motion,
  icons, logo, illustration style, a component catalogue, patterns, and voice & tone in RU and EN.
  The founder's reference site (aiuxplayground.com/skills) did not resolve from the sandbox (DNS blocked), so I followed
  the direction in the spec and brief. This is noted in DESIGN.md.
- **Tokens** (`web/src/styles.css`): I kept the original token names and added `surface-3`, `line-strong`,
  `accent-hover/-ink`, `gold-bright/-ink`, `danger-soft/-ink`, `info/-soft`, `ring`, `overlay`, 3 radii, 3 shadows and
  motion durations/easing. styles.css also holds base typography, focus ring, reduced motion, `.prose-fl`,
  dialog/sheet styles and skeleton shimmer. **WCAG AA is enforced by a test** (`web/src/ui/tokens.test.ts`). The test
  caught two real failures, which I then fixed: light accent → `#187a4e`, light gold → `#8a6410`.
- **Fonts**: Onest Variable (UI, with real Cyrillic), Source Serif 4 italic (one editorial word per headline),
  JetBrains Mono. All self-hosted via @fontsource.
- **UI kit `web/src/ui`** (`import … from "@web/ui"`): Button/ButtonLink/buttonClass, Card(+Header/Title/Description),
  Badge, Chip, Field, Input, Textarea, Select, Checkbox, Switch, Tabs, Segmented, Dialog/Sheet (native `<dialog>`),
  ToastProvider/useToast (includes a gold "reward" tone), ProgressBar/ProgressRing, Skeleton/SkeletonText/SkeletonCard,
  EmptyState, Avatar, Tooltip, PageHeader/SectionTitle, ThemeToggle, LangSwitcher, Logo/LeafMark, Markdown/Prose
  (a safe parser), Stat, Kbd, Divider, Container, Spinner, AiNotice ("AI not configured"), useFormat (locale numbers,
  RU plurals, dates). The theme store is now shared across components (`useTheme` / `useResolvedTheme`).
- **Shell**: leaf logo mark, sticky translucent header, desktop nav, RU/EN switch (keeps path, query and hash),
  theme toggle, profile link (or a "Start free" button on the landing page), and a bottom tab bar on mobile that
  respects the safe area. The footer is full on the landing page and compact in the app. Onboarding (`/start`) gets
  focus chrome with no nav. Also: skip link, `<html lang>` sync, and a favicon injected at runtime.
- **Landing** (`web/src/features/landing`), written natively in RU and EN:
  - hero with a live-looking 66-cell path map
  - "Why 66"
  - the two paths
  - how a day works, with a Today card mock
  - game layer, with a profile mock
  - Studio teaser, with a storyboard mock
  - library
  - the 4 phases, aligned with the curriculum outline (boss days 13/27/41/55/65)
  - FAQ
  - final CTA to `/:lang/start`

  RU is adapted, not translated: Telegram/VK, a Telegram resource, a note about paying from Russia.
- **Showcase** `web/src/ui/Showcase.tsx`: every component in both languages, plus token swatches and the type scale.
  It is not routed yet (see requests).

## How to test
```
npm install && npm run dev
open /en and /ru                         # landing; toggle theme in the header and footer
npx vitest run --config web/src/ui/vitest.config.ts   # 65 tests: markdown, contrast, formatters, landing strings
```
Showcase: until the orchestrator wires it, add `{ path: "ui", element: <Showcase /> }` locally (import from
`./ui/Showcase`) and open `/en/ui`.

Verified with Playwright: landing and showcase × EN/RU × light/dark × 390/1280 px, with no horizontal page scroll and
no console errors. Also checked:
- the dialog opens as a bottom sheet on phones, focus moves into it, and Esc closes it
- toasts sit above the mobile tab bar
- keyboard tab order on the landing is skip link → logo → nav → language → theme → CTA

## Requests filed
- `docs/requests/design-to-orchestrator.md`:
  - wire `/:lang/ui`
  - `publicDir: "web/public"` plus a favicon link
  - theme-color meta tags
  - a root `vitest.config.ts`, because `npm test` crashes with the cloudflare() plugin
  - ignore `*.tsbuildinfo`
  - the new deps: fonts and lucide-react
- `docs/requests/design-to-game.md`: swap the local Card/Segmented/Button/Skeleton/Avatar/ring/toast for the kit.
- `docs/requests/design-to-learn.md`: Markdown renderer, path-cell visual language, checklist/proof inputs, focus chrome.

## Known gaps
- The landing mocks are illustrative and static. They don't read real data.
- The Dialog picks "bottom vs center" when it renders and doesn't re-evaluate on resize while open.
- Tooltip has no collision detection beyond the `align` prop.
- Markdown deliberately skips tables, raw HTML and nested blockquotes. Lists nest one level.
- There's no OG image or `<meta description>` yet, because index.html is orchestrator-owned.
- Feature pages built before the kit merged (game) still use local copies. Requests are filed.

## Next steps
- Once other branches merge: screenshot every app page in the Shell and file follow-ups for spacing/title consistency.
- An OG/social image (1200×630) in the leaf + path-map style, plus an app icon set (PNG 192/512) for a PWA manifest.
- A tiny celebration component (gold ring burst) shared by learn and game for day completion.

---

## Round 2 — cross-app design QA (on main @ d30deba)
- **Walkthrough:** I onboarded through the real UI in each language, then screenshotted 12 routes (landing, start, today,
  day/1, path, library, resource, leaderboard, me, admin, studio, ui) × EN/RU × light/dark × 390/1280 — 96 shots — plus the
  fresh onboarding steps. No horizontal overflow anywhere. The only console errors are blocked YouTube thumbnails (sandbox
  network); the library's fallback art covers them well.
- **Fixed in design-owned files:**
  - Shell wraps `<Outlet>` in `<Suspense fallback={<RouteFallback/>}>`, so routes can be lazy-loaded.
  - The `theme-color` meta follows a manually forced theme.
  - Removed the runtime favicon injection (index.html serves it now).
  - Landing mocks now quote real content: Day 2 "Ship it: your page goes live" with its real tasks, and three real seeded
    library items per language. Phase copy matches program.json. "Day 12: try both tracks and pick" added.
  - RU copy: «За 66 дней работа с ИИ станет привычкой» (was an awkward infinitive subject), footer tagline grammar,
    tag labels «Для практиков / Для рассказчиков».
  - Added `web/public/og.png` (1200×630, leaf + path map).
- **Code-splitting:** measured locally. Lazy routes take the entry chunk from 621 → 398 kB (gzip 190 → 126). The exact
  App.tsx diff and an optional vendor chunk are in `docs/requests/design-to-orchestrator.md`.
- **Requests:**
  - learn: curriculum mismatches ("days 1–10 shared" → 1–14 with the pick on day 12; "about an hour" → 1–2 h),
    RU gendered «(а)» rephrasing, kit migration.
  - library: ambiguous duration (video length vs lesson time), «coding-агент» terminology, fade on the chip scroller,
    kit migration.
  - game: heatmap legend says "darker" (wrong in dark mode), emoji badges → lucide medallions, sparse leaderboard nudge,
    kit migration.

---

## Round 3: accessibility + share card (on main @ f267d27)
- **axe-core audit:** WCAG 2.1 A/AA + best-practice rules, 13 routes × EN/RU × light/dark × 390/1280. I ran axe from the
  scratchpad, so it isn't a repo dependency.
  - Before: 101 unique issues. All were in design files except one.
  - Fixed: the landing path-map's locked cells used `text-muted/70` (2.9:1 contrast) and now use `text-muted`; the logo
    link's `aria-label` didn't match its visible text, so I removed it and the wordmark now has a real space before
    "66"; the landing "how a day works" `<ol>` had `<div>` children, and `Reveal` can now render as an `<li>`.
  - After: 1 issue left, `/library/my` with no `<h1>`, requested from library. The share dialog is also axe-clean in
    both themes.
- **Keyboard-only walkthrough:** fresh onboarding, then Today, then "Mark as done", using Tab, arrows, Space, Enter and
  typing only. It passes in EN and RU, the task counter reaches 1/4, and all 25 focus stops have a visible indicator.
  Suggested a skip-to-tasks link to learn.
- **Share card:**
  - `ShareCard` preview, a `ShareDialog` that drops straight into learn and game, and `renderShareCardPng` /
    `shareOrDownload` helpers.
  - Two formats: 1080×1350 and 1200×630, each in light and dark.
  - Day and streak variants, with native RU/EN copy and Russian plurals.
  - Fonts are embedded on first export only.
  - On phones it opens the OS share sheet; otherwise it downloads and copies the post text.
  - 31 tests: palette matches the tokens, XML escaping, wrapping, plurals, post text.
  - I tested the real PNG export in Chromium.
  - Integration guide: `docs/requests/design-share-card.md`.
- **GameLayer in the Shell** (per `game-to-design.md`): the Shell lazy-loads it on every page except the landing page,
  so visitors make no game API calls and the main chunk stays at ~401 kB. Verified: completing a task shows exactly one
  reward toast, placed above the mobile tab bar.
- **Public pages:** I reviewed the portfolio logged out, as a stranger or recruiter would see it. The Shell now gives shared
  `/portfolio/:id` and `/certificate/:id` links visitor chrome: a CTA, no app nav, no tab bar, the full footer and no game
  calls. Shell chrome is hidden when printing. Recruiter-facing requests went to learn (portfolio); certificate guidance
  went to game, because game's certificate page is still a placeholder.
