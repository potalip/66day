---
day: 28
track: common
phase: 2
title: "Four weeks in: tidy your workshop"
summary: "Sort a month of repos into keepers and archive, give every keeper a README, and notice what's now automatic."
estMinutes: 40
rest: true
resources:
  - "https://docs.github.com/en/get-started/start-your-journey/hello-world"
  - "https://choosealicense.com/"
tasks:
  - id: d28-t1
    type: build
    title: "Archive dead experiments and give every keeper a README"
    xp: 20
    proof: text
  - id: d28-t2
    type: reflect
    title: "List what you now do without thinking"
    xp: 20
    proof: text
---

A month of building leaves sawdust: half-finished repos, a folder called `test2-final-REAL`, renders nobody will
watch again. Today you sweep the workshop. A tidy bench is how a future client (and
future you) can tell the difference between a beginner and someone who ships.

## Today's ritual: keepers, archive, epitaphs

List everything you have on GitHub:

```bash
gh repo list --limit 100
```

No `gh`? Open github.com → your profile → Repositories. Sort each repo into one pile:

- **Keeper** — it works, you'd show it to someone. Apps: the main app from day 27, the bot, the day-13 tool.
  Video: the day-27 explainer project, the Remotion template, your ffmpeg cheat sheet.
- **Archive** — dead experiments. Archiving makes a repo read-only and keeps it, so nothing is lost:
  `gh repo archive your-name/repo-name` (or Settings → Archive this repository).

The small surprise: before you archive, write each one a one-line epitaph in a file called `GRAVEYARD.md` in your
main repo. "Weather page, day 8 — taught me what JSON is. Rest in peace." It turns "wasted time" into a list of
lessons.

## 1. A README on every keeper (20 min)

Open each keeper with your agent and paste:

```text
Goal: write a README.md for this repo that a stranger understands in 30 seconds.
Context: read the code and package files first. I'm a beginner showing my work.
Include: one-sentence what-and-who, a screenshot or GIF placeholder path I'll fill,
how to run it in 3 commands or fewer, what it's built with, and what I'd do next.
Constraints: plain words, no marketing fluff, no badges wall. Don't change any code.
Done when: README.md exists and every command in it actually works — run them to check.
```

Video people, one extra sweep: renders eat disk. Check with `du -sh */` and delete intermediate frame folders you
can regenerate; keep masters and the code that made them.

> **If you're stuck:** if the agent's "3 commands" don't work on a fresh clone, that's a real bug the README just
> found. Fix it now — it's the most useful thing you'll do today.

## 2. What's automatic now? (10 min)

List 3–5 things you now do without thinking. Commit before a risky change? Read the error before pasting it? Put
keys in `.env` without being reminded? Those are the habit, made visible.

## You're done when…

- [ ] You pasted your list: keepers (with README) and archived repos.
- [ ] You pasted 3–5 things you now do on autopilot.
