---
day: 17
track: video
phase: 2
title: "Kinetic typography: words that move on the beat"
summary: "Animate a 15-second quote word by word, timed to your own voice, with a font you're actually allowed to use."
estMinutes: 90
resources:
  - "https://fonts.google.com/"
  - "https://trac.ffmpeg.org/wiki"
tasks:
  - id: d17-video-t1
    type: read
    title: "Learn timing, emphasis, fonts and font licences"
    xp: 10
    proof: none
  - id: d17-video-t2
    type: build
    title: "Render a 15-second word-by-word quote timed to voice or beat"
    xp: 60
    proof: file
  - id: d17-video-t3
    type: reflect
    title: "Pick the moment that works best and explain why"
    xp: 15
    proof: text
  - id: d17-video-t4
    type: share
    title: "Post your kinetic quote"
    xp: 20
    proof: link
---

Half the videos in your feed are text on a background, yet the good ones are still impossible to scroll past. The
secret isn't fancy effects. Every word lands at the exact moment you hear it. Today you add timing to yesterday's
easing and make words feel spoken.

## Type that moves: four rules

1. **Sync beats style.** A word should appear on, or a hair before, the moment it's spoken. Ten frames late and it
   feels like a badly dubbed film.
2. **One emphasis per sentence.** Pick the word that carries the meaning and make it bigger, bolder or the accent
   colour. Emphasise everything and you've emphasised nothing.
3. **Rhythm of reveals.** Short words can arrive in pairs; long important words get their own moment. A typical pace
   is 2–3 words per second.
4. **Let the last line breathe.** Hold the final words on screen for at least a second before cutting.

### Fonts: what you may use

A font is software with a licence. The font on your laptop (Helvetica, SF Pro, Segoe) is licensed for your screen,
not necessarily for videos you publish or sell. The easy, safe path is **Google Fonts**: almost all of them use the
**SIL Open Font License (OFL)**, which allows commercial use in videos, logos and apps. Open a font's page, check the
"License" section, download it, and keep the licence file next to the font in your repo. Fonts from "free font" sites
are often "free for personal use only" — fine for practice, not for client work.

Good starting choices: **Inter** or **Manrope** for clean, **Archivo Black** or **Anton** for loud, **Playfair Display**
for elegant. Put the `.ttf` files in `assets/fonts/`.

## Step 1 — pick 15 seconds of words and record them

Choose 30–40 words. A line from your own build log is perfect. Or pick something in the public domain — for
example Thoreau, *Walden* (1854): "I went to the woods because I wished to live deliberately, to front only the
essential facts of life, and see if I could not learn what it had to teach." Avoid modern authors and song lyrics:
those are copyrighted.

Record yourself reading it with your phone or laptop mic, in a quiet room, about 15 seconds, and save it as
`day17/voice.wav` (or `.m4a`). No mic? Use a beat instead — the prompt below covers that.

## Step 2 — capture the timing by tapping

```text
Goal: a tiny "tap timing" tool for kinetic typography.
Context: folder day17/. I have day17/quote.txt (the words) and day17/voice.wav. ffmpeg (with ffplay) is installed.
Constraints:
- `python day17/tap.py` starts playing voice.wav with ffplay (-nodisp -autoexit) and shows the next word.
- Every time I press Enter, record the current time as that word's start and show the next word.
- Save day17/timings.json as a list of {"word": ..., "start": seconds}. Add a global offset setting (default -0.08 s) to compensate for my reaction time.
- If voice.wav is missing, instead generate a 100 BPM click track day17/beat.wav with ffmpeg and assign one word per beat automatically.
Done when: after one run, timings.json has one entry per word with increasing start times.
```

Tap through it twice: the first run is practice.

## Step 3 — render the words

```text
Goal: a 15-second kinetic typography video from day17/timings.json.
Context: reuse my easing functions from day16/easing.py. Font file: assets/fonts/<YourFont>.ttf.
Constraints:
- 1080x1920 vertical, 30 fps, length = voice length (get it with ffprobe) or 15 s.
- Render frames with Pillow (ImageFont.truetype so the .ttf is used) and pipe raw RGB frames into ffmpeg; mux voice.wav (or beat.wav) as AAC; H.264, yuv420p.
- Each word pops in at its start time: scale 0.85 -> 1.0 and fade in over 6 frames with ease_out_back.
- Lay words out in lines of 2-4 words, centered, max 80% of the width. When a line is complete and the next word starts a new line, the old line slides up and fades.
- Words listed in EMPHASIS = [...] at the top of the script are 1.4x bigger and use the accent colour.
- Keep all text inside the middle 70% of the frame height.
Done when: day17/quote.mp4 plays with every word appearing as I hear it.
```

Check sync and specs:

```bash
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height -show_entries format=duration -of default=noprint_wrappers=1 day17/quote.mp4
```

You need one `video` stream (h264, 1080×1920) and one `audio` stream (aac), duration ~15 s. Then watch it with sound.
If words feel late, change the offset to −0.15 and re-render — no need to tap again.

> **If you're stuck:** Cyrillic or accented letters showing as boxes means the font lacks those characters — pick one
> on Google Fonts that lists them. Text cut at the edges? Ask the agent to measure each line with
> `font.getbbox()` and shrink the font until the longest line fits.

> **Tip:** pick one emphasis word per sentence before you render, not after. Decisions first, pixels second.

## Step 4 — reflect and post

Watch it three times. Write 2–3 sentences: which exact moment works best (a timestamp) and why — rhythm, emphasis,
a pause? Then post it where your build log lives (X, Threads, TikTok, Reels, YouTube Shorts) with one line about how
it was made. Paste the link.

## You're done when…

- [ ] You know why your font is licensed for video, and the licence file sits next to it.
- [ ] `quote.mp4` (vertical, ~15 s, voice or beat) is uploaded, and words land on time.
- [ ] You named the best moment with a timestamp and a reason.
- [ ] It's posted, link pasted.

**Tomorrow:** you swap Python for React — and video becomes a web page you can render.
