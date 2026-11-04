---
day: 18
track: video
phase: 2
title: "Remotion, part 1: video as React"
summary: "Spin up a Remotion project, render your first composition, and ship a 10-second branded intro you'll reuse for weeks."
estMinutes: 120
resources:
  - "https://www.remotion.dev/docs/"
  - "https://react.dev/learn"
  - "https://nodejs.org/en/learn"
tasks:
  - id: d18-video-t1
    type: read
    title: "Learn compositions, frames, interpolate and spring"
    xp: 10
    proof: none
  - id: d18-video-t2
    type: build
    title: "Create a Remotion project and render the starter"
    xp: 40
    proof: text
  - id: d18-video-t3
    type: build
    title: "Render a 10-second branded intro"
    xp: 50
    proof: file
  - id: d18-video-t4
    type: quiz
    title: "Do the frame math in Remotion"
    xp: 15
    proof: none
---

For three days you've written `for frame in range(150)` and drawn every pixel yourself. That's the best way to
understand video — and a slow way to make a lot of it. **Remotion** lets you describe each frame as a React component:
layout with CSS, fonts from Google Fonts, images, even charts. It then opens a headless browser, screenshots every
frame and hands them to ffmpeg. Exactly what you did by hand, at scale.

## The four ideas you need

- **Composition** — a video definition: an id, a component, `width`, `height`, `fps`, `durationInFrames`. It lives
  in `src/Root.tsx`. One project can hold many compositions.
- **`useCurrentFrame()`** — inside a component, returns the frame being drawn. Your whole animation is a function of
  this number, just like your Python scripts.
- **`interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" })`** — day 16's progress → value recipe in
  one call. Add `easing: Easing.out(Easing.cubic)` and you have day 16 in a single line.
- **`spring({ frame, fps, config: { damping: 200 } })`** — a physics-based 0 → 1 that settles naturally. Less damping =
  more bounce. Great for logos and pop-ins.

Plus `<Sequence from={60}>`: everything inside starts at frame 60, and `useCurrentFrame()` *inside* it counts from 0
again. That's how you build a timeline from small reusable parts.

> **Important:** Remotion is free for individuals and small companies, but larger companies need a paid licence.
> Read remotion.dev/license before you use it for client work — the rules are short and clear.

## Step 1 — create the project and render the starter

In your workshop (`~/66/video`):

```bash
npx create-video@latest remotion
```

Pick the **Hello World** template (TypeScript) and let it install. Then:

```bash
cd remotion
npm run dev
```

The **Remotion Studio** opens in your browser: a timeline, a frame scrubber, your compositions on the left. Drag the
scrubber — every position is a frame being rendered live by React. Now render it for real and time it:

```bash
time npx remotion render HelloWorld out/hello.mp4
```

On Windows PowerShell use `Measure-Command { npx remotion render HelloWorld out/hello.mp4 }`. The first render
downloads a headless browser, so it's slower; run it twice and note the second time. Paste the command and both
times as proof. Check the file:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames -of default=noprint_wrappers=1 out/hello.mp4
```

> **If you're stuck:** "Could not find composition" means the id in the command doesn't match the `id` in
> `src/Root.tsx` — run `npx remotion compositions` to list them. If Studio won't start, check `node -v` is 18 or
> newer, and paste the full error to your agent.

## Step 2 — your 10-second branded intro

Decide your brand in 2 minutes: a name (your build-log name), two colours (background + accent green or your own),
one Google Font. Write them down — they'll become your brand config on day 32. Then:

```text
Goal: a 10-second branded intro as a new Remotion composition.
Context: Remotion project in remotion/ (Hello World template). My brand: name "<your name>", background <#hex>,
accent <#hex>, font <Google Font name>, tagline "<one short line>".
Constraints:
- New composition id "Intro": 1920x1080, 30 fps, 300 frames. Component in src/Intro.tsx, registered in Root.tsx.
- Load the font with @remotion/google-fonts (install it). No external images.
- Timeline using <Sequence>: 0-40 an accent shape draws in (spring, damping 200); 20-70 the name appears letter
  by letter with interpolate + Easing.out(Easing.cubic); 70-110 the tagline fades and slides up; hold until 260;
  260-300 everything scales down slightly and fades to the background colour.
- Put timing numbers in one const at the top so I can tweak them.
- Keep text inside a 10% safe margin on every side.
Done when: `npx remotion render Intro out/intro.mp4` produces a 10-second video with no console errors.
```

Scrub through it in Studio before rendering. Anything feel off? Change one timing number, look again. When happy:

```bash
npx remotion render Intro out/intro.mp4
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 out/intro.mp4
```

Duration should be `10.000000` (or a few milliseconds off). Upload `intro.mp4`. Commit the project (the agent will already have a `.gitignore`
that skips `node_modules` and `out/`).

> **Tip:** ask the agent "explain Intro.tsx to me line by line, like I know Python but not React". Ten minutes of
> reading now saves an hour tomorrow.

## Quiz

1. You want a 10-second composition at 30 fps. What's `durationInFrames`?
2. `interpolate(frame, [0, 20], [0, 100])` — what does it return at frame 5?
3. A component sits inside `<Sequence from={90}>`. The global frame is 120. What does `useCurrentFrame()` return
   inside it?
4. A composition is 1080×1920, 60 fps, 450 frames. How long is it, and what shape?

<details><summary>Answers</summary>

1. 300.
2. 25 — a quarter of the way through the range gives a quarter of the values.
3. 30 — frames inside a Sequence count from its start.
4. 7.5 seconds, vertical 9:16.

</details>

## You're done when…

- [ ] You can say what a composition, `useCurrentFrame`, `interpolate` and `spring` each do.
- [ ] The starter rendered; you pasted the command and the render times.
- [ ] `intro.mp4` (10 s, your brand) is uploaded, and the project is committed.
- [ ] Quiz done.

**Tomorrow:** one template, many videos — your intro learns to take data.
