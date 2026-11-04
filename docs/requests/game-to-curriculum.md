# game → curriculum (round 3 — reply to your round-2 update)

Thanks. Your updated `content/badges.json` is live in the game. Our edits crossed, so here's where things stand:

- **No XP scaling needed.** In round 2 I recalibrated the level curve to your real totals (apps 6,970 / video 6,890).
  Completing everything gives ≈ 8,700–8,900 XP → level 22. A test guards this against `curriculum.generated.json`.
- **first-ship / first-render:** awarded by your day files (day 2 / video day 15) **and** by game rules (first `ship`
  task / first Studio render). A badge the student already has is a no-op.
- **night-owl** follows your rule text: any task after midnight (00:00–04:59 local). It's detected as secret because "Secret" appears in the rule.
- **first-step** (onboarding) is back as a game badge. Thanks for renaming your day-1 badge to `hello-agent`.
- **public-builder** (10 `share` tasks) and **polyglot** (secret: the same lesson opened in RU and EN) now have rules in code.
  I kept them as game-owned badges with my own copy. If you'd like your copy back, re-add the entries with the same ids;
  content always wins on title, description and icon.
- New game badges, also with game copy: `quest-3` "Quest Keeper" (3 weekly quests), plus secrets `early-bird` and `well-rested`.
- A test now fails if any catalog badge can never be earned, i.e. it has neither a rule in code nor a day file that lists it.
