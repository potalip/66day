---
day: 3
track: video
phase: 1
title: "Boss: your first video made with code"
summary: "Have the agent write a script that renders a 10-second animated title card of your name."
estMinutes: 90
boss: true
resources:
  - https://ffmpeg.org/download.html
tasks:
  - id: d03-video-t1
    type: build
    title: "Get the agent to render a 10-second title card as an MP4"
    xp: 40
    proof: file
  - id: d03-video-t2
    type: build
    title: "Change one thing on purpose: color, timing or font"
    xp: 30
    proof: text
  - id: d03-video-t3
    type: ship
    title: "Post it as a short and paste the link"
    xp: 60
    proof: link
---

## Video is just pictures and time

A video is a sequence of frames. If code can draw one picture, code can draw 300 of them and stitch them together.
That's the whole idea behind programmatic video — and behind our own Studio.

Today you'll make the smallest possible version: **your name, animated, 10 seconds, rendered by code you didn't type.**

## Prompt

```
I want to render a 10-second vertical video (1080x1920, 30 fps) with code.
Show my name "[your name]" fading in and sliding up slightly, on a calm dark-green background.
Use Python with Pillow to draw frames and ffmpeg to encode an MP4.
Check that ffmpeg is installed first and tell me how to install it if not.
Explain each step in one sentence.
```

If something fails, paste the error back to the agent. Errors are not a sign you're bad at this — they're the conversation.

## Make it yours

Change **one** thing on purpose: the easing, the color, a second line of text. Re-render. Compare the two versions.

> **Tip:** Keep every render in a `renders/` folder with a number. Watching your v1 next to your v12 in a month is the best motivation there is.

## You're done when…

- you have an MP4 you rendered yourself;
- you changed one thing deliberately and can say what it did;
- it's posted somewhere public (YouTube Shorts, TikTok, X — your call).
