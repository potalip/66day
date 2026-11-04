---
day: 64
track: apps
phase: 4
title: "Final polish, v1.0, and a dress rehearsal"
summary: "Ship the last five fixes, tag v1.0 with a real changelog, and watch a friend go from launch post to value."
estMinutes: 90
resources:
  - "https://git-scm.com/book/en/v2"
  - "https://docs.github.com/en/actions"
  - "https://playwright.dev/"
tasks:
  - id: d64-apps-t1
    type: build
    title: "Make the last 5 fixes and tag v1.0"
    xp: 50
    proof: link
  - id: d64-apps-t2
    type: build
    title: "Run a dry run: a friend goes from post to sign-up to value"
    xp: 30
    proof: text
  - id: d64-apps-t3
    type: reflect
    title: "Define what success means for this launch"
    xp: 15
    proof: text
---

Theatres don't open on the first night the actors are in costume. They run a dress rehearsal: full show, real
lights, a small audience, and a director with a notebook. Tomorrow is opening night. Today is the rehearsal — and
the last moment when "let me just change one thing" is allowed.

## Why v1.0 is a ritual worth doing

A **git tag** is a permanent name for one exact commit. Tagging `v1.0.0` means: *this* is what launched. If launch day
goes sideways, you can always return to it; when you write the case study later, you can link to it; and a
**changelog** — a plain list of what changed and when — tells users and future clients that a real person maintains
this thing. The numbers follow **semantic versioning**: `MAJOR.MINOR.PATCH`. A bug fix tomorrow is `v1.0.1`; a new
feature next month is `v1.1.0`.

## Step by step

### 1. The last five fixes (35 min)

Open your "not now" list from day 54 (`docs/LATER.md`), your checklist from day 62 and any new feedback. Pick **exactly five** items,
each small enough for 5–10 minutes: a typo in the hero, a missing OG image, a confusing button label, a slow first
load, a forgotten dark-mode colour. Not features. Then:

```text
Goal: final polish before tagging v1.0.0. Fix these five items: [list them, one line each].
Constraints: smallest possible change per item, one commit each with a clear message; no new dependencies; no refactors. After all five: run the build, all Vitest and Playwright tests, and the launch/shoot.mjs screenshot script, and tell me if any screenshot changed in a way I should look at.
Then create CHANGELOG.md in "Keep a Changelog" style with a v1.0.0 section written for users, not developers: group my git history since the first commit into Added / Changed / Fixed, max 12 bullets, plain words.
Done when: everything passes and you've shown me the changelog.
```

Edit the changelog until it reads like a story a user cares about ("You can now save plans and come back to them"),
not a commit dump. Then tag and publish:

```bash
# after the five fixes are merged into main
git checkout main && git pull
git tag -a v1.0.0 -m "v1.0.0 — public launch"
git push origin v1.0.0
gh release create v1.0.0 --title "v1.0.0" --notes-file CHANGELOG.md
```

Deploy that exact commit to production. **Proof for task 1:** the release link on GitHub.

> **If you're stuck:** tag on the wrong commit? Delete and recreate it before anyone uses it:
> `git tag -d v1.0.0 && git push origin :refs/tags/v1.0.0`, then tag again. After launch, never move a tag — make
> `v1.0.1` instead.

### 2. The dress rehearsal (40 min)

Find a friend who has **not** used the app (your day-53 observer doesn't count). Recreate launch day as closely as you
can:

1. Send them your actual launch post from `launch/copy.md` — as a message, or a private draft — the way a stranger
   would meet it.
2. Ask them to think out loud: "Say what you're reading and what you expect to happen."
3. Watch them go **post → landing → sign-up → value**, ideally on their own phone. Start a timer when they open the
   post. Don't help.
4. Afterwards, ask three questions: *What do you think this does? Who is it for? Would you send it to someone — who?*

Write down: total time, every hesitation, their answers, and anything that broke. Then fix at most **one** thing — the
biggest — and leave the rest for v1.0.1. Rehearsals are for finding problems, not for rebuilding the stage.

**Proof for task 2:** your notes, including the time and their three answers.

> **Tip:** ask the agent to run your Playwright first-run test against production every 10 minutes during launch day
> and send you a Telegram message if it fails — a scheduled GitHub Actions workflow or a Cloudflare Cron Trigger both
> work (GitHub may start scheduled runs a few minutes late). A few dozen lines, and you'll know about an outage before
> your users tell you.

### 3. What does success mean? (15 min)

Write down, *before* the launch, what success means — or tomorrow your brain will move the goalposts either way. Use
three lines:

- **A number you control:** "I reply to every comment within an hour."
- **A number you hope for:** "50 visitors, 10 sign-ups, 3 people using it on day two."
- **A feeling:** "I'm proud to send this link to a potential client."

Compare the middle line with the launch target you wrote in `docs/CAPSTONE.md` on day 50 — adjust it honestly if the
beta taught you otherwise. The first one is the only one guaranteed. The last one is the one that matters on day 66. **Proof for task 3:** your
three lines.

## You're done when…

- [ ] Five fixes are merged, `v1.0.0` is tagged with a user-friendly changelog, released and deployed; link pasted.
- [ ] A friend did the full dry run; time, hesitations and their three answers are written down.
- [ ] You defined success in three lines: one you control, one you hope for, one feeling.

**Tomorrow:** launch day. Sleep well. Your kit is ready, and so are you.
