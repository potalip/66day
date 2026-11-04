---
day: 27
track: video
phase: 2
title: "Boss: a 60-second explainer, 100% code"
summary: "Script, voice, visuals, captions and music — all made by code — in one 60-second explainer, published and tested on real viewers."
estMinutes: 150
boss: true
badges: [boss-build]
resources:
  - "https://www.remotion.dev/docs/"
  - "https://docs.manim.community/en/stable/"
  - "https://github.com/SYSTRAN/faster-whisper"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d27-video-t1
    type: build
    title: "Write the script and a 6-frame storyboard"
    xp: 20
    proof: text
  - id: d27-video-t2
    type: build
    title: "Render the 60-second explainer with voice, captions and music"
    xp: 100
    proof: file
  - id: d27-video-t3
    type: ship
    title: "Publish your explainer"
    xp: 60
    proof: link
  - id: d27-video-t4
    type: share
    title: "Show it to 3 viewers and note where attention dropped"
    xp: 30
    proof: text
---

Two weeks ago you turned 90 pictures into a 3-second clip. Since then you've learned easing, kinetic type, Remotion,
sound, voice, captions, vertical grammar, explainers and data videos. Today all of it goes into one finished piece: a
60-second explainer where every frame, every word of voice and every caption was made by code you directed. Then real
people watch it — the only review that counts.

## The plan (150 minutes)

| Stage | Tool you already have | Minutes |
|---|---|---|
| Script + storyboard | LLM draft, your rewrite, day 22 rules | 20 |
| Voice | `day22/tts.py` | 10 |
| Visuals | Remotion (days 18–19, 24) or Manim (day 25) | 50 |
| Captions | `day23/transcribe.py` + `make_ass.py` | 10 |
| Music + mix | `day20/mix.py` | 10 |
| Publish | upload + SRT | 20 |
| 3 viewers | phone, chat, or in person | 30 |

The rule for today: **reuse, don't rebuild**. If a stage breaks, fix the old script instead of writing a new one —
you're starting the pipeline you'll formalise on day 33.

## Step 1 — script and storyboard (20 min)

Pick a topic with one clear "aha". Example: **"How noise-cancelling headphones make sound disappear by adding more
sound."** Or redo your day 13 topic properly.

```text
Goal: a 60-second explainer script and a 6-frame storyboard as one JSON file.
Context: topic "<your topic>". Vertical 1080x1920 for Shorts/Reels/TikTok. Audience: curious adults on phones.
Constraints:
- day27/plan.json: { "title", "hook", "frames": [ { "id", "seconds", "voice", "on_screen", "animation" } ] }.
- 6 frames, ~140-150 words of voice in total (about 60 s), sentences under 15 words, numbers as words.
- Frame 1: a hook that creates a question within 2 seconds. Frame 6: the payoff, plus a last line that loops back.
- One visual metaphor throughout; objects transform between frames.
Done when: every frame can be pictured from its text, and the voice reads aloud in 55-62 seconds.
```

Read it aloud with a timer and rewrite every line you stumble on. Paste the final JSON.

## Step 2 — render it (100 min)

```text
Goal: render the full 60-second explainer from day27/plan.json by chaining my existing scripts.
Context: day22/tts.py (cached TTS), day23/transcribe.py + day23/make_ass.py (captions), day20/mix.py (music, ducking, -14 LUFS), Remotion project in remotion/ with my brand font and colours. Music and licences in assets/.
Constraints:
- day27/make.py runs stages in order and skips any stage whose output already exists unless I pass --force <stage>: 1 voice per frame -> durations.json; 2 Remotion composition "Explainer" (1080x1920, 30 fps) with one <Sequence> per frame, lengths from durations.json, visuals following "on_screen" and "animation"; 3 render; 4 transcribe the joined voice and burn word-highlight captions inside the safe zone; 5 mix music ducked under voice to -14 LUFS.
- Final file day27/final.mp4. Also write day27/final.srt for upload.
- Print each stage's time, and at the end a QC report: duration, resolution, codecs, integrated loudness, true peak.
Done when: `python day27/make.py` produces final.mp4 that passes QC (55-65 s, 1080x1920, h264/aac, -14 +/-1 LUFS, peak below -1 dBTP).
```

Work frame by frame: get frame 1 looking right in Remotion Studio before asking for frame 2. Then run your own QC:

```bash
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate -show_entries format=duration -of default=noprint_wrappers=1 day27/final.mp4
ffmpeg -hide_banner -i day27/final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary"
```

Watch it three ways: with sound, muted (do the captions carry it?), eyes closed (does the voice carry it?). Fix the
worst thing you notice — only one — and re-render; the cache makes it fast. Upload `final.mp4`.

> **If you're stuck:** don't debug the whole chain at once. Run one stage, check its output file, then the next.
> Captions drifting? Check that you transcribed the *joined* voice file, not the first line. Out of time? Cut frame 4
> and make a 50-second video. A finished 50 seconds beats an unfinished 60.

> **Tip:** run `python day27/make.py` once more after everything works, in a clean terminal. If it runs start to
> finish without you touching anything, you've built a pipeline, not just a video. Keep `make.py`: on day 33 it grows into a proper `make-video` command.

## Step 3 — publish (20 min)

Upload to YouTube Shorts, TikTok or Instagram Reels — ideally two of them. For YouTube, add `final.srt` as captions.
Write a title that's the hook, not the topic ("Headphones cancel noise by adding noise", not "Noise cancelling
explained"). If the platform asks about AI-generated or synthetic content, answer honestly — your voice is synthetic.
Credit music and sounds that need attribution in the description. Paste the link.

## Step 4 — three viewers (30 min)

Show it to three people one by one — in person or on a video call where you can see their face. Before they watch,
say: "Tell me the moment you'd have scrolled away." After: "Explain the idea back to me in one sentence." Write down,
for each viewer:

- the second where attention dropped (or "watched to the end"),
- their one-sentence explanation (did they get the aha?),
- one thing they'd change.

Paste all three. If two people drop at the same second, that second is your homework for day 37.

## You're done when…

- [ ] `plan.json` with the script and 6-frame storyboard is pasted.
- [ ] `final.mp4` passes QC (55–65 s, 1080×1920, h264/aac, −14 LUFS ±1) and is uploaded.
- [ ] The explainer is public; link pasted.
- [ ] Three viewers' drop-off seconds, explanations and suggestions are pasted.

**Next:** a rest day. Then AI-generated footage joins your toolbox.
