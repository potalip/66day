---
day: 43
track: video
phase: 3
title: "Generative visuals that dance to the sound"
summary: "Turn 20 seconds of music into a visual that moves with every beat, rendered frame by frame, not screen-recorded."
estMinutes: 90
resources:
  - "https://p5js.org/"
  - "https://www.shadertoy.com/"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d43-video-t1
    type: read
    title: "Learn the three ingredients: noise, shaders and audio analysis"
    xp: 10
    proof: none
  - id: d43-video-t2
    type: build
    title: "Render a 20-second audio-reactive visual"
    xp: 60
    proof: file
  - id: d43-video-t3
    type: share
    title: "Post your visual where people scroll"
    xp: 20
    proof: link
  - id: d43-video-t4
    type: reflect
    title: "Name three places a client would pay for this"
    xp: 15
    proof: text
---

You've just shipped a three-video pack to a real client. Today is a palate cleanser with a business angle: visuals
nobody animated by hand, driven by math and the music itself. Lyric videos, podcast teasers, event loops, "now playing"
screens: they all need motion that never looks stock. By tonight your pipeline has a new kind of scene.

## The three ingredients

**Noise.** `random()` gives you static. *Noise* (Perlin or simplex) gives you smooth randomness: neighbouring inputs
return neighbouring values, so things drift like smoke instead of jittering. Feed it `(x, y, time)` and you get flow
fields, wobbling blobs, terrain.

**Shaders.** A fragment shader is a tiny GLSL program that runs once *per pixel*, in parallel on the GPU. It answers one
question: "what colour is this pixel at this time?" Shadertoy is a gallery of thousands of these. You don't need to
write GLSL today, but if you go that way, your agent can.

**Audio analysis.** Split the audio into one window per video frame. At 30 fps and 44,100 samples per second, that's
1,470 samples per frame. Run an FFT (Fast Fourier Transform) on each window and you learn how loud the bass, mids and
highs are *at that exact frame*. Add smoothing (fast attack, slow release) so the visual punches on a kick drum and then
relaxes instead of flickering.

The non-negotiable rule: **render frame-accurately**. Frame 312 is always computed from audio at 312 / 30 = 10.4 s.
Screen-capturing a live sketch drops frames and drifts out of sync. Analyse first, render each frame deterministically,
then let ffmpeg glue frames and audio.

## Step by step

### 1. Pick a 20-second clip you have rights to

Your own track, a voice memo, or something from Pixabay Music with its licence noted. Convert it to a clean WAV:

```bash
ffmpeg -i clip.mp3 -ss 0 -t 20 -ac 1 -ar 44100 clip.wav
```

### 2. Analyse, then render

Choose your route. **Python** (numpy + Pillow or pycairo, frames piped straight into ffmpeg) is the fastest to get
right. **p5.js** is lovely if you want to sketch in the browser first; the agent then renders it headlessly with
Playwright, one frame at a time.

```text
Goal: a 20-second, 1080x1920, 30 fps audio-reactive visual from clip.wav, as a new scene type in my video pipeline.
Context: my pipeline is in this repo (see README/CLAUDE.md). Python and ffmpeg are installed.
Steps:
1. analyse.py: load clip.wav, split into one window per frame (sample_rate / fps samples), FFT each window,
   compute bass (20-150 Hz), mids (150-2000 Hz), highs (2000-8000 Hz), normalise 0..1, smooth with fast attack
   and slow release. Save bands.json: one entry per frame.
2. render.py: for frame i, read bands[i], draw a noise-driven flow field (simplex noise over x, y, time):
   bass controls particle speed and a central pulse, highs control brightness and sparkle. Use my brand colours
   from brand config. Seeded randomness so the same input gives the same video.
3. Pipe raw frames to ffmpeg, mux clip.wav, H.264, yuv420p, out/generative.mp4.
Constraints: no screen capture, no real-time playback; time comes only from the frame index.
Done when: the mp4 is exactly 20.0 s (check with ffprobe), and the pulse visibly lands on the kicks.
```

If you chose p5.js, swap step 2 and 3 for: "a p5.js sketch with `noLoop()` and a `window.renderFrame(i)` function;
a Playwright script calls it for each frame and saves the canvas as PNG; ffmpeg joins the PNGs with the audio."

> **If you're stuck:** the visual moves but ignores the beat? Print `bands.json` for the first 60 frames and look for
> the kicks as spikes in bass. No spikes means the frequency ranges are off or the normalisation divides by a huge
> outlier. Ask the agent to normalise by the 95th percentile instead of the maximum.

> **Tip:** watch it once with sound, once muted. If you can still "see" the rhythm muted, you nailed it.

Check sync and length, then upload the mp4 as proof:

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 out/generative.mp4
```

### 3. Post it

A 20-second loop is perfect for Reels, TikTok, YouTube Shorts or an X post. One honest line works better than hype:
"Every frame here is computed from the music. No keyframes, no stock." Paste the post link.

### 4. Reflect like a seller

Write three concrete places a client would pay for this: a musician's release teaser, a podcast audiogram, a bar's
screen loop, a conference stage background. For each, one sentence on what you'd change (format, length, branding).

## You're done when…

- [ ] You can explain noise vs random and why analysis comes before rendering.
- [ ] A 20-second audio-reactive mp4, rendered frame by frame, is uploaded.
- [ ] The post link is pasted.
- [ ] Three client use cases, each with what you'd adapt, are written down.

Tomorrow: screen tutorials that zoom themselves to wherever you click.
