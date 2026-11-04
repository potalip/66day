---
day: 4
track: common
phase: 1
title: "Prompting a coding agent like a pro"
summary: "Learn the four-part prompt, give your project a memory file, and watch a vague request lose to a clear spec."
estMinutes: 75
resources:
  - "https://www.youtube.com/watch?v=6eBSHbLKuN0"
  - "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview"
  - "https://code.claude.com/docs/en/overview"
  - "https://code.claude.com/docs/en/best-practices"
tasks:
  - id: d04-t1
    type: read
    title: "Learn the anatomy of a good agent prompt"
    xp: 10
    proof: none
  - id: d04-t2
    type: build
    title: "Write a project memory file (CLAUDE.md or AGENTS.md)"
    xp: 40
    proof: text
  - id: d04-t3
    type: build
    title: "Build the same feature twice: vague prompt vs spec prompt"
    xp: 40
    proof: link
  - id: d04-t4
    type: reflect
    title: "Compare the two results and name what changed"
    xp: 15
    proof: text
---

An agent is only as good as the instructions it gets. The difference between "it made a mess" and "wow, exactly
that" is rarely the model — it's the prompt. Today you learn the shape of a prompt that works and give your promise
page a memory, so you never have to explain the project twice.

## Anatomy of a good agent prompt

You've already used it on days 1–3. Here it is, named:

1. **Goal** — the outcome, in one sentence. "Add a day counter", not "improve the page".
2. **Context** — what the agent can't guess: who it's for, what exists, what you tried, your skill level.
3. **Constraints** — the fences: files to touch or not, no new libraries, mobile first, tone, what to leave alone.
4. **Done when** — how you'll both know it worked: a check you can actually see or run.

Two power moves on top. **"Ask me up to three questions before you start"** — great when you're unsure what you
want. **"Plan first, wait for my OK"** — great for anything bigger than a few lines.

Think of briefing a builder for a kitchen. "Make it nicer" gets you whatever they like. "White cabinets, keep the
old sink, done by Friday, I'll check the drawers close" gets you your kitchen.

## Step 1 — Give the project a memory (20 min)

Every session starts with an agent that remembers nothing. A **project memory file** fixes that: a short Markdown
file in the project folder that the agent reads at the start of every session. Claude Code reads `CLAUDE.md`; most
other agents (Codex, Cursor, Gemini CLI and more) read `AGENTS.md`. Using several agents? Keep the rules in
`AGENTS.md` and make `CLAUDE.md` a single line: `@AGENTS.md`.

In Claude Code, `/init` drafts one from your files. Either way, it should look roughly like this, in your own words:

```markdown
# 66-day promise page

My personal page for a 66-day challenge, live on GitHub Pages.

## About me
Beginner. Explain new terms in one sentence. Ask before big changes.

## Stack
One index.html with CSS and JS inside. No frameworks, no build step, no external images.

## Design
Calm, lots of white space, one green accent, system fonts. Works at 390px wide.
Light and dark mode. Never add pop-ups or animations that move text around.

## Workflow
After each change: open the page, check it on a narrow window, then commit with a
clear message and push to main.
```

Commit and push it (ask the agent). Keep it short — it's a briefing card, not a novel.

**Proof:** paste your memory file.

## Step 2 — The same feature, twice (30 min)

The feature: a "Day N of 66" counter that fills the matching squares in your grid.

**Round 1 — vague.** Start a fresh session (`/clear` in Claude Code, or quit and restart) and send exactly:

```text
add a progress counter
```

Look at the page. Then: `commit this as "vague prompt version" and push`.

**Round 2 — spec.** Fresh session again, then:

```text
Goal: replace the progress counter from the last commit with a proper "Day N of 66"
counter.

Context: the start date is already on the page. Today should count as the day it
really is in my local time zone.

Constraints:
- N = days since the start date + 1. Before the start date show "Day 1";
  after day 66 show "66 of 66 — done!".
- Fill the first N squares of the existing grid with the accent color.
- Put the counter right under the headline, big and calm. No animation.
- Keep everything in index.html. Don't change any other section.

Done when: you've checked the logic for three example dates (start day, day 10, day 70)
and told me the results, the page looks right at 390px and 1280px wide, and the change
is committed as "spec prompt version" and pushed. Print the GitHub link to that commit.
```

> **If you're stuck:** the agent wanders off and rewrites half the page? Press Esc to stop it, then say "undo
> what you just did and only change the counter". If it insists something works but you can't see it, ask it to
> explain where on the page to look.

**Proof:** the commit link, e.g. `https://github.com/mira-builds/66-day-promise/commit/3f9c2a1`. Open it on GitHub —
red lines were removed, green lines added.

## Step 3 — Compare (10 min)

Open both commits side by side. In 3–5 sentences: what did the vague version guess wrong? What did the spec
prevent? Which part of the spec mattered most? There's no right answer; noticing is the skill.

## You're done when…

- [ ] You can name the four parts of a prompt without looking.
- [ ] You pasted your CLAUDE.md or AGENTS.md, and it's pushed.
- [ ] You pasted the commit link of the spec version.
- [ ] You wrote what changed between the two results.

**Tomorrow:** you open the hood and read the code your agent wrote — then change some of it yourself.
