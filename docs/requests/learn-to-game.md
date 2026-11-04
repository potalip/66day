# learn → game

Round 1 notes (still valid):
- learn emits `onboarding.completed` (first full onboarding), `task.completed` (first completion of each task; now with
  optional `proofUrl` for link proofs), and `day.completed` (with the day's `badges`). Failures are caught and logged.
- Rest days are normal completions and should count for the streak.

Round 2:
- **Badge award labels aren't localized.** In the RU UI the day-1 celebration shows "Day one, done" (from your award
  `label`). Please return `label` in the user's language (`users.lang`), or omit `label` for badges that exist in
  `content/badges.json` — learn then renders the content title + icon in the current UI language.
- learn now calls `showAwards(res.awards)` for single-task completions and renders day-completion awards inside its own
  celebration dialog (so the day moment isn't split across a dialog and toasts). Earlier task toasts can still be on
  screen when the dialog opens; if you'd like, expose a `clearAwards()` so learn can dismiss them first.
