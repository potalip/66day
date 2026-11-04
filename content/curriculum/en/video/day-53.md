---
day: 53
track: video
phase: 4
title: "The craft pass: sound, pacing, captions"
summary: "Take your best capstone output from good to watchable-to-the-end: clean sound, tight pacing, readable captions, a clean QC report."
estMinutes: 120
resources:
  - "https://ffmpeg.org/documentation.html"
  - "https://trac.ffmpeg.org/wiki"
  - "https://github.com/SYSTRAN/faster-whisper"
  - "https://www.remotion.dev/docs/"
tasks:
  - id: d53-video-t1
    type: build
    title: "Do a craft pass on your best output and export the mp4"
    xp: 70
    proof: file
  - id: d53-video-t2
    type: build
    title: "Paste QC reports from before and after"
    xp: 30
    proof: text
  - id: d53-video-t3
    type: reflect
    title: "Watch it muted, then with eyes closed: write what you learned"
    xp: 15
    proof: text
---

On days 51–52 your pipeline produced the first capstone outputs — episodes of your series, renders from your tool, or
pieces of your reel. They work. But "works" and "people watch it to the end" are separated by a hundred tiny things:
a breath too long, music fighting the voice, a caption hiding under the like button. Today you do what editors call
the **craft pass** — one output, every second, on purpose.

## The three things viewers feel but can't name

1. **Sound.** People forgive mediocre visuals; they leave on bad audio. Targets: dialogue clear and consistent, music
   ducked under the voice, loudness around **−14 LUFS integrated** with true peak at or below **−1 dBTP** for most
   streaming and social platforms (check the current spec for yours — you mapped them on day 36).
2. **Pacing.** Every pause longer than ~0.6 s that isn't deliberate feels like a stall. The first 3 seconds must already
   be the point, not the logo. Something should change on screen every few seconds — a cut, a zoom, a new line.
3. **Captions.** Most mobile viewers start muted. Two lines max, short lines (aim for ~32–42 characters), high
   contrast, and inside the **safe zone**: on vertical video, keep clear of the bottom fifth and the right edge, where
   platform buttons and descriptions sit.

Think of it as a restaurant kitchen's final check before a plate goes out: wipe the rim, fix the garnish. Same dish,
very different impression.

## Step by step

### 1. The "before" report (10 min)

Pick your **best** output — not the newest. Run the QC script you wrote on day 47 and save the result:

```bash
python qc.py out/episode-01.mp4 > qc/before.txt
```

If your QC script doesn't yet measure all three — loudness, silence and black frames — these ffmpeg filters are what
it should call under the hood:

```bash
ffmpeg -i out/episode-01.mp4 -af loudnorm=I=-14:TP=-1:LRA=11:print_format=summary -f null -
ffmpeg -i out/episode-01.mp4 -af silencedetect=noise=-35dB:d=0.6 -f null -
ffmpeg -i out/episode-01.mp4 -vf blackdetect=d=0.1:pix_th=0.10 -an -f null -
```

### 2. Fix it in the pipeline, not by hand (70 min)

The whole point of your pipeline is that fixes stick. Everything you change today should land in code, so episode 7
gets it for free. Give your agent this:

```text
Goal: a craft pass on out/episode-01.mp4, with every fix made in the pipeline so all future outputs inherit it.
Context: read the pipeline README and qc/before.txt. The project renders with [Remotion / pycairo + ffmpeg / MoviePy].
Fix, in this order:
1. Sound: two-pass loudnorm to -14 LUFS integrated, true peak <= -1 dBTP; duck music under voice by ~12 dB with
   sidechain compression (or volume automation from the VO timestamps); remove clicks at cut points with 10 ms fades.
2. Pacing: use the word timestamps from faster-whisper to trim any silence over 0.6 s inside the VO (keep 0.15 s
   padding), and make sure the first spoken word starts before 0.5 s.
3. Captions: max 2 lines, max 38 characters per line, break at phrase boundaries, never orphan a single word;
   keep them inside a configurable safe zone (for 9:16: not in the bottom 20% or the right 12%).
Make each fix a separate, named config option with a sensible default. Re-render episode-01 and run qc.py again,
saving qc/after.txt.
Done when: qc/after.txt shows loudness within ±1 LU of target, no unintended silence or black frames, and you
show me a short diff of the config.
```

Then **watch** the result on your phone, at normal volume, with headphones and without. Note anything that still
feels off and send it back in one sentence each.

> **If you're stuck:** ducking sounds like the music is "pumping"? Slow down the compressor's release (try 250–400 ms)
> or switch to simple volume automation: lower the music by 12 dB from 0.2 s before each VO segment to 0.3 s after.
> Less clever, often nicer.

**Proof for task 1:** attach the final mp4. **Proof for task 2:** paste `qc/before.txt` and `qc/after.txt` side by side
(the summary lines are enough).

> **Tip:** if your capstone is a **tool** rather than a series, do the craft pass on the tool's *default* output —
> the one a new user gets on their first try. That render is your product's first impression.

### 3. Two strange viewings (20 min)

Now the old editor's trick. Watch the new version twice:

- **Muted.** Can you follow the story from images and captions alone? Where are you lost?
- **Eyes closed.** Does the audio carry it? Where does the voice rush, mumble, or get buried by music?

Each viewing removes one sense and exposes what the other one was covering up. Write down two or three moments from
each — with timestamps. **Proof for task 3:** your notes, and which fix you'd add to the pipeline next.

## You're done when…

- [ ] Your best capstone output has had a full craft pass in the pipeline; the mp4 is attached.
- [ ] Before/after QC reports are pasted and the after report is clean.
- [ ] You watched muted and eyes-closed and wrote down what each revealed.

**Tomorrow:** five real viewers. Your notes from today will meet their reality.
