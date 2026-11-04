---
day: 53
track: apps
phase: 4
title: "The first two minutes decide everything"
summary: "A stranger opens your capstone and gets real value in under two minutes, on a phone, with every state looking deliberate."
estMinutes: 120
resources:
  - https://playwright.dev/
  - https://developer.mozilla.org/en-US/docs/Learn
  - https://tailwindcss.com/docs
tasks:
  - id: d53-apps-t1
    type: build
    title: "Build a first-run experience that delivers value in under 2 minutes"
    xp: 70
    proof: link
  - id: d53-apps-t2
    type: build
    title: "Polish mobile plus empty, loading and error states; attach screenshots"
    xp: 30
    proof: file
  - id: d53-apps-t3
    type: reflect
    title: "Watch one person use it and write down where they hesitated"
    xp: 15
    proof: text
---

Your capstone works. You built the core loop on day 51 and the AI that matters on day 52. But right now it works *for you*,
the person who knows where every button is. In 12 days strangers will arrive from a launch post, give your app about
two minutes, and either feel something useful happen or close the tab forever. Today you design those two minutes.

## Time-to-value, not features

**Time-to-value** is the time between "page opened" and "I got the thing I came for". Not "I made an account". Not "I
saw the dashboard". The *thing*: the summary, the plan, the answer, the generated reply.

Most beginner apps lose people at three walls:

1. **The sign-up wall.** You ask for an account before showing anything. Fix: let people try first (a guest mode, a demo
   with sample data, or one free run), and ask for an account only when they want to *save* something.
2. **The blank page.** An empty list with "No items yet". Fix: an empty state that explains what goes here and has one
   button that fills it — ideally with an example the person can edit.
3. **The silent wait.** The AI call takes 8 seconds and nothing moves. Fix: a loading state that says what's happening
   ("Reading your notes… drafting 3 options…"), and streaming if your feature allows it.

Think of a good hotel: you don't fill out a form in the lobby before you're allowed to see the room. Someone hands you
a key and says "lift's on the left".

## Step by step

### 1. Time the current first run (10 min)

Open your app in a private window on your phone. Start a stopwatch. Pretend you've never seen it. Stop the clock when
you get real value. Write down the time and every screen you passed. Most people get 4–6 minutes on the first try.
That's fine — that's why we measure.

### 2. Redesign the path with your agent (60 min)

Give your coding agent (Claude Code or any agent you use) the numbers and let it propose before it builds:

```text
Goal: a brand-new visitor gets real value from this app in under 2 minutes, on a 390px-wide phone.
Context: read CLAUDE.md / AGENTS.md and the main routes first. Today a first run takes [your time] and goes:
[list the screens you passed]. The "value moment" is: [e.g. "sees a weekly plan built from their own input"].
Constraints:
- Let people try before signing up: a demo with realistic sample data OR one guest run. Ask for an account only to save.
- Add a one-line hint on the first screen that says what to do, not a multi-step tour.
- Keep the existing data model; no new dependencies unless you ask me first.
- If the AI key is missing, the demo must still work using a fixture response.
Done when: you list the new path screen by screen with an estimated time per step, I approve it, you implement it, the build passes, and you write a short Playwright test that walks the new path and asserts the value moment appears.
Propose the plan first and wait for my OK.
```

Read the plan critically. If it adds a five-step tutorial, push back: hints beat tours. Approve, let it build, then
redo your stopwatch run. Under two minutes? Commit and push. **Proof for task 1:** the commit link.

> **If you're stuck:** if guest mode fights your auth setup, skip it. A "Try with an example" button that loads
> sample data into a read-only view gets you 80% of the win with 20% of the work.

### 3. The state sweep (30 min)

Every screen has at least four states: **empty, loading, error, full**. Beginners only design "full". Ask the agent to
find and fix the rest, and to take the evidence:

```text
Goal: every screen in the app has a deliberate empty, loading and error state, and looks right on mobile.
Steps:
1. List each route and which of the four states (empty / loading / error / full) it currently handles.
2. Fix the missing ones: empty states explain + offer one action; loading says what is happening; errors say what went wrong in plain words and offer "try again". No raw stack traces, no "Error: undefined".
3. Simulate errors (e.g. a flag or a mocked failed fetch) so I can see them.
4. Write a Playwright script that screenshots the main screens in each state at 390px and 1280px, in light and dark themes, into ./screenshots/day-53/.
Done when: the build passes and the screenshots folder exists. Show me the list of files.
```

Open the screenshots. Actually look at them: text touching the edge of the screen, buttons smaller than a fingertip
(aim for at least 44px tall), dark-mode text that's grey on grey. Send the agent the three ugliest ones with one
sentence each about what's wrong. **Proof for task 2:** attach the best 3–4 screenshots (one must be an error state).

> **Tip:** an error message is a tiny piece of customer support. "We couldn't reach the AI. Your text is saved — try
> again in a minute" beats "Something went wrong" every time.

### 4. Watch someone (15 min)

Find one person who has never used the app — a flatmate, a colleague, someone on a video call with screen sharing.
Give them one sentence: "This helps you [job]. Try it." Then **say nothing**. Don't explain, don't point, don't sigh.
Write down every moment they pause, scroll back, or ask "wait, what do I…?". That pause is the most valuable data you
will collect this week. **Proof for task 3:** where they hesitated, how long the first run took, and the one change
you'd make first.

> **Build log:** add a `## Day 53` entry to `docs/BUILDLOG.md` — first-run time before → after, and the
> hesitation you saw. Two lines keep the thread you started on day 51 unbroken.

## You're done when…

- [ ] A stopwatch first run on a phone takes under 2 minutes; the commit link is pasted.
- [ ] Main screens have deliberate empty, loading and error states; 3–4 screenshots attached (390px, both themes).
- [ ] You watched one real person in silence and wrote down where they hesitated.

**Tomorrow:** five beta testers. You'll stop watching one person and start listening to five.
