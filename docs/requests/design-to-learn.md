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

## Round 3 — a11y audit + keyboard walkthrough
- axe-core (WCAG 2.1 AA + best practice) on onboarding, Today, Day, Path: **0 violations** in all 8 configs. 
- Keyboard-only: welcome → track → time/goal → name → Today → "Mark as done" works end to end in EN and RU; every one of the
  25 focus stops shows a visible indicator; focus moves to each step's heading (nice). One improvement: on Today (390px) the
  first task's button is the 11th Tab stop (header + lesson links come first). Add a skip link at the top of the lesson,
  "Skip to tasks" / «К заданиям», targeting the tasks list (the mobile "Tasks · 0/4 ↓" chip already does this for pointer users —
  just make sure it moves *focus* to the tasks heading, not only scroll).
- New: share card for the day-completion moment — see `docs/requests/design-share-card.md`.

## Round 3b — public portfolio, reviewed as a stranger/recruiter (`/:lang/portfolio/:id`)
Seeded a real user (onboarded, Day 1 done, 2 items public) and opened the link logged-out, EN/RU, light/dark, 390/1280.
Works well: title/OG meta, "Copy link", the CTA band, owner banner + "Preview as visitor", per-item Public switches, 404 state.
The Shell now gives `/portfolio/:id` and `/certificate/:id` (not `/me`) **visitor chrome**: header CTA "Start free", no app
nav, no tab bar, full footer, no game API calls. Requests, most important first:

1. **Card titles are instructions, not achievements.** "Install a coding agent and say hello in a new folder" /
   «Установи агента и поздоровайся с ним в новой папке» reads like homework to a recruiter. Use the **day title** as the card
   title ("Hello, agent: your first page in 30 minutes") and show the task as the small meta line, or let the default
   `title` be the user's edited title when set (you already support editing — nudge owners to rename on boss/ship items).
2. **"More work" / «Другие работы» with nothing above it.** When there are no highlighted (boss/ship) items, title the section
   "Work" / «Работы».
3. **Text-proof thumbnail** shows a chip with an icon and a dash ("📄 –"). For text items drop the thumbnail entirely and let the
   quote be the card (`text-[1.0625rem]` italic-free, with a 3px accent left border), or show the first ~120 chars large.
4. **Early-days stats read negative to strangers:** "Milestone projects 0/5", "Level 2". For visitors hide zero-value stats and
   "Level" (it means nothing outside the app); keep "Day 1 of 66" + "Started 4 Nov" + best streak ≥ 3. Owners can still see all.
5. **404 state:** the only action is a button labelled "FlowLeaf 66". Make it "Start your 66 days" / «Начать свои 66 дней» →
   `/:lang` and keep the explanation line.
6. On 390px the avatar sits on its own row above the name — put it inline (56px) left of the name to save a screen of scroll.
