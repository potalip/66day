---
day: 50
track: apps
phase: 3
title: "Capstone: pick it, spec it, say it out loud"
summary: "Choose the capstone you'll launch on day 65, write a spec with daily milestones and kill criteria, and announce it."
estMinutes: 90
resources:
  - "https://docs.anthropic.com/en/docs/claude-code/overview"
  - "https://www.producthunt.com/"
  - "https://news.ycombinator.com/showhn.html"
tasks:
  - id: d50-apps-t1
    type: read
    title: "Learn what makes a capstone worth 15 days"
    xp: 10
    proof: none
  - id: d50-apps-t2
    type: build
    title: "Write the spec — problem, users, v1 scope, milestones — and paste it"
    xp: 50
    proof: text
  - id: d50-apps-t3
    type: build
    title: "List your risks and set kill criteria"
    xp: 20
    proof: text
  - id: d50-apps-t4
    type: share
    title: "Announce your capstone publicly"
    xp: 20
    proof: link
---

Fifty days ago you had never opened a terminal. Today you pick the thing you'll **launch publicly on day 65** — the
project that sits at the top of your portfolio and that you'll point clients to. Fifteen days is enough for
something real, and short enough that a fuzzy choice will eat you alive. So today is about choosing well and
writing it down.

## What makes a good capstone

Take the three ideas from yesterday's shortlist and score each 1–5 on four questions:

| | Question | Why it matters |
|---|---|---|
| **Real users** | Can you name 5 people who have this problem and who'd try it next week? | No testers on day 54 = no beta on day 55. |
| **AI at the core** | If you removed the AI, would the product stop making sense? | A to-do app with a "summarise" button isn't an AI product. |
| **You care** | Will you still want to work on it on day 60, tired? | Motivation is a resource; spend it on a problem you like. |
| **Doable** | Could the core loop work by tomorrow evening with your current stack? | 15 days include two rest days, four earning days and a launch. |

Highest total wins. Ties go to "real users".

**Evolve the main app or start fresh?** Evolving your main app is often the smart move: users, auth, payments,
analytics, evals and a PWA are already there, and your capstone becomes "v2 with the feature people actually asked for".
Start fresh when the main app taught you what the *real* problem is — like the student whose recipe app kept getting
"can it plan meals for my diabetic dad?" and whose capstone became exactly that.

## Step by step

### 1. Choose (15 min)

Score your three ideas in the table. Message two of your "real users" right now and ask: "If I built X, would you try
it next week?" A quick "yes, and can it also…" is worth more than any scoring.

### 2. Write the spec with your agent (40 min)

```text
You are a sharp product manager. Interview me with one question at a time (max 10 questions) and then write docs/CAPSTONE.md for my capstone: <one-sentence idea>, built <on top of my main app / as a new product>.
Sections:
1. Problem — who, what pain, how they cope today (with a real quote if I have one).
2. Users — the 5 named people (first names only) and how I'll reach them.
3. Promise — one sentence a user would say after using it.
4. Core loop — the single flow from arrival to value, as 3-6 steps.
5. The AI at the core — what the model does, which model tier, how I'll eval it (10 cases on day 52).
6. v1 scope — IN (max 5 items) and OUT (everything else, explicitly listed).
7. Success metrics — for the day-55 beta (e.g. 10 users, 50% finish the core loop) and day-65 launch.
8. Milestones — one line per day, using this calendar:
   51 core loop end to end · 52 core AI + eval + cost per user · 53 onboarding and polish ·
   54 5 beta testers, fix top 3 · 55 public beta (boss) · 56 rest ·
   57-60 portfolio and paid-work days: 20-30 min of capstone fixes each · 61 starter kit extracted ·
   62 launch kit and channels · 63 rest · 64 final polish, tag v1.0 · 65 launch.
Push back if my IN list is too big for this calendar. Keep the whole spec under 1 page.
```

Read it critically. If the core loop has more than six steps or the IN list has more than five items, cut. Paste
the spec.

> **If you're stuck:** can't decide between two ideas? Pick the one where you can name the 5 users. The other goes
> into `docs/LATER.md` — it's not dead, it's parked. You'll keep that file (and `docs/BUILDLOG.md`, from
> tomorrow) all the way to launch.

### 3. Risks and kill criteria (20 min)

Every project has a few ways to die. List them now while you're calm:

- **Users** — nobody signs up, or they try once and never return.
- **Tech** — the AI part is too slow, too expensive or too unreliable (you'll know on day 52).
- **Scope** — the core loop takes three days, not one.
- **You** — a busy week at work, illness, a family thing.

For each, write a **kill criterion**: a specific, dated signal and what you'll do when you see it. Not "kill the
project" — usually "kill this version":

> "If by day 54 fewer than 3 of my 5 testers finish the core loop without my help, I cut the meal-plan export and
> ship only the weekly shopping list."
> "If one AI run costs more than $0.05 on day 52, I switch to a cheaper model tier and shorter context."

Deciding this today stops tired-you on day 58 from either quitting or stubbornly polishing the wrong thing.
Paste your risks and kill criteria.

### 4. Announce it (15 min)

Saying it publicly is the cheapest motivation hack there is. Post on X, Threads, LinkedIn, Bluesky, a relevant
subreddit or your community — wherever your 5 users or your future clients are:

```text
Day 50 of 66: I'm building <name> — <promise in one line>.
For: <who>. Why: <the pain, one sentence>.
Launching publicly on <date of your day 65>. I'll post progress every few days.
If this is your problem too, reply — I'm looking for 5 beta testers.
```

Add one screenshot or sketch. Paste the link.

## You're done when…

- [ ] You scored your shortlist on real users, AI at the core, care and doability.
- [ ] `docs/CAPSTONE.md` exists with all 8 sections and a day-by-day plan to 65; you pasted it.
- [ ] You pasted your risks with dated, specific kill criteria.
- [ ] Your public announcement is live and you pasted the link.

**Tomorrow:** one day, one flow, end to end.
