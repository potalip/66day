---
day: 16
track: video
phase: 2
title: "Motion graphics in Python: easing is everything"
summary: "Make a 5-second title card that moves like a pro made it — and see why easing, not effects, does the work."
estMinutes: 90
resources:
  - "https://pycairo.readthedocs.io/"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d16-video-t1
    type: read
    title: "Learn timelines, keyframes and easing"
    xp: 10
    proof: none
  - id: d16-video-t2
    type: build
    title: "Render a 5-second title card with eased motion"
    xp: 50
    proof: file
  - id: d16-video-t3
    type: build
    title: "Show the same motion with 3 easing curves side by side"
    xp: 30
    proof: file
  - id: d16-video-t4
    type: quiz
    title: "Name the curve from the motion"
    xp: 15
    proof: none
---

Yesterday's circle slid across the screen at a perfectly constant speed. Nothing in the real world moves like that —
a thrown phone, a closing door, a cat jumping on a table all speed up and slow down. Your eye notices the difference
in a fraction of a second, even if you can't name it. Today you learn to name it, and to code it.

## Keyframes, progress, easing

Animators think in **keyframes**: "at frame 0 the title is below the screen; at frame 30 it's in the middle." Everything
in between is computed. The recipe your code will use for every animation from now on:

1. **Progress**: `t = (frame - start) / (end - start)`, clamped to 0…1. At the start t = 0, at the end t = 1.
2. **Easing**: `e = ease(t)` — a function that bends the timing while still going from 0 to 1.
3. **Value**: `value = from + (to - from) * e`.

Same start, same end, same duration — completely different feeling, depending only on step 2:

| Curve | Formula | Feels like |
|---|---|---|
| linear | `t` | a robot, a conveyor belt |
| ease-out cubic | `1 - (1 - t)**3` | arriving: fast in, gentle landing — the workhorse for entrances |
| ease-in-out cubic | `4*t**3 if t < 0.5 else 1 - (-2*t + 2)**3 / 2` | a camera move: slow start, slow stop |
| ease-out back | `1 + 2.70158*(t-1)**3 + 1.70158*(t-1)**2` | playful overshoot, then settle |

Rules of thumb: things **entering** use ease-out (they arrive and brake). Things **leaving** use ease-in (they gather
speed and go). Things moving **across** the screen use ease-in-out. Linear is for spinning loaders and scrolling
credits — almost nothing else.

Today we draw with **pycairo**, a Python binding to the Cairo vector library: smooth anti-aliased shapes and text,
and it can hand raw pixels straight to ffmpeg, so you don't need thousands of PNG files on disk.

```bash
# in ~/66/video with the venv active (day 15)
pip install pycairo
python -c "import cairo; print(cairo.version)"
```

> **If you're stuck:** on macOS, if pip tries to compile and fails, run `brew install cairo pkg-config` and retry. On
> Windows, pip normally downloads a ready wheel; if not, ask your agent to check your Python version is a 64-bit
> release that pycairo publishes wheels for.

## Step 1 — a title card with weight

In your workshop (`~/66/video`) create `day16/`. Then:

```text
Goal: a 5-second animated title card rendered with pycairo and piped straight into ffmpeg.
Context: folder day16/. Python 3, pycairo and ffmpeg are installed. I'm learning easing.
Constraints:
- 1920x1080, 30 fps, 150 frames. Render each frame into a cairo ImageSurface (FORMAT_ARGB32) and write its bytes to ffmpeg's stdin (-f rawvideo -pix_fmt bgra -s 1920x1080 -r 30 -i -), output H.264, yuv420p, CRF 18.
- Put easing functions in day16/easing.py: linear, ease_out_cubic, ease_in_out_cubic, ease_in_cubic, ease_out_back. Add a helper animate(frame, start, end, a, b, ease) that clamps progress and returns the value.
- Timeline: frames 0-24 the title slides up 80 px and fades in (ease_out_cubic); subtitle does the same starting at frame 8 (stagger); a thin accent line grows from 0 to full width frames 10-40 (ease_out_back); hold; frames 125-149 everything fades out and moves up 40 px (ease_in_cubic).
- Title: "Building in public". Subtitle: "Day 16 of 66". Clean sans-serif, generous margins.
- One main script day16/title_card.py, no other dependencies.
Done when: `python day16/title_card.py` writes day16/title_card.mp4, and ffprobe shows 150 frames at 1920x1080.
```

Check it:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames -of default=noprint_wrappers=1 day16/title_card.mp4
```

Then *watch* it three times. Is the stagger noticeable? Does the exit feel like leaving or like falling? Change one
number (stagger 8 → 4, or entry 24 → 16 frames), re-render, compare. This loop — change, render, look — is the whole
job of a motion designer. Use your own title if you have a build-log name. Upload the best version.

> **Tip:** ask the agent for a `--frame 20` flag that saves a single PNG of that frame. Checking one still is much
> faster than re-rendering five seconds every time.

## Step 2 — three curves, one screen

```text
Goal: a comparison video of easing curves.
Context: reuse day16/easing.py.
Constraints:
- 1920x1080, 30 fps, 3 seconds. Three horizontal lanes, each with a label on the left:
  "linear", "ease-in-out cubic", "ease-out back".
- In each lane a square travels from x=300 to x=1700 between frames 15 and 60, then holds.
- Draw faint tick marks along the path every 3 frames of movement, so spacing shows the speed.
Done when: day16/easing_compare.mp4 renders and the three squares start and finish on the same frames.
```

Look at the tick marks: evenly spaced for linear, bunched at both ends for ease-in-out, and the back curve goes
*past* the finish line before settling. That's what your eye felt before you knew the words. Upload the comparison.

## Quiz

1. A notification card shoots in quickly and gently brakes into place. Which curve?
2. A logo grows, goes slightly bigger than its final size, then settles back. Which curve?
3. A camera pans across a map: slow start, smooth middle, slow stop. Which curve?
4. A loading spinner rotates forever at constant speed. Which curve, and why is it fine here?

> **Answers:**
>
> 1. Ease-out (e.g. ease-out cubic) — fast arrival, soft landing.
> 2. Ease-out back — the overshoot is the "back" part.
> 3. Ease-in-out — speeds up, then slows down.
> 4. Linear — a spinner has no start or end to soften; easing it would make it look like it's stuttering.

## You're done when…

- [ ] You can explain progress → easing → value without looking.
- [ ] `title_card.mp4` (5 s, 150 frames) with staggered, eased motion is uploaded.
- [ ] `easing_compare.mp4` shows three curves with the same start and end frames, uploaded.
- [ ] Quiz done.

**Tomorrow:** the words themselves start to move — on rhythm.
