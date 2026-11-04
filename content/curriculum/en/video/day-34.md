---
day: 34
track: video
phase: 2
title: "Pipeline v2: three formats and a thumbnail, automatically"
summary: "One run now delivers 16:9, 9:16 and 1:1 versions that are laid out, not just cropped — plus three thumbnail options."
estMinutes: 90
resources:
  - "https://www.remotion.dev/docs/"
  - "https://trac.ffmpeg.org/wiki"
  - "https://developers.google.com/youtube/v3"
tasks:
  - id: d34-video-t1
    type: read
    title: "Learn the idea of one master, many deliverables"
    xp: 10
    proof: none
  - id: d34-video-t2
    type: build
    title: "Render the same video in 3 aspect ratios automatically; upload one"
    xp: 50
    proof: file
  - id: d34-video-t3
    type: build
    title: "Build an auto-thumbnail generator; upload 3 thumbnails"
    xp: 30
    proof: file
  - id: d34-video-t4
    type: quiz
    title: "Quiz: reframing rules"
    xp: 15
    proof: none
---

Your pipeline makes one video. The internet wants four: a 16:9 for YouTube, a 9:16 for Shorts, TikTok and Reels, a
1:1 for feeds and LinkedIn-style posts, and a thumbnail that earns the click. Doing that by hand is an afternoon per
video. Doing it in code is a flag. Today you add the flag.

## One master, many deliverables

There are two ways to get a vertical version of a horizontal video:

- **Reframe (crop).** Cut a 9:16 window out of the 16:9 frame. Fast, works on any footage, but you lose 68% of the
  picture. Text near the edges gets chopped, and a centre crop often slices the subject in half.
- **Re-layout.** Render the scene again at the new size, letting each component arrange itself for it. Title goes from
  one line to three, a chart stacks its legend below, the lower third moves up out of the app buttons.

Here's your unfair advantage: most of your visuals are *code*, so they can be re-laid out. Only footage (AI clips, screen
recordings) needs cropping — and there you crop smartly, with a **focus point** per scene (`focus_x: 0.3` = "the
interesting part is a third from the left") instead of always the centre.

Rules that change per format:

- **Safe zones.** In vertical apps, the bottom ~20% and a strip on the right are covered by captions, buttons and the
  channel name. Keep text and faces out of there.
- **Type scales with the short side.** The short side is 1080 px in both 1920×1080 and 1080×1920, so a title sized
  from `min(width, height)` keeps its size — but it now has only 1080 px of *width*, so it must wrap. Size from the short
  side and always let text wrap.
- **Captions move.** Lower-centre for 16:9; about 60–70% down for 9:16, above the UI.

**Thumbnails** are their own little craft. YouTube recommends 1280×720 (16:9), under 2 MB. The rules: one focal subject,
3–4 words maximum (not your title repeated), strong contrast, and readable at the size it's actually seen — about 160
pixels wide in a phone feed.

## Step by step

### 1. Aspect ratios as a flag

```text
Goal: make-video renders the same storyboard as 16:9 (1920x1080), 9:16 (1080x1920) and 1:1 (1080x1080) with --formats 16:9,9:16,1:1. Outputs: runs/<slug>/final-16x9.mp4, final-9x16.mp4, final-1x1.mp4.
Context: my pipeline from day 33 and my brand components from day 32. Read both first.
Constraints:
- Code-made scenes are re-rendered at each size (no cropping). Components size type from min(width, height), wrap text, and respect a per-format safe zone defined in brand.json (vertical: keep bottom 20% and right 12% clear).
- Footage scenes (AI clips, recordings) are cropped using an optional focus_x/focus_y per scene from the storyboard (default 0.5). Use ffmpeg crop; never stretch.
- Captions position per format from brand.json.
- Voice, captions text and music stages are shared across formats — cached once, not redone three times.
- Make a contact sheet: one frame from each format side by side at the same scene, out/formats.png.
Done when: one command produces all three mp4s and formats.png, and the second run only re-renders what changed.
```

The crop for a footage scene looks like this — notice the focus point in the `x` expression:

```bash
ffmpeg -i clip.mp4 -vf "crop=ih*9/16:ih:(iw-ow)*0.30:0,scale=1080:1920" clip-9x16.mp4
```

Open `formats.png`. For each format ask: is any text cut off? Does anything sit under where the like button will be? Is
the subject in frame? Fix with config and focus points. Upload one variant — the vertical is usually the most
interesting.

> **If you're stuck:** if text overflows in 9:16, the component sizes type from width or height instead of the short side,
> or doesn't wrap. Ask the agent to draw the safe-zone rectangles on a debug render (`--debug-safe`) so you can see the
> problem instead of guessing.

### 2. A thumbnail generator

```text
Goal: a thumbnails stage that writes 3 options to runs/<slug>/thumbs/thumb-1.jpg…thumb-3.jpg (1280x720, < 2 MB).
Steps:
- Candidate frames: pick 6 frames from final-16x9.mp4 (use ffmpeg's thumbnail filter or scene-change detection) plus the storyboard's most visual scene. Score by sharpness and contrast, keep the best 3.
- Text: ask the LLM for 5 thumbnail texts (max 4 words, must NOT repeat the title, must create curiosity). Use the top 3. If no API key, use the storyboard's on_screen_text of scene 1.
- Compose with my brand kit: big display font, accent colour on one word, dark scrim behind text for contrast, logo small.
- Also write thumbs/preview.png: all three at 160 px wide, side by side, to judge them at feed size.
Done when: the stage runs as part of make-video and preview.png shows three distinct, readable options.
```

Judge them at feed size, not full size. Upload the three thumbnails.

> **Tip:** a thumbnail is a promise; the first 3 seconds are the delivery. If the thumbnail shows a cat mid-air and the
> video opens on a title card, people leave. Pick the frame your hook actually opens on.

## Quiz

1. Your 16:9 scene has a chart on the left and text on the right. What happens with a centre crop to 9:16?
2. Where should captions sit in a vertical short, and why?
3. A subject stands at the right third of an AI clip. What `focus_x` would you set?
4. Why share voice and captions across the three formats instead of rendering them per format?

> **Answers:**
>
> 1. You get half of the chart and half of the text — neither readable. Re-layout instead: stack chart above text.
> 2. About 60–70% down the frame, above the platform's captions and buttons that cover the bottom.
> 3. About 0.67 (or a bit more), so the crop window slides right.
> 4. They don't depend on the frame size. Caching them once saves time and API money and keeps all versions identical.

## You're done when…

- [ ] You can explain reframing vs re-layout and where safe zones are.
- [ ] One command renders 16:9, 9:16 and 1:1; one variant is uploaded.
- [ ] Three auto-generated thumbnails are uploaded, checked at feed size.
- [ ] Quiz done.

**Tomorrow:** rest. After that, your videos meet the platforms — uploaded by code.
