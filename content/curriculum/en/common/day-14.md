---
day: 14
track: common
phase: 1
title: "Phase 1 done: audit your habit"
summary: "Look at how you actually worked, set up a clean workshop for your track, and write a letter to day-66 you."
estMinutes: 40
rest: true
badges: [phase-1]
resources:
  - "https://www.youtube.com/watch?v=LCEmiRjPEtQ"
  - "https://code.claude.com/docs/en/overview"
  - "https://git-scm.com/book/en/v2"
tasks:
  - id: d14-t1
    type: reflect
    title: "Audit when, where and how long you actually worked"
    xp: 20
    proof: text
  - id: d14-t2
    type: build
    title: "Set up your phase-2 workspace and paste its structure"
    xp: 20
    proof: text
  - id: d14-t3
    type: reflect
    title: "Write a letter to yourself on day 66"
    xp: 15
    proof: text
---

Two weeks. You shipped to a real person yesterday. Today is light on purpose: no new tech, just a look in the mirror
and a tidy desk before phase 2.

## 1. The habit audit (15 min)

Scroll back through the last 13 days and answer honestly:

- **When** did you work? Same time each day, or whenever it fit?
- **Where?** Which place made it easy to start?
- **How long**, really? More or less than the plan?
- Which day nearly broke the streak, and what saved it?

Then write one rule that protects the streak for the next 52 days, as an if-then: "If it's 9 p.m. and I haven't
started, I do 20 minutes anyway." Habits survive on small promises, not heroic ones.

**Proof:** your answers plus the rule.

## 2. Your phase-2 workshop (15 min)

From now on everything lives under one folder, `~/66`. Your earlier projects stay where they are — they're already
safe on GitHub. Create the folder and start the agent there:

```bash
cd ~
mkdir 66
cd 66
claude
```

```text
Goal: set up a tidy workspace for phase 2 of my learning, track: <apps | video>.

Apps: folder ~/66/apps with main-app/ (empty for now — day 15 fills it), sandbox/ for experiments, notes/prompts.md for prompts that worked, and a CLAUDE.md describing my stack (Cloudflare Workers, my AI provider, mobile-first, never commit secrets).
Video: folder ~/66/video with assets/fonts, assets/music, assets/images, projects/, renders/, snippets/ (copy my title-card project from ~/title-card here, without its .venv and frames), notes/prompts.md, a CLAUDE.md (Python + Pillow + ffmpeg, 1080x1920 default, yuv420p) and a
.gitignore that ignores renders/, frames/ and .venv/.

Done when: the folders exist and you print the structure two levels deep. Video: git init in ~/66/video with a first commit. Apps: no repo at the top of ~/66/apps — main-app gets its own repo on day 15.
```

**Proof:** paste the printed structure.

## 3. A letter to day-66 you (10 min)

Write to the person who'll open this in seven weeks. What are you scared of? What do you hope they've built? What
should they remember about how today felt? Keep a copy somewhere private — you'll read it on graduation day.

**Proof:** paste the letter — or just its first line, if you’d rather keep the rest to yourself.

## You're done when…

- [ ] Your audit and your if-then rule are written.
- [ ] Your phase-2 workspace exists and its structure is pasted.
- [ ] Your letter to day-66 you is saved.

**Tomorrow:** phase 2 begins — the real craft of your track.
