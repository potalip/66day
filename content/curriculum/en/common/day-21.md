---
day: 21
track: common
phase: 2
title: "Three weeks in: the habit is forming"
summary: "Count what three weeks of building added up to, then show your favourite piece to people who will cheer."
estMinutes: 30
rest: true
resources:
  - "https://news.ycombinator.com/showhn.html"
tasks:
  - id: d21-t1
    type: reflect
    title: "Name your best build so far and what you'd redo"
    xp: 20
    proof: text
  - id: d21-t2
    type: share
    title: "Post a show-and-tell of your best build"
    xp: 20
    proof: link
---

Three weeks. Around now something quiet happens: opening the terminal stops being a decision and starts being a
thing you just do, like putting the kettle on. Today is short on purpose. No new tools — just a look at the pile
you've built.

## Today's ritual: count your saves

Open a terminal in your main project folder (apps: your main app's repo; video: your project folder) and run:

```bash
git log --oneline | wc -l
```

On Windows PowerShell: `(git log --oneline).Count`.

That number is how many times you decided something was worth keeping. Write it down — you'll want
it on day 66. Now read your five oldest commit messages and enjoy how unsure they sound:

```bash
git log --reverse --oneline | head -5
```

In PowerShell, swap `head -5` for `Select-Object -First 5`.

## 1. Best build, honest redo (15 min)

Pick the one thing from days 1–20 you're proudest of. Apps people: the main screen you iterated from screenshots, or
the Telegram bot that answered a friend at 2 a.m. Video people: the eased title card, the word-by-word quote, the
Remotion intro with a mix that finally sat at −14 LUFS. Write three lines:

- What it is and who it's for.
- The moment it surprised you, good or bad.
- One thing you'd redo knowing what you know now, and why.

The redo line matters most. Being able to see what you'd change means your taste has outgrown your skills — which is
exactly the right order. Skills catch up; taste is the hard part.

## 2. Show-and-tell (15 min)

Post it where people cheer rather than judge: your build log from day 12, X or Threads, a Discord you're in, the
FlowLeaf community. Keep it this simple:

```text
3 weeks of building with an AI coding agent, about an hour a day.
My favourite piece so far: a tiny bot that turns my grocery voice notes into a list.
What surprised me: the hardest part was deciding what NOT to build.
What I'd redo: I'd write the spec before the first prompt, not after the third.
```

> **Tip:** a 10-second screen recording or GIF gets far more replies than a bare link. Your phone's built-in screen
> recorder is enough.

## You're done when…

- [ ] You pasted three lines: your best build, the surprise and the redo.
- [ ] You pasted the link to your show-and-tell post.

Tomorrow: apps meet many models at once; video gets a voice.
