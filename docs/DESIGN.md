# FlowLeaf 66 — Design system

Owner: design agent. Tokens live in `web/src/styles.css`, components in `web/src/ui` (`import { … } from "@web/ui"`),
live style guide in `web/src/ui/Showcase.tsx` (route `/:lang/ui`, once the orchestrator wires it).

> The founder's reference (aiuxplayground.com/skills) could not be reached from the build environment (DNS blocked),
> so this system follows the direction in the spec and brief: clean, calm, editorial, bilingual, light and dark as equals.

## 1. Principles
1. **Calm over loud.** One accent (leaf green) for actions, gold *only* for rewards. No neon, no gradient blobs, no dark-only.
2. **One idea per screen.** A beginner on a phone should always know the single next step. Use one primary button per view.
3. **Editorial, not dashboard.** Generous whitespace, strong type hierarchy, reading width ≤ 70ch, real sentences.
4. **Show progress honestly.** Progress, streaks and XP are visible but quiet. Celebrate real milestones, not clicks.
5. **Bilingual by design.** Every layout must hold Russian (≈ 15–30% longer, longer words). Never fix widths around English text.
6. **Accessible by default.** AA contrast (tested), visible focus, full keyboard support, reduced motion respected.

## 2. Typography
| Role | Font | Notes |
|---|---|---|
| UI + headings | **Onest Variable** (`font-sans`) | Designed with Cyrillic as a first-class script, geometric but warm. Weights 400/500/600 only. |
| Editorial accent | **Source Serif 4 Variable italic** (`font-serif-em` class) | One emphasised word in a headline, e.g. *habit* / *привычкой*. Never for body text. |
| Code | **JetBrains Mono Variable** (`font-mono`) | Code, commands, token names. |

All self-hosted via `@fontsource-variable/*`, subset by unicode-range (Latin + Cyrillic load on demand).

Scale (mobile → desktop):
| Token | Size / line-height | Use |
|---|---|---|
| Display | 40 → 64px / 1.04, `-0.035em`, 600 | Landing hero only |
| H1 (PageHeader) | 28 → 34px / 1.15, 600 | Page titles |
| H2 (section) | 30 → 40px / 1.12 on landing; 18px in app | Sections |
| H3 | 16–24px, 600 | Card titles |
| Body | 16px / 1.55 (UI), 17px / 1.7 (prose) | |
| Small | 14px | Meta, hints |
| Micro | 11–12px, uppercase eyebrows with `tracking-[0.08em]` | Eyebrows, tab-bar labels |

Use `tabular` (tabular numbers) for XP, counters, timers and day numbers. Headings use `text-wrap: balance`.

## 3. Color tokens
Use Tailwind classes generated from tokens (`bg-surface`, `text-muted`, `border-line`, `bg-accent`, `text-gold`…). Never write hex.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | #fafaf7 | #0e1012 | Page (warm paper / soft graphite, never pure white or black) |
| `surface` | #ffffff | #15181b | Cards, inputs |
| `surface-2` / `surface-3` | #f2f2ed / #e9e9e2 | #1c2024 / #252a2f | Wells, hovers, tracks of progress bars |
| `fg` / `muted` | #15171a / #5d636b | #eceeef / #9ba2aa | Text |
| `line` / `line-strong` | #e4e4dc / #cfcfc6 | #262b30 / #353b42 | 1px borders / input borders |
| `accent` (+`-hover`, `-fg`, `-soft`, `-ink`) | #187a4e | #43c38a | Primary actions, done states, links (`accent-ink`) |
| `gold` (+`-bright`, `-soft`, `-ink`) | #8a6410 | #e3b95e | **Rewards only**: XP, streaks, badges, boss days. `gold-bright` for fills/icons. |
| `danger` (+`-soft`, `-ink`) | #b3362f | #f07069 | Errors, destructive |
| `info` (+`-soft`) | #2f62b3 | #7aa7ee | Neutral notes, Video-track tint |

**Contrast guarantee** (enforced by `web/src/ui/tokens.test.ts`): `fg`, `muted`, `accent`, `accent-ink`, `gold`, `danger`
as text on `bg`/`surface`/`surface-2` ≥ 4.5:1 in both themes; `accent-fg` on `accent` and every `*-ink` on its `*-soft` ≥ 4.5:1.
`gold-bright` and `line-strong` are non-text colors.

