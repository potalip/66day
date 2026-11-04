---
day: 27
track: apps
phase: 2
title: "Boss: your full-stack AI app, with real users"
summary: "Finish v1 — logins, data, AI — put it live, get three real people using it, and tell the world what you built."
estMinutes: 150
boss: true
badges: [boss-build]
resources:
  - "https://developers.cloudflare.com/workers/"
  - "https://vercel.com/docs"
  - "https://www.producthunt.com/"
tasks:
  - id: d27-apps-t1
    type: build
    title: "Finish v1 and deploy it; paste the live link"
    xp: 100
    proof: link
  - id: d27-apps-t2
    type: ship
    title: "Onboard 3 real users and write what each one did"
    xp: 60
    proof: text
  - id: d27-apps-t3
    type: build
    title: "Write a five-line README"
    xp: 20
    proof: text
  - id: d27-apps-t4
    type: share
    title: "Publish a public post with screenshots or a 30-second recording"
    xp: 30
    proof: link
---

Twelve days ago this was an annoyance and a one-page spec. Since then it got a face, a memory, an AI brain, eyes and
ears, logins, a document reader and hands. Today it becomes a **product**: something live that strangers can sign in
to and use without you standing behind them. The boss isn't "add more". The boss is **finish, ship, and watch.**

## The rules of the boss fight

- **No new features today.** Anything not in your day-15 spec's "Done when" goes on a list called *v1.1*.
- **Real users** means three people who aren't you, using it with their *own* data, on their *own* phones.
- **Done beats perfect.** A rough edge that doesn't block the three user stories ships.

Time plan: release audit and fixes (60 min), deploy and phone check (20), three users (40), README and post (30).

## Step by step

### 1. Release audit, fixes, deploy (80 min)

Start with an honest look, not with code:

```text
Goal: get v1 release-ready. Do NOT change any code yet.

Do a release audit:
1. Read docs/SPEC.md. For each user story and each "Done when" item, say: works / partly / missing, with how you checked (test, curl, or what you clicked).
2. Run the build and all tests; report failures.
3. Check: every API route requires auth except sign-in; no secrets in the repo (search the git history too); friendly empty, loading and error states on every screen; "AI not configured" fallback works; daily AI limits on; the app is usable at 390px wide.
4. Propose a fix list ordered by "blocks a user story" first. Max 8 items. Mark anything else as v1.1.

Show me the audit and the fix list, then wait for my OK. After fixing each item, verify it and tell me how.
```

Agree the list, let the agent fix, and commit as you go. Then deploy and do the **phone check** yourself: on mobile
data (not your Wi-Fi), in a private window, sign up as a brand-new user and complete all three user stories. Anything
that blocks you blocks your users — fix it now.

Before inviting anyone, add two small things: a one-line note on what you store and how to delete it, and a
**feedback link** (a mailto, or a tiny form that saves to your database).

Paste the live link as proof.

> **If you're stuck:** if a fix is turning into a rewrite, stop. Ask the agent "what's the smallest change that unblocks
> the user story?" and put the proper fix on v1.1. If the deploy broke something that worked locally, compare
> environment variables and secrets first, then run your migrations with `--remote`.

### 2. Three real users (40 min)

Pick people who actually have the problem: the person from your day-13 boss, a friend job-hunting, a flatmate, one of
your bot testers. Send a personal message, not a broadcast:

> "Hey Lena — I built a small tool for tracking job applications (you mentioned losing deadlines). Would you try it for
> 10 minutes today and tell me what's confusing? Here's the link."

If possible, watch one of them live (in person or screen-sharing). Don't explain, don't defend; just note where they
pause. For each person write: who (initials), what they tried, what worked, where they got stuck, and one quote.

### 3. A five-line README (10 min)

```text
Rewrite README.md as exactly five lines: 1) app name + what it does in one sentence; 2) who it's for;
3) live link; 4) how to run it locally (one command after cloning, mention .dev.vars.example — create it if missing: variable names only, no values);
5) stack and status ("v1, used by 3 people"). Show it to me before saving.
```

Paste the five lines as proof.

### 4. Tell the world (20 min)

Record 30 seconds of the app on your phone (built-in screen recorder): the problem in one sentence, then the moment
the AI fills the form or answers with a citation. Post it where builders and potential users hang out: X or Threads,
LinkedIn, a relevant subreddit like r/SideProject, your build log from day 12. Shape:

> Day 27 of 66. I built **[name]**: [problem in one line]. Paste a job ad → it fills the form, reminds you of
> deadlines, and answers "which roles fit my CV?" with page citations. 3 people used it this week. Built with a coding
> agent, Cloudflare Workers + D1 + Claude. Try it: [link]. What should v1.1 fix?

Paste the post link.

> **Safety:** before posting, check screenshots and the recording for real names, emails and other users' data. Use
> your own demo account.

## You're done when…

- [ ] v1 is live, all three user stories work on a phone from a fresh account — you pasted the live link.
- [ ] Three real people used it — you wrote what each one did.
- [ ] Your README is five clear lines — you pasted them.
- [ ] Your public post with a screenshot or recording is up — you pasted the link.

Boss down. You've shipped a real full-stack AI product. Next up: rest, then the professional layer — tests, CI,
payments and security.
