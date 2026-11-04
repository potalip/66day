---
day: 15
track: video
phase: 2
title: "How code makes video"
summary: "Draw 90 frames with Python, glue them into a 3-second mp4, and keep the four ffmpeg commands you'll use forever."
estMinutes: 75
badges: [first-render]
resources:
  - "https://www.youtube.com/watch?v=deg8bOoziaE"
  - "https://trac.ffmpeg.org/wiki"
  - "https://docs.python.org/3/tutorial/"
  - "https://ffmpeg.org/ffmpeg.html"
tasks:
  - id: d15-video-t1
    type: read
    title: "Understand frames, fps, resolution, codecs and containers"
    xp: 10
    proof: none
  - id: d15-video-t2
    type: build
    title: "Turn 90 Python-drawn frames into a 3-second mp4"
    xp: 40
    proof: file
  - id: d15-video-t3
    type: build
    title: "Build your ffmpeg cheat sheet: trim, 9:16, add audio, GIF"
    xp: 30
    proof: text
  - id: d15-video-t4
    type: quiz
    title: "Do the fps and duration math"
    xp: 15
    proof: none
---

On day 12 you made a 5-second title and it felt a bit like magic. Today we take the magic apart. Every video you
will make in the next 50 days — kinetic type, Remotion explainers, data videos, AI clips — ends the same way: a pile
of pictures becomes an mp4. Once you understand that one step, nothing in this track is mysterious.

## A video is a flipbook with a lunchbox

- **Frame** — one still image. Video is just many of them shown quickly.
- **fps** (frames per second) — how many frames play each second. 24 feels cinematic, 30 is the web default, 60 is
  smooth for screen recordings and games. **Duration = frames ÷ fps.** 90 frames at 30 fps = 3 seconds.
- **Resolution** — size of each frame in pixels. 1920×1080 is horizontal 16:9 (YouTube). 1080×1920 is vertical
  9:16 (Shorts, TikTok, Reels).
- **Codec** — *how* the pictures are compressed. **H.264** is the one that plays everywhere; H.265, VP9 and AV1
  are smaller but less universal.
- **Container** — the box that holds the compressed video, the audio and the metadata: `.mp4`, `.mov`, `.webm`.

Analogy: the container is the lunchbox, the codec is how the sandwich got vacuum-packed to fit. An `.mp4` can hold
H.264 or AV1 — same box, different packing. That's why "it's an mp4" doesn't guarantee it plays on your aunt's TV.

Two more words you'll see in every command: **CRF** (quality for H.264: 18 looks great, 23 is the default, higher =
smaller and blurrier) and **pixel format** `yuv420p` (the colour layout every phone and browser understands).

## Step 1 — draw 90 frames, glue them together

Open your phase-2 video workshop from day 14 (`~/66/video`) and make a `day15/` folder there. Until day 27, every path
in this track is relative to `~/66/video`. First give the workshop one Python environment for the whole track — the same
`.venv` trick as day 12, so pip never says "externally-managed-environment":

```bash
cd ~/66/video
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install pillow
```

Activate it in every new terminal before running a script (your prompt shows `(.venv)`), and add one line to the
workshop's `CLAUDE.md`: "Python packages go into ~/66/video/.venv". From now on, every "install it" in a prompt means
into this venv. Then give your agent this:

```text
Goal: a Python script that draws 90 PNG frames for a 3-second animation.
Context: I'm learning how video is made from frames. Folder: day15/. Python 3 and Pillow are installed in ~/66/video/.venv (activated).
Constraints:
- 1920x1080, dark background, a bright circle that moves from the left edge to the right edge over 90 frames.
- Draw the frame number in the top-left corner in large text so I can see individual frames.
- Save as day15/frames/frame_0000.png ... frame_0089.png (zero-based, 4 digits).
- Don't call ffmpeg — I will run it myself.
Done when: running `python day15/make_frames.py` creates exactly 90 PNGs and prints how many it wrote.
```

Run it, open two or three PNGs to see they differ, then build the video yourself:

```bash
ffmpeg -framerate 30 -i day15/frames/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 day15/ball.mp4
```

`-framerate 30` says how fast to read the pictures, `%04d` means "four-digit number", `-pix_fmt yuv420p` makes it
play everywhere. Now prove what you made:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,pix_fmt -show_entries format=duration -of default=noprint_wrappers=1 day15/ball.mp4
```

You want: `codec_name=h264`, `width=1920`, `height=1080`, `r_frame_rate=30/1`, `nb_frames=90`, `duration=3.000000`.
Upload `ball.mp4` as proof.

> **If you're stuck:** "No such file" usually means the pattern doesn't match the names — check that the first file is
> really `frame_0000.png`. "height not divisible by 2" means an odd frame size; H.264 with yuv420p needs even width and
> height. Paste the full error to your agent and ask *why*, not just *fix*.

## Step 2 — the four commands you'll reuse forever

Make a test sound so you don't need to download anything:

```bash
ffmpeg -f lavfi -i "sine=frequency=440:duration=3" day15/beep.wav
```

Run each command below on `ball.mp4`, check the result with ffprobe, then paste all four into `day15/CHEATSHEET.md`
with one line each saying what it does.

```bash
# 1. Trim: from 0.5 s, keep 2 s (re-encodes, so the cut is frame-accurate)
ffmpeg -ss 0.5 -i day15/ball.mp4 -t 2 -c:v libx264 -crf 18 -pix_fmt yuv420p day15/trim.mp4

# 2. Fit into vertical 1080x1920 with bars (no stretching, no cropping)
ffmpeg -i day15/ball.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1" -c:v libx264 -crf 18 -pix_fmt yuv420p day15/vertical.mp4

# 3. Add audio: keep the video as is, encode audio to AAC, stop at the shorter stream
ffmpeg -i day15/ball.mp4 -i day15/beep.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest day15/with-audio.mp4

# 4. Good-looking GIF: build a custom palette first, then use it
ffmpeg -i day15/ball.mp4 -vf "fps=15,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" day15/ball.gif
```

Why the GIF needs two passes: GIFs can only hold 256 colours. `palettegen` picks the best 256 for *your* video,
`paletteuse` applies them. Skip it and you get muddy bands.

> **Tip:** `-c copy` (no re-encode) is instant but can only cut at keyframes, so trims land a bit off. When precision
> matters, re-encode like command 1.

Ask your agent to explain any flag you don't understand — and to add one example of your own to the cheat sheet.
Paste the four commands as proof.

## Quiz

1. You have 90 frames and play them at 30 fps. How long is the video?
2. You need a 12-second clip at 24 fps. How many frames must your script draw?
3. You play the same 90 frames at 60 fps. What changes?
4. In a 30 fps video, at what time does frame 45 appear (counting from frame 0)?

> **Answers:**
>
> 1. 3 seconds (90 ÷ 30).
> 2. 288 frames (12 × 24).
> 3. It lasts 1.5 seconds and the motion looks twice as fast — same frames, less time.
> 4. At 1.5 seconds (45 ÷ 30). Frame 0 is at 0.0 s.

## You're done when…

- [ ] You can explain the difference between a codec and a container in one sentence.
- [ ] `ball.mp4` exists, ffprobe shows h264, 1920×1080, 30/1, 90 frames — and you uploaded it.
- [ ] `CHEATSHEET.md` has the four working commands with notes, pasted as proof.
- [ ] You did the quiz without peeking (or peeked, then redid it).

**Tomorrow:** your circle moves like a robot. We'll teach it to move like it has weight.
