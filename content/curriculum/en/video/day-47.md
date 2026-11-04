---
day: 47
track: video
phase: 3
title: "Quality gates and ethics: a robot inspector for every render"
summary: "Build a QC script that catches loud, silent, black or off-spec renders, and a rights checklist for every asset."
estMinutes: 75
resources:
  - "https://ffmpeg.org/documentation.html"
  - "https://trac.ffmpeg.org/wiki"
  - "https://pixabay.com/music/"
  - "https://freesound.org/"
tasks:
  - id: d47-video-t1
    type: read
    title: "Learn the checks: loudness, black frames, sync, licences and disclosure"
    xp: 10
    proof: none
  - id: d47-video-t2
    type: build
    title: "Build a QC script and paste a report on a real render"
    xp: 50
    proof: text
  - id: d47-video-t3
    type: build
    title: "Fill a rights checklist for every asset in your last video"
    xp: 20
    proof: text
  - id: d47-video-t4
    type: quiz
    title: "Allowed or not? Judge four real situations"
    xp: 15
    proof: none
---

Your pipeline can make ten videos a day now. That also means it can make ten broken videos a day: a scene that renders
black, music that clips, a caption that hangs on screen after the voice moves on. Broadcasters solved this decades ago
with automated QC. Today you build your own inspector, plus the boring paperwork that keeps you out of copyright trouble.

## What to check, and why

| Check | Tool | Pass when |
|---|---|---|
| Resolution, fps, codec, pixel format | `ffprobe` | Matches the target spec (e.g. 1080x1920, 30 fps, H.264, yuv420p) |
| Integrated loudness, true peak | `ebur128` filter | About −14 LUFS (±1), true peak ≤ −1 dBTP |
| Black frames | `blackdetect` | None longer than 0.1 s except a planned fade |
| Silence | `silencedetect` | No gap over 1.5 s unless the script says so |
| Frozen picture | `freezedetect` | No freeze over 2 s you didn't intend |
| Captions | your SRT parser | No overlaps, 0.7–7 s per cue, ≤ ~20 characters per second, ends before video end |

The tools live inside ffmpeg; the script just runs them and reads the logs:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,pix_fmt,codec_name -of json out.mp4
ffmpeg -hide_banner -i out.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12
ffmpeg -hide_banner -i out.mp4 -vf blackdetect=d=0.1:pix_th=0.10 -an -f null - 2>&1 | grep blackdetect
ffmpeg -hide_banner -i out.mp4 -af silencedetect=noise=-50dB:d=1.5 -vn -f null - 2>&1 | grep silence_
```

**Ethics, in two parts.**

*Rights:* every asset needs a known source and a licence that covers your use. Pixabay Music has its own content
licence; Freesound sounds are each licensed separately (CC0, CC BY or CC BY-NC, and NC means no commercial use, so no
client work). Google Fonts are mostly under the Open Font License. AI-generated clips follow the provider's terms.
Voices need consent.

*Disclosure:* YouTube asks creators to flag realistic altered or synthetic content (a real-looking person saying
something they didn't, a fake event) in the upload settings. TikTok and Meta label AI content too, and may detect it
automatically from metadata. Obvious animation, motion graphics and clearly fantastical visuals usually don't need a
label. Rules move fast: check each platform's current policy before a client delivery.

## Step by step

### 1. Build the QC stage

```text
Goal: qc.py checks a rendered video and writes a report; it becomes the last stage of my pipeline.
Input: path to mp4, optional .srt, target spec from my pipeline config (resolution, fps, loudness).
Checks: ffprobe spec match; ebur128 integrated loudness + true peak; blackdetect; silencedetect; freezedetect; caption rules (overlap, min/max duration, characters per second, ends before video end).
Output: a report next to the video, <video-name>.qc.md (e.g. runs/<slug>/final-9x16.qc.md), with PASS / WARN / FAIL per check, the measured value, and the timestamp of every problem. Exit code 1 on any FAIL so the pipeline stops before publishing.
Done when: it runs on my last render, and a deliberately broken copy (add 2 s of black and +6 dB) fails.
```

Make that broken copy for the test:

```bash
ffmpeg -i out.mp4 -vf "drawbox=c=black:t=fill:enable='between(t,3,5)'" -af volume=6dB broken.mp4
```

> **If you're stuck:** the loudness number looks way off? Make sure the script reads the *summary* block at the end of
> the ebur128 output ("Integrated loudness: I: …"), not the per-moment lines above it.

Paste the report from your real render, including any WARNs. A warning you understand beats a pass you don't.

### 2. Rights checklist

List every asset in your last published or delivered video: music, SFX, fonts, stock or AI clips, images, logos, voice.
For each: source link, licence name, commercial use yes/no, attribution needed and where you put it, and proof (saved
licence page or receipt). Ask the agent to turn this into `assets.json` that your pipeline fills in automatically from
now on. Paste the checklist.

## Quiz

1. A CC BY-NC sound effect in a promo for a client's café. Allowed?
2. An AI-generated, photo-real clip of a crowd at a "launch event" that never happened, on YouTube. Label it?
3. A motion-graphics explainer with an AI voice you generated from a stock voice. Need the synthetic label?
4. A client sends you their logo and a song "they found online" for the background. Use the song?

> **Answers:**
>
> 1. No. NC forbids commercial use, and a business promo is commercial. Find a CC0 or commercially licensed sound.
> 2. Yes. Realistic footage of an event that didn't happen is exactly what disclosure rules target.
> 3. Usually not as "realistic altered content" on YouTube, but check the current policy, and be honest if asked.
>    Some clients want "AI voice" in the credits anyway.
> 4. Not until someone shows a licence for that use. "Found online" means unknown rights, and the strike lands on the
>    channel that publishes it.

## You're done when…

- [ ] You can explain −14 LUFS, true peak, and what NC means.
- [ ] A QC report on a real render is pasted, and the broken copy fails.
- [ ] A rights checklist covers every asset in your last video.
- [ ] Quiz done.

**Tomorrow:** you open-source your template, and strangers can use it.
