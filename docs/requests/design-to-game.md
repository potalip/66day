# design → game (round 2 QA, main @ d30deba)

Screens checked: Leaderboard, Profile — EN/RU × light/dark × 390/1280. Solid and on-token. Fix list:

1. **Heatmap legend copy is wrong in dark mode.** "Darker means more XP" / «Чем темнее, тем больше XP» — in the dark theme
   more XP is *brighter*. Use "Deeper green = more XP" / «Чем насыщеннее цвет, тем больше XP».
2. **Emoji badge art** (🌱🔥🚀🌳🍃) renders differently per OS, looks noisy next to line icons, and the colours ignore the theme.
   Use lucide icons inside your gold medallion (earned: `bg-gold-soft text-gold-ink ring-gold-bright/50`; locked:
   `bg-surface-2 text-muted`). Suggested map: first-step `Sprout`, streaks `Flame`, 30-day `TreeDeciduous`, unbroken-66 `Leaf`,
   it's-alive `Rocket`, milestone `Flag`, boss `Crown`, first-render `Film`, fifty-tasks `Layers`, curious `BookOpen`.
3. **Leaderboard with 1–3 people** leaves a big empty area on mobile. Add a quiet line under the list:
   "Finish today's tasks to climb — the week resets in 4 days." / «Сделай задачи на сегодня, чтобы подняться, — неделя
   обнулится через 4 дня.» (EmptyState `compact` works).
4. **Kit migration** (PR #1 is on main) — see round-1 table above this line in git history: `cx`→`cn`, `Card`, `Segmented`,
   `Button`, `Skeleton`, `Avatar` (`ring="gold"`), `ProgressRing tone="gold"`, `PageHeader`, toasts via `useToast({tone:"reward"})`,
   numbers via `useFormat()`.

## Round 3 — a11y audit
- axe-core on Leaderboard + Profile: **0 violations** in all 8 configs. 
- New: share card for streaks — see `docs/requests/design-share-card.md`.

## Round 3b — certificate (`/:lang/certificate/:id`) — guidance before you build it
The Shell already treats `/certificate/:id` (not `/me`) as a public page with visitor chrome (CTA, no app nav/tab bar).
Recruiter-facing, so: one calm page, printable, shareable.
- Layout: a single centred card, max-w-3xl, `rounded-[var(--radius-lg)] border-line bg-surface`, generous padding (p-10 sm:p-14).
  LeafMark top-left, "FlowLeaf 66" wordmark, then the name in 48–56px semibold, "completed the 66-day program" /
  (in RU avoid gendered verbs: «завершает 66-дневную программу» or «Программа FlowLeaf 66 пройдена»), track, dates
  (start → finish), 3 stats max (days, boss projects shipped, best streak), and the capstone project link as the hero item.
- Gold is allowed here (it's the ultimate reward): one thin `border-gold-bright/40` frame or a gold Crown seal — not both.
- Verification line in mono small text: certificate id + "Verify at flowleaf66…/certificate/<id>".
- `@media print`: the Shell header, footer and tab bar are already `print:hidden`. On your side: `print:bg-white print:shadow-none`
  on the card, and avoid dark-theme colours in print (`print:text-black`).
- Share: reuse `ShareDialog` from `@web/ui/ShareCard` with `kind: "day", day: 66` (it renders "66 done/пройден"); a dedicated
  certificate card variant can come later — ask me.
- Not-yet-finished users: show progress ("Day 23 of 66") instead of a fake certificate.
