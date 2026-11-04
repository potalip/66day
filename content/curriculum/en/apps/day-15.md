---
day: 15
track: apps
phase: 2
title: "Problem first: from annoyance to spec"
summary: "Pick the one real problem your main app will solve, write a one-page spec with your agent, and scaffold the repo."
estMinutes: 75
resources:
  - "https://docs.anthropic.com/en/docs/claude-code/overview"
  - "https://vite.dev/guide/"
  - "https://tailwindcss.com/docs"
  - "https://react.dev/learn"
tasks:
  - id: d15-apps-t1
    type: read
    title: "Learn how to scope a v1 you can ship in a week"
    xp: 10
    proof: none
  - id: d15-apps-t2
    type: build
    title: "Write a one-page spec with your agent and paste it"
    xp: 40
    proof: text
  - id: d15-apps-t3
    type: build
    title: "Scaffold the project and push the first commit"
    xp: 40
    proof: link
  - id: d15-apps-t4
    type: reflect
    title: "Explain why this problem, and why you"
    xp: 15
    proof: text
---

For the next thirteen days you grow **one** app. Not a todo list from a tutorial — a tool for a real annoyance that a
real person (maybe you) has every week. On day 27 three people will use it. Today you choose the problem, write it down
so clearly that your agent can't misunderstand it, and lay the first brick.

## Scope a v1 you can ship in a week

A **spec** (specification) is a one-page agreement between you, your future self and your agent about what you are
building. Agents are brilliant at *how* and terrible at guessing *what*. Every vague line in a spec becomes an hour of
rework later.

A good v1 has one user, one job, one main screen. Use this filter:

- **Real:** someone you can message today has this problem. Bonus if it's the person from your day-13 boss.
- **Frequent:** it bites at least weekly, so people will come back.
- **Text-shaped:** the mess is notes, messages, emails, receipts, PDFs — exactly what AI is good at untangling.
- **Small:** you can describe the core in three user stories.

Ideas that fit the next two weeks well (they all need a list, an AI step, files and a "do this for me" action later):

- **Job-hunt tracker** — paste a job posting, AI pulls out company, role, salary, deadline; later ask "which of these fit my CV?"
- **Flat-share board** — who paid what, whose turn for the bins; photo of a receipt becomes a split.
- **Freelancer follow-ups** — paste a client email, get the task, budget and due date; never forget an invoice.
- **Plant or pet care log** — "watered the monstera, two yellow leaves" becomes a structured entry with reminders.
- **Book-club notes** — upload the chapter PDF, ask questions with page citations.

Our running example in these lessons is the job-hunt tracker. Yours should be *yours*.

A **user story** is one sentence: "As a ___, I want ___, so that ___." The **out of scope** list matters just as much:
it's where you park every shiny idea (payments, teams, a mobile app) so v1 actually ships.

## Step by step

### 1. Write the spec with your agent (25 min)

Your app lives in `~/66/apps/main-app`, the folder from day 14; today it becomes its own repo. Every apps lesson from
here on says "your repo" and means this folder:

```bash
mkdir -p ~/66/apps/main-app && cd ~/66/apps/main-app
```

Open your coding agent there (Claude Code or any other agent — Codex CLI, Gemini CLI, Cursor all work), and make it
interview you instead of guessing.

```text
Goal: help me write a one-page spec for a small web app. Do NOT write any code today.

Context: I'm a beginner building with a coding agent. The problem in my words:
<describe the annoyance in 3-5 sentences, who has it, how they deal with it now>

Process:
1. First ask me up to 8 short questions, one batch, to remove ambiguity. Wait for my answers.
2. Then write docs/SPEC.md with exactly these sections: Problem (3 lines), Who it's for (1 person, concrete),
   User stories (exactly 3, "As a... I want... so that..."), Main screen (what's on it), Data (the 1-2 things we store,
   with fields), The AI part (one sentence), Out of scope for v1 (at least 5 items), Done when (testable checklist).
3. Keep it under 400 words. Plain language, no buzzwords.

Before writing the file, show me the spec in chat and wait for my OK.
At the end, re-read docs/SPEC.md and tell me which line is still the most ambiguous.
```

Answer its questions honestly — "I don't know yet" is a valid answer and usually goes into *out of scope*. Push back
when a story sounds like two stories glued together.

> **Tip:** If the spec has more than one main screen, or the word "and" appears in a user story twice, cut.
> Small and shipped beats big and imagined.

### 2. Scaffold the project (25 min)

The recommended stack is **Vite + React + TypeScript + Tailwind**, deployed later to Cloudflare Workers like your day-11
backend (Vercel is fine too). Plain HTML + JS is possible if React feels like too much, but from day 29 the lessons assume React + Vite +
TypeScript — so pick React now unless you have a strong reason; the agent does the typing either way.

```text
Goal: scaffold the project for the app in docs/SPEC.md and make the first commit.

Constraints:
- Vite + React + TypeScript + Tailwind CSS (use the current official setup from the Vite and Tailwind docs).
- Keep it minimal: one page that shows the app name and the one-line problem from the spec. No backend yet.
- Create CLAUDE.md in this folder (and a copy named AGENTS.md for other agents) with: what the app is (2 lines, link to docs/SPEC.md),
  how to run it, and our working rules: "explain your plan before coding and wait for OK; small commits;
  after every change run the app and tell me exactly how you verified it".
- .gitignore must include node_modules, dist, .env and .dev.vars.
- This folder is its own git repository: run git init here if it isn't one yet.

Before you run anything, list the commands you plan to run and the files you will create, then wait for my OK.
When done: run the build, start the dev server, tell me the local URL, and show me `git status` and `git log --oneline`.
```

Open the URL, see your app's name in the browser. Then commit and put it on GitHub with `gh`, just like on day 2. The
folder stays `main-app`; the repo gets your app's real name (lowercase, dashes, e.g. `jobjar`):

```bash
git add -A
git commit -m "Scaffold app and add spec"
gh repo create jobjar --public --source=. --remote=origin --push
```

`--private` is fine too if you'd rather not show the code yet.

> **If you're stuck:** on Windows, if PowerShell refuses to run `npm`/`npx` scripts, fix the execution policy as on
> day 11. If `npm run dev` fails, paste the *whole* error into the agent with "Reproduce this, explain the
> cause in one sentence, then fix it". If Tailwind classes do nothing, the agent probably used an outdated setup —
> ask it to compare with the current Tailwind docs for Vite.

### 3. Reflect (5 min)

Write a few honest sentences: why this problem, and why *you* are the person to solve it. "I've lost three job
deadlines this month" is a great answer. So is "my flatmates and I argue about money and I'd like that to stop".

## You're done when…

- [ ] You read the scoping rules and picked a problem that passes all four filters.
- [ ] `docs/SPEC.md` exists with 3 user stories and an out-of-scope list — you pasted it as proof.
- [ ] The scaffold runs locally and is pushed — you pasted the GitHub repo link.
- [ ] You wrote why this problem, and why you.

**Tomorrow:** your main screen, phone-first — and how to make it not look like every other AI-generated app.