Track tinting: Apps = accent (green), Video = info (blue). Keep everything else neutral.

## 4. Spacing, radii, elevation
- Spacing: Tailwind's 4px scale. Card padding 20–24px (`Card padding="md"`), 32px for hero panels. Sections on landing: 80 → 112px vertical.
  Page gutter: 16px mobile, 24px ≥ 640px. Content max width `max-w-6xl` (1152px); reading pages `Container size="prose"`.
- Radii: `--radius-sm` 10px (controls), `--radius` 14px (cards), `--radius-lg` 22px (hero panels, dialogs, sheets), full for pills/chips.
- Elevation: borders first, shadows rarely. `shadow-soft` (buttons), `shadow-card` (hover lift), `shadow-float` (dialogs, toasts, hero mocks).
  Dark theme shadows are deeper but used the same way.

## 5. Motion
- Durations: 120ms (hover/press), 200ms (fades), 360ms (enter/sheet). Easing `cubic-bezier(.22,1,.36,1)`.
- Utilities: `animate-rise` (enter), `animate-fade-in`, `animate-pop` (celebration / dialog), `animate-spin-soft`, `.skeleton` shimmer.
- Motion is **purposeful**: entering content, state changes, celebration of a finished day. Never loop decorative animation.
- `prefers-reduced-motion: reduce` collapses all animations/transitions globally (styles.css) — no extra work needed.

## 6. Iconography
**lucide-react** only, stroke icons at 16/18/20/24px, `aria-hidden` when decorative. Buttons size icons automatically.
Reward icons (Flame, Zap, Trophy, Crown, Medal) are tinted `text-gold-bright`; everything else inherits text color.
Canonical icons: Today `CalendarCheck2`, Path `Map`, Library `Library`, Studio `Clapperboard`, Leaderboard `Trophy`,
XP `Zap`, streak `Flame`, boss day `Crown`, rest day `Moon`, Apps `Code2`, Video `Video`.

## 7. Logo
`<LeafMark />` / `<Logo />` in `web/src/ui/Logo.tsx`: a single leaf whose midrib continues past the leaf as a curling "flow"
stroke (growth + momentum). Wordmark "FlowLeaf" + "66" in accent. Favicon: white leaf on accent square (`web/src/ui/assets/favicon.svg`).

## 8. Illustration style
No stock illustrations or 3D blobs. We "illustrate" with **the product itself**: honest UI mocks (the 66-cell path, a Today
card, a profile, a Studio storyboard), built from real components, in both themes. Texture is limited to a faint dot grid
that fades out under the hero. Decorative leaf mark at 8% opacity is allowed on accent panels.

## 9. Components (web/src/ui)
| Component | Notes |
|---|---|
| `Button`, `ButtonLink`, `buttonClass()` | variants `primary · secondary · outline · ghost · soft · gold · danger · link`; sizes `sm · md · lg · icon · icon-sm`; `loading`, `icon`, `iconRight`, `block`. One `primary` per view; `gold` only to claim rewards. |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription` | tones `default · muted · accent · gold`, `padding`, `interactive`, `as`. |
| `Badge`, `Chip` | Badge = static label (tones). Chip = toggle filter (`selected`, `count`, aria-pressed). |
| `Field`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch` | `Field` wires label/hint/error ids and `aria-invalid` into its child. Select is native (mobile pickers). |
| `Tabs`, `Segmented` | WAI-ARIA tabs with arrow keys; `variant="underline"` / `"pill"`. Segmented = radiogroup for settings. |
| `Dialog`, `Sheet` | Native `<dialog>` (focus trap, Esc, top layer). `side="auto"` = bottom sheet on phones, centered on desktop. |
| `ToastProvider`, `useToast` | Provided by Shell. Tones `neutral · success · error · reward`. Errors persist until dismissed. |
| `ProgressBar`, `ProgressRing` | `tone="accent" | "gold"`; always pass `label`. |
| `Skeleton`, `SkeletonText`, `SkeletonCard` | Wrap groups in `role="status"` with a sr-only label. |
| `EmptyState` | Icon + title + what to do next + action. Also for "AI not configured" states (`tone="gold"` or neutral). |
| `Avatar` | Initials fallback with deterministic token tone; `ring="gold"` for top ranks. |
| `Tooltip` | Short hints only; never the only place information lives. |
| `PageHeader`, `SectionTitle` | Eyebrow, title, description, actions, back link. |
| `ThemeToggle`, `LangSwitcher` | Theme store is shared (`useTheme`, `useResolvedTheme`). LangSwitcher keeps path, query and hash. |
| `Markdown`, `Prose` | Safe parser (no raw HTML, only http(s)/mailto/relative URLs) + `.prose-fl` styles; `> [!TIP]` callouts. |
| `Stat`, `Kbd`, `Divider`, `Container`, `Spinner`, `VisuallyHidden`, `cn` | Small helpers. |

