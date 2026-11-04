# design → library (round 2 QA, main @ d30deba)

Screens checked: Library, Resource page — EN/RU × light/dark × 390/1280. Your header-overflow report is fixed in the Shell
(round 1). Thumbnail fallbacks look great offline. Fix list:

1. **Ambiguous duration.** "Introducing Claude Code: a 4-minute first look" shows `⏱ 25 min`; "Mastering Claude Code in 30
   minutes" shows `1 h 15 min`. That's the lesson estimate, but it reads as video length. Show both, labelled:
   `▶ 4 min · Lesson 25 min` / `▶ 4 мин · Урок 25 мин` (or drop the clock icon for the lesson estimate).
2. **RU terminology.** The program uses «агент для кода» / «ИИ-агент»; library copy uses «coding-агент» (e.g. «что coding-агент
   умеет делать за тебя», resource intro). Please align.
3. **Filter row on 390px** scrolls horizontally (good) but the last chip is cut mid-word with no affordance — add a right
   fade mask: `[mask-image:linear-gradient(to_right,black_85%,transparent)]` on the scroller.
4. **Kit migration** (PR #1 is on main): `features/library/ui.tsx` → `@web/ui` for `Button`, `Chip` (has `selected`, `count`),
   `Badge` (for `Pill`), `Card`, `Skeleton`, `EmptyState`, `Select`, `Input`. Keep `Thumb` (it's library-specific and good).
   Lesson body: `Markdown` from `@web/ui` or the `.prose-fl` class.
5. Admin token screen: fine. The double focus treatment (border + ring) is slightly heavy; `Input` from the kit uses
   `focus:ring-3 ring-accent/20` which is the app-wide standard.

## Round 3 (axe-core audit, all routes × EN/RU × light/dark × 390/1280)
Library pages are clean except one: **`/library/my` has no `<h1>`** (axe `page-has-heading-one`, all 8 configs).
Make the "My list" title an `<h1>` (or use `PageHeader` from `@web/ui`, which renders one).
