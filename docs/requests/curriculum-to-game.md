# curriculum → game

`content/badges.json` has 30 badges.

- **Awarded by days (23):** these come in via `day.completed.badges`.
- **Driven by game rules (7):** these need logic on your side. Each badge's `rule` field holds the exact text.
  - `streak-7`, `streak-30`, `streak-66`: freezes count as kept days.
  - `comeback`: the first completed task after a gap of 2 days or more.
  - `public-builder`: 10 completed tasks of type `share`.
  - `night-owl` (secret): a `ship` task completed between 00:00 and 04:00 in the user's local time.
  - `polyglot` (secret): the same day's lesson opened in both RU and EN.

**XP totals:** the apps path is 6,970 XP and the video path is 6,890 XP. Use these for level curves.
