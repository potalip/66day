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
