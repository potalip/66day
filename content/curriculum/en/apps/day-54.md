---
day: 54
track: apps
phase: 4
title: "Five beta testers, three real fixes"
summary: "Five real people use your capstone for a real task; you fix the three things that hurt them most and ship the fixes."
estMinutes: 90
resources:
  - "https://docs.github.com/en/get-started/start-your-journey/hello-world"
  - "https://posthog.com/docs"
  - "https://plausible.io/docs"
tasks:
  - id: d54-apps-t1
    type: ship
    title: "Get 5 beta testers using it and log who did what"
    xp: 60
    proof: text
  - id: d54-apps-t2
    type: build
    title: "Fix the top 3 issues and open a PR"
    xp: 40
    proof: link
  - id: d54-apps-t3
    type: reflect
    title: "Decide what you will not fix before launch"
    xp: 15
    proof: text
---

Yesterday one person hesitated in front of you. Today five people use your capstone without you in the room, and you
find out what breaks when nobody is there to explain. A beta isn't a test of the app — it's a test of your guesses
about the app.

## A beta is a conversation with a deadline

A good beta has three properties:

- **Real people with the real problem.** Not your mum being polite. People who match the "users" line from your
  day 50 spec. Your best sources are already in your hands: the 3 users from day 27, the waitlist from your day 36
  landing page, the client from day 41, and anyone who replied to your day 50 announcement.
- **A specific task.** "Have a look" produces "looks nice!". "Use it to plan next week's meals and tell me where it
  annoyed you" produces data.
- **A short window.** 24–48 hours. Long betas fade; people forget.

Your feedback button from day 37 is now your best friend. If it isn't on every screen, add it first thing.

## Step by step

### 1. Invite five (20 min, plus waiting)

Aim for 8 invitations to get 5 testers — some people will be busy. Personal messages, not a broadcast. Adapt this:

> Hi Sam — I'm building [app] for people who [problem]. You mentioned [the thing they said]. Would you try it for
> 10 minutes in the next day or two? The task: [one specific task]. Anything that confuses or annoys you is gold —
> there's a feedback button on every screen, or just reply here. Link: [url]. Thank you!

Send them now, then do step 2 while you wait.

> **Tip:** if you can, book one or two 15-minute video calls where the tester shares their screen. You'll learn more
> from 15 minutes of watching than from 15 written comments.

### 2. Make sure you'll see what they do (15 min)

You need to know *what* happened, not just what people say. Ask your agent for minimal, privacy-respecting signals:

```text
Goal: during the beta I can see what each tester did, without collecting anything creepy.
Context: reuse the events table + track() helper from day 34 (if the capstone is a new app, copy that migration and helper over first; an optional Plausible/PostHog mirror is fine).
Do:
1. Add 4 beta events to the allow-list: visited, started_core_flow, reached_value_moment, gave_feedback (with a timestamp and an anonymous or account id; no message contents, no emails in events).
2. Make sure every server error is logged with route + time so I can match it to a tester's report.
3. Write one SQL query (or dashboard view) that shows, per user: the four events in order and the time between them.
Done when: I trigger all 4 events myself on the deployed app and see them in the query result.
```

### 3. Log who did what (20 min, spread across the day)

As testers come in, keep a simple table under a `## Day 54` heading in `docs/BUILDLOG.md` (you'll reuse it
for the launch kit on day 62):

| Tester | Got to value? | Time | Where they stuck | Quote |
|---|---|---|---|---|
| Sam | yes | 1:40 | didn't find "save" | "I'd use this on Sundays" |

**Proof for task 1:** paste the table (first names or initials only — no private data). Then reread your day-50
kill criteria in `docs/CAPSTONE.md`: if one has fired, today is the day to cut, as you promised yourself.

> **If you're stuck:** two testers by evening and the rest silent? Send one polite nudge ("no pressure — even 3
> minutes helps"). Still short? Ask in a community you're part of, or in the program chat — other students are
> looking for testers too, and swapping tests is fair. Five real attempts beat five promises.

### 4. Triage and fix the top three (30 min)

Put every problem into one list and score it: **how many testers hit it × how badly it hurt** (1 = annoying,
3 = blocked them). The top three by score are today's fixes. Hand them to your agent as GitHub issues, one per problem,
then:

```text
Goal: fix issues #[a], #[b], #[c] from the beta, in one branch, one PR.
Context: each issue has the tester's words and steps to reproduce. Read them before coding.
Constraints: smallest change that solves the real problem; no refactors; keep the first run under 2 minutes; add or update a Playwright or Vitest test for each fix where it's practical.
Done when: build and tests pass, the PR description lists each issue with "before / after" in one sentence, and the PR links the issues with "Closes #…".
```

Review the PR like a senior (you did this on day 38): does each fix address what the tester *meant*, not just what
they literally said? Merge, deploy, then message the testers whose issue you fixed: "You found it, it's fixed." People
who see their feedback land become your loudest supporters on launch day. **Proof for task 2:** the PR link.

### 5. Write the "not now" list (5 min)

Some feedback is real and still shouldn't be fixed before launch: a feature only one person wants, a redesign, a
"could it also do X". Add them to `docs/LATER.md`, with a reason each. This isn't laziness — it's scope control, and it protects
launch day. **Proof for task 3:** your list plus the one item it hurts most to postpone.

## You're done when…

- [ ] At least 5 real people tried the capstone; your who-did-what table is pasted.
- [ ] The top 3 issues are fixed in one merged PR, deployed; the link is pasted.
- [ ] You wrote what you will *not* fix before launch, and why.

**Tomorrow:** boss day. The beta goes public.
