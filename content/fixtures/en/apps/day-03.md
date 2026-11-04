---
day: 3
track: apps
phase: 1
title: "Boss: a tiny tool someone actually uses"
summary: "Build and publish a one-screen tool that solves a real annoyance for you or a friend."
estMinutes: 90
boss: true
resources:
  - https://developers.cloudflare.com/pages/
tasks:
  - id: d03-apps-t1
    type: build
    title: "Pick a real annoyance and build a one-screen tool for it"
    xp: 40
    proof: text
  - id: d03-apps-t2
    type: ship
    title: "Publish it and paste the live link"
    xp: 60
    proof: link
  - id: d03-apps-t3
    type: share
    title: "Get one person to try it — write down what they said"
    xp: 30
    proof: text
---

## Your first boss

Bosses are milestone projects. They go in your portfolio, so they should be **small, finished and real**.
A finished tip calculator beats an unfinished "AI startup".

## Pick the annoyance (10 minutes)

Write down three things that annoy you every week. Good candidates:

- splitting a bill with friends after dinner;
- turning a recipe for 4 people into a recipe for 2;
- counting how many days until a deadline, excluding weekends.

Pick the one you'd use yourself **this week**.

## Build it

```
Build a single-page web tool: [describe the annoyance].
It must work on a phone, have one screen, and need no login.
Keep the code in index.html, style.css and app.js.
Before writing code, show me a 5-line plan and wait for my OK.
```

Asking for a plan first is a habit worth keeping: it's cheaper to fix a plan than code.

## Ship it

Ask the agent to help you publish the folder as a static site (for example on Cloudflare Pages — link below).
Open the live link on your phone. If it works there, it works.

> **Tip:** Your first user can be your mum. Watch them use it without explaining anything — you'll learn more in two minutes than in an hour of polishing.

## You're done when…

- the tool is live at a public link;
- one real person has tried it;
- you wrote down one thing they struggled with.
