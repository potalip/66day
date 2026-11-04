---
day: 48
track: apps
phase: 3
title: "Open-source your work"
summary: "Make one repo stranger-ready — GIF, licence, 3-command setup — and land one small contribution in someone else's project."
estMinutes: 75
resources:
  - "https://choosealicense.com/"
  - "https://docs.github.com/en/get-started/start-your-journey/hello-world"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d48-apps-t1
    type: read
    title: "Learn what makes a repo inviting in the first 10 seconds"
    xp: 10
    proof: none
  - id: d48-apps-t2
    type: build
    title: "Ship a README with a GIF, a licence and 3-command setup; share the repo link"
    xp: 40
    proof: link
  - id: d48-apps-t3
    type: build
    title: "Make one small contribution to another project and share the link"
    xp: 30
    proof: link
  - id: d48-apps-t4
    type: reflect
    title: "Write what you'd want a stranger to notice first"
    xp: 15
    proof: text
---

A public repo is a portfolio piece that's always on display. A future client, a hiring manager or a fellow
builder lands on it and decides in about ten seconds whether you're someone who finishes things. Today you make one
repo pass that ten-second test, and you send your first contribution to a project you've been using for free.

## What makes a repo inviting

Visitors read the top of the README and leave. So the top must answer, in order:

1. **What is it?** One sentence, no jargon: "A Telegram bot that turns voice notes into a shared shopping list."
2. **Does it work?** A GIF or screenshot showing it in action — the single most convincing thing on the page.
3. **Can I run it?** Three commands, copy-pasteable, that work on a fresh machine.
4. **Can I use it?** A **licence**. No licence means "all rights reserved" — legally nobody may use your code,
   however friendly you are.

Nice extras: a short "How it works" section, a `.env.example` with every variable explained, a few issues labelled
`good first issue`, and a description plus topics on the GitHub repo page.

**Which repo?** Your main app if you're happy to show it. If it's becoming a paid product, open-source a smaller,
reusable piece instead: your MCP server from day 39, your Telegram bot, or your eval runner from yesterday.

## Step by step

### 1. Make sure nothing secret goes public (10 min)

Before anything else — git remembers **everything**, including a `.env` you committed by accident weeks ago and deleted the next day.

```text
Scan this repository, including the full git history, for secrets: API keys, tokens, passwords, private URLs, real user data. Use gitleaks if it's available (or search the history with git log -p for typical key patterns).
List every finding with the commit and file. Don't rewrite history yet — just report.
```

If anything real turns up: **rotate the key first** (create a new one at the provider, revoke the old one), then
decide with the agent whether to clean history or start a fresh public repo from the current code. Rotating is not
optional — assume a leaked key is already copied.

### 2. README, GIF, licence, 3-command setup (30 min)

Record a 10–20 second screen capture of the main flow (any screen recorder or a Playwright video), then turn it
into a small GIF:

```bash
ffmpeg -i demo.mp4 -vf "fps=12,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" docs/demo.gif
```

Aim for under 5 MB so it loads fast. Pick a licence at choosealicense.com: **MIT** if you just want people to use it,
**Apache-2.0** if you also want an explicit patent grant, **AGPL-3.0** if you want anyone who runs a modified version
as a service to share their changes.

```text
Goal: make this repo welcoming to a stranger.
1. Rewrite README.md: one-sentence description; docs/demo.gif right below it; "Quick start" with exactly 3 commands (git clone ... && cd ..., npm run setup, npm run dev); "How it works" in 5 bullets; "Configuration" table built from .env.example; "Licence" line.
2. Add `npm run setup`: copies .env.example to .env if missing, installs dependencies, applies local migrations.
3. Make sure the app starts without any API keys (AI features show "not configured" with demo data).
4. Add the <MIT/Apache-2.0/AGPL-3.0> LICENSE file with my name and the year.
5. Add a short CONTRIBUTING.md (how to run tests, how to open a PR) and create 2 issues labelled good first issue.
Done when: in a fresh clone in a temp folder, the 3 commands bring the app up.
```

Then **actually test it**: clone into a new folder and run the three commands yourself. Whatever breaks, a stranger
would hit too. Make the repo public, add a description and 3–5 topics, and paste the link.

> **If you're stuck:** "works on my machine" usually means a missing `.env` value, an un-applied migration, or a
> global tool you installed months ago. Ask the agent to list every external requirement (Node version, ffmpeg,
> Python) and state them in the README with the exact versions.

### 3. One small contribution elsewhere (25 min)

You've used dozens of open-source tools in 48 days. Give one of them something small and real:

- **A docs fix**: a typo, a broken link, an outdated command you noticed while following their guide.
- **A good bug report**: what you did, what you expected, what happened, versions, a minimal reproduction.
- **A small PR**: an example, a test, a clearer error message.

Etiquette that gets you merged instead of ignored: read `CONTRIBUTING.md` first, search existing issues, keep it
small, and explain *why*. Maintainers are drowning in low-effort AI-generated PRs — use your agent to help, but
understand and stand behind every line, and say that AI helped if the project asks. A thoughtful issue is worth more
than a careless PR.

Paste the link to your issue or PR. It doesn't have to be merged today.

## Reflect

Look at your repo as if you'd found it on Reddit or Hacker News. In 3–5 sentences: what do you want a stranger to
notice first — and does the top of your README actually show it? If not, fix it now; that counts too.

## You're done when…

- [ ] You know the four questions a README top must answer.
- [ ] History is scanned, any leaked key rotated; the repo is public with GIF, licence and a 3-command setup you
      tested in a fresh clone; you pasted the link.
- [ ] You opened an issue or PR on another project and pasted the link.
- [ ] You wrote what a stranger should notice first.

**Tomorrow:** rest day — and your capstone shortlist.
