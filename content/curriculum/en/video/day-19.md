---
day: 19
track: video
phase: 2
title: "Remotion, part 2: one template, many videos"
summary: "Turn your intro into a template that reads JSON, then render five different videos with one command."
estMinutes: 90
resources:
  - "https://www.remotion.dev/docs/"
  - "https://www.json.org/json-en.html"
tasks:
  - id: d19-video-t1
    type: read
    title: "Learn props, data and parametric video"
    xp: 10
    proof: none
  - id: d19-video-t2
    type: build
    title: "Build a JSON-driven template and render 5 variants"
    xp: 60
    proof: file
  - id: d19-video-t3
    type: build
    title: "Write a batch-render script and time each video"
    xp: 30
    proof: text
  - id: d19-video-t4
    type: quiz
    title: "Decide: props or hard-code?"
    xp: 15
    proof: none
---

Making one video is craft. Making fifty without losing a weekend is engineering. Today is the day your work stops
being "a video" and becomes "a machine that makes videos" — the idea the rest of this track is built on, all the way
to your own one-command pipeline on day 33.

## Props: the holes in your template

In React, **props** are the inputs a component receives. In Remotion, the same component can render a thousand
different videos if the parts that change — text, colours, numbers, images — come in as props instead of being typed
into the code.

- **Schema** — describe your props with `zod` (`z.object({ title: z.string(), accent: z.string() })`). Remotion Studio
  then shows a form where you can edit them live, and wrong data fails loudly instead of rendering garbage.
- **`defaultProps`** — the values used in Studio when nothing else is passed.
- **`--props`** — at render time, pass a JSON file: `npx remotion render Tip out/tip-1.mp4 --props=./data/tip-1.json`.
- **`calculateMetadata`** — optional: compute the duration from the props (a longer text gets a longer video).

The design question is always the same: *what changes between videos, and what must never change?* The first becomes
props; the second is your brand, and stays in code.

## Step 1 — the template and its data

Today's example: a series of 8-second "tiny habit" tips for your build log — the same layout every time, different
words and colours. Use your own subject if you have one (product tips, study facts, recipe steps).

```text
Goal: a parametric Remotion composition driven by JSON, plus 5 data files.
Context: Remotion project in remotion/, with my Intro composition from yesterday (reuse its font and brand colours).
Constraints:
- New composition "Tip", 1080x1920, 30 fps, 240 frames. Props schema with zod:
  { number: int, title: string (max 40 chars), body: string (max 120 chars), accent: hex colour string }.
- Pass the schema and sensible defaultProps to <Composition>, so Studio shows editable fields.
- Layout: big number top-left in the accent colour, title springs in at frame 10, body fades in word groups from
  frame 30, a progress bar along the bottom fills over the full duration.
- If the body is longer than 80 characters, use calculateMetadata to make the video 300 frames instead of 240.
- Create remotion/data/tips.json: an array of 5 tip objects with real, useful content (no filler text).
  Also write data/tip-1.json ... tip-5.json (one object each) for single renders from the CLI.
Done when: I can edit props in Studio, and
`npx remotion render Tip out/tip-1.mp4 --props=./data/tip-1.json` renders a single tip.
```

Read the five tips the agent wrote and rewrite any that sound generic — your name is on them. Open Studio, change the accent in the form, watch it update. Then render one:

```bash
cd remotion
npx remotion render Tip out/tip-1.mp4 --props=./data/tip-1.json
ffprobe -v error -show_entries stream=width,height,nb_frames -show_entries format=duration -of default=noprint_wrappers=1 out/tip-1.mp4
```

Expect 1080×1920 and 8 s (or 10 s for a long tip). Upload one variant and paste your `tips.json` in the note.

> **If you're stuck:** a zod error at render time is a gift — it names the exact field that's wrong. Read it before
> asking the agent. If Studio shows no form, check that `schema` is passed to `<Composition>` and that `zod` is the
> version Remotion's docs ask for.

## Step 2 — render all five with one command

Calling the CLI five times works, but it re-bundles your project every time. The renderer API bundles once:

```text
Goal: a batch-render script for the Tip template.
Context: remotion/data/tips.json holds an array of tip props.
Constraints:
- remotion/scripts/render-all.mjs using @remotion/bundler (bundle once) and @remotion/renderer
  (selectComposition + renderMedia, codec h264) for every item.
- Output out/tips/tip-<number>.mp4. Skip a file if it already exists unless I pass --force.
- Print for each video: file name, frames, seconds taken. At the end: total time and average per video.
- Add an npm script "render:tips".
Done when: `npm run render:tips` renders 5 files and prints the timing table.
```

```bash
npm run render:tips
for f in out/tips/*.mp4; do echo "$f $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"; done
```

Paste the timing table as proof. Look at the average: that number times 100 is how long a hundred videos would take on
your laptop. Remember it — on day 40 you'll decide where rendering should run.

> **Tip:** run it a second time. Every file gets skipped in a second. Skipping work that's already done is the
> first rule of every pipeline you'll build.

## Quiz

For each, props or hard-code?

1. The headline text of each video.
2. The frame rate.
3. Your logo and brand font.
4. The background colour, if every episode of a series has its own colour.

<details><summary>Answers</summary>

1. Props — it changes every video.
2. Hard-code — mixing frame rates across a series causes timing bugs and gains you nothing.
3. Hard-code (or a brand config, day 32) — the point of a brand is that it doesn't change per video.
4. Props — if it really varies per episode, it's data. If it's always one of three colours, pass a name ("blue")
   rather than any hex, so nobody can break the palette.

</details>

## You're done when…

- [ ] You can name what's a prop and what's brand in your template.
- [ ] One variant is uploaded and `tips.json` with 5 real entries is pasted.
- [ ] `npm run render:tips` renders all five; the timing table is pasted.
- [ ] Quiz done.

**Tomorrow:** your videos are silent. Time to fix that — properly, at the right loudness.
