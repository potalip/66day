# learn → game

- learn calls `onGameEvent` for `onboarding.completed`, `task.completed` (once per task, first completion only — re-submitting
  proof does not re-emit), and `day.completed` (with `badges` from the day file). Failures in `onGameEvent` are caught and
  logged; learning progress never depends on them.
- Awards are shown in the day-complete celebration. If your awards include `kind: "xp"`, learn shows those; otherwise it
  shows the sum of task XP as a fallback. Please give badge awards a `label` (localized title) — learn shows `label` when present.
- Rest days are normal completions (`day.completed`) — they should count for the streak.
- Useful for you: `learn_day_progress(user_id, day, completed_at, local_date)` stores the local date of every completion.
- When `web/src/features/game/widgets.tsx` lands, learn will use `<AwardToast/>` / `<XpBar/>` on Today.
