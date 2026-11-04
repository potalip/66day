---
day: 42
track: common
phase: 3
title: "Six weeks in: lift someone up"
summary: "Spend 15 minutes unsticking someone newer than you — and find out how much you actually know."
estMinutes: 30
rest: true
badges: [helper]
resources:
  - "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started"
  - "https://learngitbranching.js.org/"
tasks:
  - id: d42-t1
    type: share
    title: "Help one beginner for 15 minutes: answer, review, or pair"
    xp: 30
    proof: text
  - id: d42-t2
    type: reflect
    title: "Write what explaining taught you"
    xp: 15
    proof: text
---

Yesterday you delivered work to a real client. Six weeks ago you'd never opened a terminal. Somewhere between those
two points you became the person a beginner wishes they could ask. Today you let one of them ask.

## Where to find someone

Anyone a few steps behind you counts:

- A newer FlowLeaf learner stuck on days 1–14 — the community is full of them.
- The friend who said "I wish I could do that" when you showed your day-27 boss.
- A question on r/learnprogramming, a Discord help channel, or an ffmpeg question nobody answered.

## Today's ritual: three questions before any answer

Before you explain anything, ask:

1. What did you expect to happen?
2. What happened instead? (Show me the exact error or the frame that looks wrong.)
3. What have you already tried?

Half the time, the person solves it while answering question 2. That's not luck — it's the debugging loop from
day 10, and now you're the one teaching it.

## 1. Fifteen minutes of help (20 min)

Pick one format:

- **Answer** a question in writing. Apps: why their page shows "undefined", why Git refuses to push. Video: why
  ffmpeg says "height not divisible by 2", why the audio drifts out of sync.
- **Review** a beginner's repo or video: two things that work, one thing to try next. Be specific and kind.
- **Pair** for 15 minutes on a call: they drive, you navigate. Keep your hands off their keyboard.

Not sure? Ask your own agent first, then explain it *in your own words*:

```text
A beginner sent me this error: (paste it). Explain the most likely cause in plain words,
then give me one question I should ask them to confirm it. Don't write the fix — I want
to guide them to it.
```

> **Important:** never ask for someone's API key or password. If they paste a key into a chat, tell them kindly to
> revoke it and make a new one — today.

## 2. What did explaining teach you? (10 min)

Write a few lines: what did you understand better *after* explaining it? Where did you realise you didn't know
something you thought you knew? Teaching is the fastest way to find the holes in your own map.

## You're done when…

- [ ] You pasted what you helped with: the format, the problem, how it ended (no names needed).
- [ ] You pasted what explaining taught you.
