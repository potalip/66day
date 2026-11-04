# Agent brief: DESIGN SYSTEM + LANDING (branch `agent/design`)

You own how FlowLeaf 66 looks and feels. The founder wants it **clean**, with **light and dark themes**, not dark-only.

Read: `CLAUDE.md`, `docs/SPEC.md`, `docs/OWNERSHIP.md`, `web/src/styles.css`, `web/src/Shell.tsx`.

First, try to read https://aiuxplayground.com/skills (the founder's reference for design skills). If it's reachable,
pick the skills/approaches that fit a clean, modern, bilingual education product and apply their principles; note which
in `docs/DESIGN.md`. If it's not reachable, proceed with the direction below.

## Build
1. `docs/DESIGN.md`: principles, type scale (Cyrillic-friendly fonts — e.g. Inter / Manrope / Onest for UI, a mono for
   code; self-host via @fontsource or bundle), spacing, radii, elevation, color tokens light+dark, motion rules
   (subtle, purposeful, respect prefers-reduced-motion), iconography (one icon set, e.g. lucide), illustration style,
   voice & tone in RU and EN.
2. Refine tokens in `web/src/styles.css` (keep the token names; add more if needed). Check contrast (WCAG AA) in both themes.
3. Component library in `web/src/ui/` used by all other agents: Button (variants/sizes), Card, Badge/Chip, Input,
   Textarea, Select, Tabs, Dialog/Sheet, Toast, Progress (bar + ring), Skeleton, EmptyState, Avatar, Tooltip, Markdown
   prose styles, ThemeToggle, LangSwitcher, PageHeader. Accessible, keyboard-friendly, typed, zero or tiny deps.
   Add `web/src/ui/index.ts` exports and a `/:lang/ui` showcase route? — **No**: App.tsx is orchestrator-owned; instead
   build the showcase as `web/src/ui/Showcase.tsx` and note it in your report; the orchestrator will wire the route.
4. Shell: polished header (logo mark — design a simple FlowLeaf leaf mark in SVG), responsive nav (bottom tab bar on mobile),
   theme + language switchers, footer.
5. Landing page (`web/src/features/landing`): bilingual, natively written copy (RU and EN are adaptations):
   hero (66 days → building with AI becomes a habit), the two paths (Apps / Video), how a day works, the game layer,
   Studio teaser, the library, "start free" CTA → `/:lang/start`. Clean, editorial, confident. Real copy, no lorem.
6. Screenshots of landing + showcase (both themes, both languages, 390px + 1280px). Iterate until it looks premium.
   `docs/agents/design-REPORT.md`.
Midway (after ~3h), `git fetch origin main` and look at what other agents have merged; note consistency issues in
`docs/requests/design-to-<agent>.md` so they can fix.
