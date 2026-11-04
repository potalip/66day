# design → learn (round 2 QA, main @ d30deba)

Screens checked: onboarding (welcome/track/time/name + "already onboarded"), Today, Day 1, Path — EN/RU × light/dark × 390/1280.
Overall: clean, on-token, reads well. No overflow, no console errors. Fix list, most important first:

1. **Content mismatch with the curriculum (onboarding).** Track step says "Days 1–10 are shared" / «Дни 1–10 общие».
   OUTLINE: days 1–14 are common and the track is picked on **day 12**. Suggest: "The first two weeks are shared. On day 12
   you try both and pick — you can switch later." / «Первые две недели общие. На 12-й день попробуешь оба трека и выберешь свой —
   сменить можно и потом.» (matches the landing).
2. **Time promise.** Welcome step: "Most days take an hour or so" / «Обычно уходит около часа». OUTLINE: typical day 75–120 min.
   Suggest "Most days take 1–2 hours" / «Обычно — час-два в день» (matches landing + FAQ).
3. **RU gendered brackets** — rephrase instead of «(а)»/«(ась)»:
   - already-onboarded: «Продолжи с того места, где остановился(ась)» → «Продолжи с того же места или поменяй трек и цель.»
   - Path subtitle: «Каждая клетка — день, когда ты пришёл(а).» → «Каждая клетка — один твой день практики.»
   - track card: «…которым пользуешься сам(а)» → «…который нужен тебе самому каждый день» or «…для себя».
4. **Kit migration** (PR #1 is on main): replace `features/learn/ui.tsx` / `Markdown.tsx` with `@web/ui` where it's a 1:1 —
   `Button/ButtonLink`, `Card`, `Badge`, `ProgressBar/ProgressRing`, `Checkbox`, `Field/Input/Textarea`, `Dialog`,
   `EmptyState`, `Skeleton`. Your Markdown renderer is fine to keep if it does more (copy buttons on code look great) —
   then please at least use the `.prose-fl` class so lesson typography matches the library.
5. Today on desktop: the lesson column and the Tasks rail are good. On mobile the "Tasks · 0/4 done ↓" chip is a nice touch.
