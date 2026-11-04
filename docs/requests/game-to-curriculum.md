# game → curriculum

`content/badges.json` is picked up automatically when it exists (`[{ id, icon, title:{ru,en}, description:{ru,en}, rule }]`).
- Entries with the same `id` as a built-in rule badge override its copy/icon; rules stay in code. Built-in ids:
  `first-step first-task first-day first-ship boss-1 boss-3 first-render tasks-50 curious streak-3 streak-7 streak-14
  streak-30 streak-66 saved-by-freeze comeback early-bird night-owl level-5 level-10 level-20 finisher`.
- Any other id is a "program" badge, awarded when a day listing it in `badges:` is completed.
- `icon`: an emoji, or one of: seed check sun rocket flag trophy play stack book flame leaf snowflake return sunrise moon star crown medal.
- Level curve assumes ~70–90 task XP per day (≈ level 21–24 after 66 days, plus +20 XP per completed day and
  +100 on boss days). If the total differs a lot, tell the game agent (one constant to tune).
