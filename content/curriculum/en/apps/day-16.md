---
day: 16
track: apps
phase: 2
title: "Interfaces that don't look generated"
summary: "Build your app's main screen phone-first, then make it better in three rounds of screenshots and precise feedback."
estMinutes: 90
resources:
  - "https://tailwindcss.com/docs"
  - "https://playwright.dev/"
  - "https://react.dev/learn"
tasks:
  - id: d16-apps-t1
    type: read
    title: "Learn five rules for an intentional UI"
    xp: 10
    proof: none
  - id: d16-apps-t2
    type: build
    title: "Build the main screen from your spec; upload phone and desktop screenshots"
    xp: 50
    proof: file
  - id: d16-apps-t3
    type: build
    title: "Run the screenshot loop for 3 improvements; upload before and after"
    xp: 30
    proof: file
  - id: d16-apps-t4
    type: quiz
    title: "Spot the UI problem"
    xp: 15
    proof: none
---

You've seen the look: purple gradient hero, a rocket emoji, three identical cards, everything centred, grey text on
grey. Agents default to it because it's the average of the internet. Today your main screen gets a point of view — and
you learn the loop that fixes any UI: **screenshot, judge, ask for one precise change, repeat.**

## Five rules for an intentional UI

1. **One primary action per screen.** Decide what the user does most (for the job tracker: "Add a job") and make that
   the only filled, accent-coloured button. Everything else is quieter.
2. **Hierarchy through size and weight, not colour.** One big title, clear section labels, body text at a readable size
   (16px on phones). If everything is bold, nothing is.
3. **A spacing scale.** Use a few steps (4, 8, 16, 24, 32 px — Tailwind's `p-2`, `p-4`, `gap-6`...) and stick to them.
   Uneven spacing is the #1 reason a screen feels "off" without anyone knowing why.
4. **A restrained palette.** Neutral background and text, one accent for actions, one colour for errors. Check contrast:
   light grey text on white fails for many people.
5. **Real content and real states.** Design with realistic data ("Junior Data Analyst — Spotify — closes 14 Nov"), and
   design the **empty state** (first visit), **loading** and **error** too. An empty list with a friendly first step is
   part of the product, not an afterthought.

**Mobile-first** means you design for a ~390px-wide phone screen first and let it grow for desktop — most of your
users will open the link from a chat on their phone.

## Step by step

### 1. Build the main screen (40 min)

There is no database yet, so the agent uses a small file of realistic sample data. Tomorrow we swap it for the real
thing.

```text
Goal: build the main screen described in docs/SPEC.md.

Context: Vite + React + TypeScript + Tailwind project. No backend yet.

Constraints:
- Mobile-first: must look intentional at 390px wide, then adapt at 1280px (max content width ~720px, centred).
- Follow these rules: one primary action (accent colour), hierarchy via size/weight, spacing only from
  4/8/16/24/32px, neutral palette + one accent, no gradients, no emoji as decoration, no cards inside cards.
- Put 6 realistic sample items in src/sampleData.ts (real-sounding names, dates, edge cases like a very long title).
- Include an empty state (shown when the list is empty), and keyboard-accessible buttons with visible focus.
- Support light and dark mode via prefers-color-scheme.

First explain your plan: components, layout at both widths, colours you'll use. Wait for my OK.
When done, install Playwright if needed and write scripts/screenshot.mjs that saves screenshots of the running app
at 390x844 and 1280x800 as screenshots/mobile.png and screenshots/desktop.png. Run it and tell me the file paths.
```

Look at the screenshots yourself — the phone one first. Upload both as proof.

> **If you're stuck:** if the screenshot script fails with "browser not found", ask the agent to run
> `npx playwright install chromium` and try again. If the page is blank, open the browser's developer console
> (F12) and paste the red error to the agent.

### 2. The screenshot loop: three improvements (35 min)

Vague feedback ("make it nicer") gets random results. Precise feedback gets precise fixes. Look at your phone screenshot
and find three concrete problems, using the five rules as a checklist. Then ask for them one at a time:

```text
Look at screenshots/mobile.png. I want exactly one change:
the "Add job" button is the same weight as the filter chips, so the main action doesn't stand out.
Make it the only filled accent button on the screen; make the chips outlined and smaller.

Tell me in 2 lines what you'll change before editing. Afterwards re-run scripts/screenshot.mjs,
save the result as screenshots/after-1-mobile.png, look at it and tell me honestly if it's fixed.
```

Good targets for your three rounds: a cramped list item, a title that wraps badly, low-contrast secondary text, an
empty state that just says "No data", a tap target smaller than ~44px. Keep the first "before" and the last "after"
and upload them side by side. Commit after each round that you like:

```bash
git add -A && git commit -m "UI: clearer primary action" && git push
```

> **Tip:** Agents can read images. Asking "what is the weakest part of this screen according to the five rules?" is a
> great way to get a second opinion — but you make the call.

## Quiz

1. A screen has three bright buttons: "Add", "Import", "Settings". What's wrong?
2. Your secondary text is `#BBBBBB` on white. Why is that a problem, and what's the fix?
3. The list looks great with sample data, but a real user's first visit shows a blank white area. Which rule was skipped?
4. Gaps on your page are 7px, 12px, 15px and 22px. What would you ask the agent to do?

<details><summary>Answers</summary>

1. Three primary actions means no primary action. Pick the most frequent one, make it the only accent button; the
   others become secondary (outlined or text).
2. The contrast is too low to read for many people, especially outside on a phone. Use a darker grey that passes the
   WCAG AA contrast check (4.5:1 for body text).
3. Rule 5: real states. The empty state needs a short explanation and the first action ("Add your first job").
4. Snap all spacing to the scale (for example 8, 16, 24) and use the same gap for the same kind of relationship.

</details>

## You're done when…

- [ ] You can name the five rules without looking.
- [ ] The main screen works at 390px and 1280px — you uploaded both screenshots.
- [ ] You ran three precise screenshot rounds and uploaded before/after.
- [ ] You answered the quiz and checked your answers.

**Tomorrow:** your data stops disappearing on refresh. Real database, real API.
