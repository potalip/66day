---
day: 41
track: apps
phase: 3
title: "Boss: a real client brief"
summary: "A 20-minute discovery call with a real small business, a tool built and deployed in a day, a proper hand-over and a case study."
estMinutes: 180
boss: true
badges: [boss-client]
resources:
  - "https://contra.com/"
  - "https://www.upwork.com/"
  - "https://docs.github.com/en/get-started/start-your-journey/hello-world"
tasks:
  - id: d41-apps-t1
    type: build
    title: "Run a 20-minute discovery call and write the brief"
    xp: 20
    proof: text
  - id: d41-apps-t2
    type: build
    title: "Build and deploy the solution"
    xp: 100
    proof: link
  - id: d41-apps-t3
    type: ship
    title: "Hand it over with a demo and a short guide; collect feedback"
    xp: 60
    proof: text
  - id: d41-apps-t4
    type: share
    title: "Publish a case study"
    xp: 30
    proof: link
---

Everything from the last 40 days comes together today, for someone who isn't you. A real person with a real business
problem, a tool that solves a slice of it, and a hand-over so good they can use it without calling you. This is
exactly what clients pay for, and today's result becomes the first case study in your portfolio.

## Find your client (do this a day or two early if you can)

Good first clients are small, busy and close: a studio, a shop, a tutor, a creator, a club, a friend's team. Ask
around: *"I'm learning to build small tools. I'd like to solve one annoying task for your business for free, in
exchange for honest feedback and permission to write about it."* Free is fine for this first one; the case study is
your payment.

Example (yours will differ): **Marta runs a small yoga studio in Lisbon.** Classes fill up, people on the waitlist
are tracked in a WhatsApp chat and a spreadsheet, and every cancellation means 15 minutes of scrolling and messaging.
Other realistic briefs: a podcast host who wants guest intake forms turned into a prep sheet; a three-person design
agency that wants one dashboard over their invoice spreadsheet; a bike-repair shop that wants a "your bike is ready"
message.

## Step by step

### 1. The 20-minute discovery call (30 min with notes)

Your job on the call is to listen, not to pitch. Use this script:

1. **Today (5 min):** "Walk me through the last time you did this task, step by step. What tools did you use?"
2. **Pain (5 min):** "What's the most annoying part? How often? How long does it take? What happens when it goes wrong?"
3. **Success (5 min):** "If this worked perfectly in a month, what would be different? How would you know?"
4. **Constraints (3 min):** "Who will use it? On a phone or a computer? What can't change (tools, data, privacy)?"
5. **Close (2 min):** "I'll send you a one-paragraph plan today. Can we do a 15-minute hand-over call tomorrow?"

Ask to see the real thing: the spreadsheet, the chat, the form. Don't take passwords; ask for an export or a copy.

Then turn your notes into a brief with the agent:

```text
Goal: turn my discovery-call notes into a one-page brief.
Notes: <paste>.
Format: client and context (2 lines); the problem in their words; who uses it and on which device;
v1 scope = the ONE workflow we'll solve, as 3 user stories; out of scope (at least 4 items);
data and privacy notes; success criterion they named; risks; what I need from them.
Constraints: v1 must be buildable by me with a coding agent in about 2 hours of build time.
```

Cut the scope until it scares you a little. Send the brief to the client for a "yes". Paste the brief for task 1.

> **Important:** you'll handle their customers' data. Collect the minimum, keep it in their accounts or a private
> database, no real data in public repos, and agree in writing (a message is fine) on what you store.

### 2. Build and deploy (90 min)

You have all the parts: a UI, a database, auth, AI with fallback, scheduled jobs, Telegram, tests, CI. Start a fresh
folder and repo next to your main app, e.g. `~/66/apps/marta-waitlist`, and give the agent the brief:

```text
Goal: build v1 of the tool described in BRIEF.md (paste the brief into the repo first).
Context: reuse our usual stack (React + Vite + Tailwind, Cloudflare Workers + D1, auth as on day 24,
the day-31 Telegram helper if needed).
Constraints:
- Only the 3 user stories in scope. Mobile-first, both themes, in the client's language.
- Simple sign-in for the client's staff only; per-business data isolation.
- Tests for the core rule (e.g. "next person on the waitlist gets the spot"); CI on GitHub Actions.
- Seed with realistic fake data for the demo; a clear import path for their real data.
- AI only where it really helps; works without an API key.
Done when: deployed, the 3 stories work end to end at 390px, and CI is green. Plan the work first and show me.
```

For Marta, that might be: a class list with a waitlist per class, a "spot freed" button, and an automatic Telegram or
email message to the next person with a link to confirm within 2 hours
(a Telegram bot can only message people who have pressed Start in it, so email is the safe default). Test every story as the client would, on a
phone. Paste the live link for task 2.

> **If you're stuck:** at the halfway mark, if a story isn't working, cut it and tell the client honestly: "This is v1;
> X comes next week." A finished small tool beats an unfinished big one, every time.

### 3. Hand-over (40 min)

A tool nobody can use without you isn't finished. Prepare:

- **A one-page guide** (ask the agent to draft it from the code, then rewrite it in plain words): how to log in, the
  3 tasks step by step with screenshots, what to do if something looks wrong, how to reach you.
- **Ownership**: who owns the accounts and the repo. Ideally the client owns their hosting account and you're invited;
  or you agree to host it for a set period. Write it down.
- **A 15-minute demo call**: let *them* drive. Watch where they hesitate; that's your next fix.

Ask three questions at the end: "What would you show a colleague first? What's confusing? Would you pay for this, and
for what?" Paste for task 3: how the hand-over went, their feedback (quote them), and what you'll fix.

### 4. Case study (20 min)

With their permission, write a short public post: the problem (with a number, "15 minutes per cancellation"), what
you built, one screenshot, the result or their quote, and what you learned. Post it on LinkedIn, X/Threads, a dev
community or your blog, and pin it. Paste the link.

```text
Draft a 200-word case study from: brief, what I built, client quote, before/after numbers.
Tone: specific and modest, no hype. End with one line: "Have a similar problem? Message me."
```

## You're done when…

- [ ] Discovery call done; one-page brief approved by the client and pasted.
- [ ] The tool is deployed, the 3 stories work on a phone, CI is green. Link pasted.
- [ ] Hand-over demo held, guide delivered, ownership agreed; client feedback pasted.
- [ ] Case study published with permission. Link pasted. Badge: **boss-client**.

You just did a freelance project start to finish. After the rest day, your app moves onto phones: installable from the home screen, then inside Telegram.