**Shell**: sticky translucent header (logo, desktop nav ≥ 768px, RU/EN, theme, profile/“Start free”), bottom tab bar on
mobile (5 items, safe-area aware), compact footer in app / full footer on landing. Onboarding (`/start`) gets focus chrome:
no tab bar, no nav. Pages get `max-w-6xl` + gutters automatically; landing is full-bleed.

## 10. Patterns
- **Page**: `PageHeader` → content in Cards → one primary action. Mobile: primary actions `block` at the bottom of their card.
- **Loading**: skeletons shaped like the content (never a lone spinner for > 300ms page loads).
- **Errors**: say what happened + how to fix, in the user's language, with a retry. Use `toast({ tone: "error" })` for actions,
  `EmptyState tone="danger"` for failed page loads.
- **AI not configured**: `EmptyState` with an explanation and the deterministic fallback shown right below it.
- **Celebration**: `animate-pop` + `toast({ tone: "reward" })` + gold. Once per achievement; never block the next step.

## 11. Voice & tone
**EN** — direct, warm, a little dry. Short sentences. Second person. Concrete verbs ("Ship", "Paste the link").
No hype ("revolutionary", "unlock your potential"), no exclamation-mark spam, no jargon without a one-line explanation.

**RU** — на «ты», по-дружески, но без панибратства и без канцелярита. Короткие фразы, живые глаголы («Задеплой», «Вставь ссылку»).
Не переводим с английского — пишем заново: свои примеры и платформы (Telegram, VK, YouTube), свои шутки.
Английские термины оставляем там, где так говорят в индустрии (деплой, промпт, API), но объясняем при первом упоминании.
Ёлочки «» для цитат, тире — с пробелами, «ё» пишем.

Microcopy rules (both): buttons say what happens ("Finish day", not "OK"); empty states always offer the next step;
numbers use locale formatting (`1 240` in RU, `1,240` in EN — use `Intl.NumberFormat(lang)`).

## 12. Accessibility checklist (audited with axe-core, round 3)
- Every page has one `<h1>` (use `PageHeader`). Lists are real `<ul>/<ol>` with `<li>` children — wrappers go *inside* the `<li>`.
- Don't set `aria-label` on links/buttons that already show text; if you must, the label has to **contain** the visible text
  (WCAG 2.5.3 label-in-name).
- Never lower text contrast with opacity (`text-muted/70` fails on `surface-2`). Use `text-muted` — it's AA on every surface.
- Custom radios/checkboxes: keep the native input (`sr-only`) and show focus on the visible wrapper via `has-[:focus-visible]:outline-*`.
- Moving between steps: put focus on the new step's heading (`tabIndex={-1}` + `.focus()`), like onboarding does.
- Run it yourself: Playwright + axe-core (`axe.run(document, { runOnly: ["wcag2a","wcag2aa","wcag21aa","best-practice"] })`).

## 13. Share card
`ShareDialog` / `ShareCard` in `web/src/ui/ShareCard.tsx` (builder: `shareCardSvg.ts`). One recognisable card for public
progress: big day number (or streak) + serif-italic "done / пройден", the day's native title, streak + XP, the 66-cell map
(done = accent, today = ringed, boss = gold crown, rest = dashed), name + #FlowLeaf66. 1080×1350 and 1200×630, light/dark.
Colours are literal in the builder (exports can't read CSS vars) and a test keeps them equal to the tokens.
Import it directly from `@web/ui/ShareCard` (not the barrel) so it stays in lazy chunks. Integration guide: `docs/requests/design-share-card.md`.
