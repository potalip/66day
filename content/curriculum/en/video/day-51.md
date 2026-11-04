---
day: 51
track: video
phase: 3
title: "Capstone build 1: the first full output"
summary: "Lock the format and produce your capstone's first complete output, end to end, through the pipeline."
estMinutes: 120
resources:
  - "https://www.remotion.dev/docs/"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d51-video-t1
    type: build
    title: "Produce the first full output of your capstone"
    xp: 80
    proof: file
  - id: d51-video-t2
    type: build
    title: "Write a build log: done, next, blocked"
    xp: 20
    proof: text
  - id: d51-video-t3
    type: reflect
    title: "Name what you cut, and why"
    xp: 15
    proof: text
---

Specs are cheap; the first full output is where the capstone becomes real. Today's goal is not a masterpiece. It's
*one complete thing* in the final format: episode 1 of the series, the tool producing its first video for a real
input, or the first finished reel piece. Ugly bits are allowed. Missing bits are not.

## Format first, then output

The trap on build day 1 is polishing scene 1 for two hours while scenes 2–6 don't exist. Professionals do the
opposite: a **rough cut of everything**, then improve. So before you render, freeze the format in one file the
pipeline reads:

- length and structure (hook, 3 beats, payoff, end card, with seconds per part)
- aspect ratios and platforms
- the template and brand config it uses
- the voice, caption style and music rules
- the QC spec from day 47

Every later output will be judged against this file, so changes go there, not into one-off fixes.

## Step by step

### 1. Lock the format and run it end to end

```text
Goal: the first full output of my capstone (see CAPSTONE.md), made by my pipeline, in the final format.
Steps:
1. Create formats/<capstone>.json from CAPSTONE.md: structure with seconds per part, aspect ratios, template, brand config, voice, caption style, music rules, QC spec. Validate it with a schema.
2. Make my pipeline accept --format formats/<capstone>.json and use it for every stage.
3. Run the whole pipeline for output #1 (topic/input: <...>). Do not hand-edit the render; if something is wrong, fix the stage or the format file and re-run.
4. Run the QC stage (qc.py from day 47) on the result; its report lands next to the video.
5. Log every manual intervention I make (what, which stage, minutes) to runs/<capstone>/01/manual.log.
Done when: runs/<capstone>/01/ has the mp4 (all formats in the spec), the QC report and manual.log.
```

Everything lands in the same `runs/` folder your pipeline has used since day 33, one subfolder per output.

For a **tool** capstone, "output #1" is the tool producing a video from a real user's input, through its real
interface (form, bot or CLI), not from your test fixture. For a **showreel**, it's the first piece finished at client
level, delivered in all the formats you promised.

> **If you're stuck** with a stage that keeps failing: stub it. A plain title card instead of the AI clip, stock voice
> instead of the cloned one. Get to a complete render, then go back. A finished rough cut tells you more than a
> perfect half.

> **Tip:** watch the output on your phone, at the size people will see it. Half of tomorrow's fixes will come from that
> one viewing.

Upload the mp4 (the main format) as proof.

### 2. Build log

Short and honest, in three headings. Post it in your build log or paste it here:

```text
Done: episode 1 rendered in 9:16 and 16:9, QC passes except one caption cps warning.
Next: fix caption line breaks; script for episodes 2-3; time each stage.
Blocked: AI clip provider returns 429 in bursts. Plan: add retry with backoff, cache by prompt hash.
```

### 3. What did you cut?

You cut things today, on purpose or by running out of time. Name each one and decide: *gone for good*, *back on
day 53* (craft pass), or *after launch*. Cutting is a skill, and writing down why is what turns it from panic into
judgement.

## You're done when…

- [ ] A format file exists and the pipeline reads it.
- [ ] The first full output is rendered by the pipeline, QC'd and uploaded.
- [ ] A done / next / blocked build log is pasted.
- [ ] Every cut has a verdict: gone, day 53, or after launch.

Tomorrow: outputs 2 and 3, and the honest numbers on time and money per video.
