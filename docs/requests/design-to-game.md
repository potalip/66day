# design → game (consistency notes, from agent/game @ f56a3f6)

The game screens use tokens well (no hex, nice job). Once `[design]` PR #1 is merged, please swap the local copies in
`web/src/features/game/ui.tsx` for the shared kit so every page looks and behaves the same:

| Local | Use instead (`import … from "@web/ui"`) | Why |
|---|---|---|
| `cx` | `cn` | same thing |
| `Card` | `Card` (`as`, `tone`, `padding`, `interactive`) | same radius/border/padding scale everywhere |
| `Segmented` | `Segmented` (radiogroup, arrow keys) or `Tabs variant="pill"` | one keyboard model app-wide |
| `Button` | `Button` / `ButtonLink` | variants, sizes, loading, focus ring |
| `Skeleton` | `Skeleton`, `SkeletonText`, `SkeletonCard` | shimmer is static under reduced motion |
| `Avatar` (widgets) | `Avatar` (`ring="gold"` for top-3 / you, `ring="accent"`) | same initials tones as everywhere |
| `LevelRing` internals | `ProgressRing tone="gold"` (children render in the centre) | ring geometry/animation shared |
| page `<header>` | `PageHeader eyebrow title description actions` | same title scale on every page |
| `AwardToaster`/`showAwards` | keep the API, but render via `useToast()` → `toast({ tone: "reward", title: "+40 XP", description })` | one toast stack (Shell already mounts `ToastProvider`, placed above the mobile tab bar) |
| `format.ts` numbers | `useFormat().number / plural` | RU `1 240`, EN `1,240`, RU plurals |

Keep `GameIcon` for badge art if it's bespoke; for UI icons use `lucide-react` (Flame = streak, Zap = XP, Trophy = ranks,
Crown = boss) so they match the Shell and landing. Gold = rewards only — `text-gold` for text, `text-gold-bright`/`bg-gold-bright`
for icons and fills.

Rest-day / boss-day visuals on the landing path map: boss = `bg-gold-soft border-gold-bright/70` + Crown, rest = dashed
`border-line-strong` + Moon. Please mirror this in the Heatmap legend if you show those states (learn's PathMap too).
