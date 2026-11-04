---
day: 65
track: apps
phase: 4
title: "Boss: launch day"
summary: "You launch your capstone in public, stay present for the first hours, and publish an honest 24-hour report and thank-you."
estMinutes: 150
boss: true
badges: [launched]
resources:
  - "https://www.producthunt.com/"
  - "https://news.ycombinator.com/showhn.html"
  - "https://plausible.io/docs"
  - "https://posthog.com/docs"
tasks:
  - id: d65-apps-t1
    type: ship
    title: "Launch publicly and paste the launch post link"
    xp: 120
    proof: link
  - id: d65-apps-t2
    type: build
    title: "Write the 24-hour report: visitors, sign-ups, feedback, what broke"
    xp: 40
    proof: text
  - id: d65-apps-t3
    type: share
    title: "Publish a thank-you and learnings post"
    xp: 30
    proof: link
---

Sixty-four days ago you couldn't open a terminal without a small panic. Today you launch a real product, with real
users, an AI feature that is measured, a changelog and a tag called `v1.0.0`. The work is done. Launch day isn't about
building — it's about **being there**: posting well, answering every person, fixing what breaks in public, and
writing down what happened while it's fresh.

## The shape of the day

Your 150 minutes are spread over 24 hours in short, focused blocks. Put them in your calendar now.

| When | Block | Minutes |
|---|---|---|
| T−30 min | Pre-flight | 15 |
| T+0 | Post on the main channel | 15 |
| T+0 → T+2 h | Be present: replies within 15 min | 45 |
| T+3 h | Supporting channels + personal messages | 20 |
| T+6 h | Check-in: numbers, bugs, replies | 15 |
| Evening | Last reply round, hotfix only if needed | 10 |
| T+24 h | 24-hour report + thank-you post | 30 |

"T+0" is your launch time from the day 62 channel plan. Pick a time when you'll be awake and free for the next two
hours — that matters more than any "best time to post" chart.

## Step by step

### T−30: Pre-flight (15 min)

Open production on your phone, on mobile data. Run the first-run flow once. Then:

```text
Pre-flight check for launch. Against the production URL [url]:
1. Run the Playwright first-run test and the launch/shoot.mjs script; report pass/fail.
2. Confirm the deployed commit equals the v1.0.0 tag.
3. Hit the AI endpoint 3 times and report latency; confirm rate limits respond with a friendly message.
4. Start the 10-minute production monitor from yesterday (Telegram alert on failure).
Report in 5 lines. Change nothing unless something fails, and if it fails, tell me before fixing.
```

Open three tabs you'll keep all day: your analytics, your error logs, your notifications.

### T+0: Post (15 min)

Post on your main channel using `launch/copy.md`. Starting points to adapt — make them yours:

```text
SHOW HN
Title: Show HN: [Name] – [what it does in plain words]
First comment (post it yourself right away):
Hi HN, I built [Name] because [one-sentence personal reason]. It [does X] for [who].
How it works: [2–3 sentences, the honest technical bit: stack, which model tier, what runs where].
What it doesn't do yet: [1–2 limits]. No sign-up needed to try: [url].
I'd love feedback on [one specific question].

PRODUCT HUNT
Tagline (≤ 60 chars): [from launch/copy.md]
Maker comment: Hey everyone! [Problem in one line]. I built [Name] over the last two weeks as the capstone of
a 66-day program where I learned to build with AI agents. [What it does, 2 lines]. [Beta quote].
What I'd love to hear: [one question]. Thanks for looking!

X / THREADS / LINKEDIN
1/ I just launched [Name]: [what it does for whom]. [GIF]
2/ Why: [the moment you noticed the problem]
3/ What 5 beta testers taught me: [one surprising insight]
4/ How it's built: [one line]. Try it: [url]. I read every reply today.
```

> **Tip:** on every platform, ask for **feedback**, never for upvotes. Asking friends to upvote is against the rules on
> Product Hunt and Hacker News, and both can detect it. Telling people "I launched, here's the link" is fine.

**Proof for task 1:** the launch post link.

### T+0 → T+2 h: Be present (45 min)

This is the most important block. Reply to every comment within ~15 minutes. Rules of the comment section:

- Thank people, then **answer the actual question**. Short and specific beats long and polite.
- Criticism? "Fair point — here's why it's like that / I'll fix it" — never defensive, never argue about taste.
- A bug report? Reproduce it, fix it if it's small, deploy, and reply "Fixed in v1.0.1, thanks!" That public reply is
  the best marketing of your day.

For hotfixes, keep the agent on a short leash:

```text
Hotfix during launch. Bug: [what the user said + steps]. Make the smallest possible fix, add a test that fails
before and passes after, run all tests, then stop and show me the diff. No refactors, no other changes.
```

Then `git tag -a v1.0.1 -m "Hotfix: …"` and deploy.

> **If you're stuck:** the app is down and you don't know why? Roll back to `v1.0.0` first, post "Back up — I'm
> looking into what happened", then investigate calmly. A 5-minute outage with an honest note is forgiven. A 2-hour
> silent outage isn't.

### T+3 h and T+6 h: Spread and check (35 min)

Post on your supporting channels. Then personally message the people from your plan: the beta testers, your day-41
client, the friends who offered. A personal "it's live, would mean a lot if you shared it with one person who needs it"
outperforms any broadcast. At T+6, glance at the numbers — not to judge, just to notice.

### T+24 h: The report and the thank-you (30 min)

```text
Write a 24-hour launch report from our data. Use the events table / analytics for the last 24 hours:
visitors by source, sign-ups, activation (reached value ÷ new visitors), returning users, AI calls and cost,
errors by route. Then summarise the comments and feedback into: top 3 praises, top 3 complaints, top 3 requests.
List what broke and how it was fixed. Format: a markdown table + bullets. Don't round small numbers up.
```

Check every number yourself — agents can misread a query. Add one line comparing it to your day 64 success
definition. **Proof for task 2:** the report.

Finally, the thank-you post: *thanks* (name helpers who are happy to be named), *numbers* (honest, small is fine),
*what I learned* (three lessons), *what's next* (v1.1 or "I'm taking projects like this"). **Proof for task 3:** the link.

## You're done when…

- [ ] Your capstone is launched publicly; the launch post link is pasted.
- [ ] Your 24-hour report has visitors, sign-ups, activation, feedback and what broke.
- [ ] Your thank-you and learnings post is live; the link is pasted.

You launched. Whatever the numbers say, you are now someone who ships. Tomorrow: graduation.
