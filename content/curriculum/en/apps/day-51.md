---
day: 51
track: apps
phase: 3
title: "Capstone build 1: the core loop, end to end"
summary: "Make your capstone's one core flow work from first click to saved result — ugly is fine, fake is not."
estMinutes: 120
resources:
  - "https://docs.anthropic.com/en/docs/claude-code/overview"
  - "https://playwright.dev/"
tasks:
  - id: d51-apps-t1
    type: build
    title: "Make the core flow work end to end and share the commit link"
    xp: 80
    proof: link
  - id: d51-apps-t2
    type: build
    title: "Write your build log: done, next, blocked"
    xp: 20
    proof: text
  - id: d51-apps-t3
    type: reflect
    title: "Write what you cut today, and why"
    xp: 15
    proof: text
---

Most side projects die with a beautiful login page and nothing behind it. Yours won't. Today you build the
**core loop** — the single path from "a user arrives" to "the user got the thing they came for" — all the way
through: real screen, real server, real database, deployed. It may look rough. It must actually work.

## The walking skeleton

Engineers call this a **walking skeleton**: the thinnest possible version of the whole system that runs end to
end. Think of building a bridge by first stretching one rope across the river. It's not a bridge yet, but now
everything else can be carried over it.

Rules for today:

- **Every step of the loop exists**, even if it's plain. No "coming soon" in the middle of the flow.
- **Data is real**: it's saved, it survives a reload, it belongs to the right user.
- **The AI may be simple.** Tomorrow is the AI day. Today, if the smart part isn't ready, use the simplest honest
  version: a basic prompt, or a clearly marked fixture so you can wire the rest. The *shape* of its input and
  output should already be final.
- **It's deployed.** "Works on localhost" doesn't count.

Example: for "meal plans for my diabetic dad", the loop is *enter his constraints → get a 7-day plan → get the
shopping list → tick items off in the shop*. Today all four steps work; the plan can come from a simple prompt.

## Step by step

### 1. Write the loop as a test first (15 min)

Open `docs/CAPSTONE.md` and copy the core-loop steps. Turn them into an end-to-end test — it's your definition of
done, and it will catch you breaking the loop on days 52–64.

```text
Read docs/CAPSTONE.md. Write a Playwright end-to-end test for the core loop described there:
<paste the 3-6 steps>. It should sign up (or log in as a test user), go through every step, and assert the
final result is saved and visible after a page reload. Mock the AI call in the test with a fixed fixture.
Don't implement the feature yet — the test should fail now. Show me the test file.
```

### 2. Plan, then build in slices (75 min)

Ask the agent for a plan before any code. Use your agent's plan mode if it has one.

```text
Plan how to make this core loop pass end to end with the smallest amount of code: <paste steps>.
Reuse what already exists in this repo (auth, DB, UI components, AI client). Split the work into 3 slices,
each one deployable and committed separately. For each slice: files touched, DB migrations, API routes,
and how I'll test it by hand. List anything you'd cut to fit in about 60 minutes. Wait for my OK.
```

Read the plan. Cut anything that isn't on the loop: settings pages, profile photos, dark-mode tweaks, admin
screens — all later. Then build slice by slice:

```text
Implement slice 1 only. When done: run the tests and the build, show me what to click to check it by hand,
and commit with a clear message. Then stop and wait.
```

Check each slice yourself — click through it on your phone — before saying "next". Three small working commits
beat one huge broken one.

> **If you're stuck:** if a slice is still not working after 25 minutes, stop digging. Ask the agent: "What's the
> simplest version of this step that still lets the loop complete?" A text input instead of a fancy picker, a
> list instead of a calendar, one hard-coded option instead of five. You can upgrade it on day 53.

### 3. Deploy and walk it (15 min)

Deploy, then walk the whole loop on the live site on your phone as a brand-new user. Run the e2e test against the
deployed URL if your setup allows it. When it passes, copy the link to the commit (on GitHub: open the commit,
copy the URL). That's your proof for task 1.

```bash
npx playwright test e2e/core-loop.spec.ts
```

### 4. Build log (5 min)

Add an entry to `docs/BUILDLOG.md` — you'll keep this until day 65, and it becomes your case study later:

```text
## Day 51
Done: core loop works end to end on <URL>: <steps>. E2E test green.
Next: real AI for step <n> + 10-case eval + cost estimate.
Blocked: <anything, or "nothing">. Risk check: <any kill criterion getting close?>
```

Paste it.

### 5. Reflect: what did you cut? (10 min)

In 3–5 sentences: what did you want to build today and didn't, and why was cutting it right (or wrong)? Cutting
isn't failure; it's the core skill of shipping in 15 days. Add the cut items to `docs/LATER.md` so they stop nagging you.

## You're done when…

- [ ] The core loop works on the deployed app from first click to a saved result; e2e test green; you pasted the
      commit link.
- [ ] `docs/BUILDLOG.md` has a Day 51 entry with done / next / blocked; you pasted it.
- [ ] You wrote what you cut and why, and parked it in `docs/LATER.md`.

**Tomorrow:** the AI that makes it worth using — with an eval and a price tag.
