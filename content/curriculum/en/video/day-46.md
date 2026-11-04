---
day: 46
track: video
phase: 3
title: "Long to short: a clipping machine you control"
summary: "A script reads a long video's transcript, picks the three best moments by your rubric and cuts them into vertical shorts."
estMinutes: 120
resources:
  - "https://github.com/SYSTRAN/faster-whisper"
  - "https://trac.ffmpeg.org/wiki"
  - "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview"
tasks:
  - id: d46-video-t1
    type: read
    title: "Learn what makes a moment clippable"
    xp: 10
    proof: none
  - id: d46-video-t2
    type: build
    title: "Turn one long video into three shorts and upload the best"
    xp: 70
    proof: file
  - id: d46-video-t3
    type: build
    title: "Write the selection prompt and scoring rubric"
    xp: 20
    proof: text
  - id: d46-video-t4
    type: quiz
    title: "Reframe the speaker: pick the right crop"
    xp: 15
    proof: none
---

Podcasters, coaches and course creators sit on hours of long video. Their audience lives on Shorts, Reels and TikTok.
Clipping is one of the most requested video jobs on Upwork and Contra, and most of it is still done by someone
scrubbing a timeline. Today you build the machine that does the first 90% and leaves the taste to you.

## What makes a moment clippable

A good short works with **zero context**. Your rubric, scored 1–5 each:

1. **Hook in the first 3 seconds** — a claim, a question, a number, a surprise. "Most people price their first gig
   wrong" beats "So, yeah, as I was saying".
2. **Self-contained** — no "like I mentioned earlier", no unexplained "he" or "that thing".
3. **Payoff** — it ends on an answer, a punchline or a strong opinion, not mid-thought.
4. **Length** — 20–60 seconds of real content.
5. **Emotion or specificity** — laughter, a story, a concrete number. Generic advice scores low.

Then the craft: cut on sentence boundaries (never mid-word), reframe 16:9 to 9:16 so the speaker stays in frame, and
add captions, since many people watch with the sound off.

**Rights first.** Only clip content you own or have written permission for. "It's on YouTube" is not permission,
and "credit to the original" is not a licence either. If a guest appears, ask the host whether their agreement with
the guest covers clips; if nobody knows, ask the guest. Keep the written OK next to the project.

## Step by step

### 1. Get a long video

Best option: record yourself for 10–15 minutes talking about what you learned building your pipeline: what broke, what
it costs, what surprised you. Phone or webcam, landscape. Second option: a friend's or client's podcast episode with
their written OK. Third: a talk under a licence that allows remixing (check it, keep the link).

### 2. Write the rubric and selection prompt (task 3)

```text
You are a short-form editor. Below is a transcript with word-level timestamps.
Find the 6 best candidate clips of 20-60 s. Score each 1-5 on: hook (first 3 s), self-contained, payoff, specificity. A clip must start and end on a sentence boundary.
Return JSON only: [{start, end, hook_line, scores: {...}, total, why}] sorted by total.
Reject clips that need earlier context or start with a filler word.
```

Tune the wording against your own taste: read the top three it returns and disagree out loud. Paste your final prompt
and rubric as proof.

### 3. Build the clipper

```text
Goal: clip.py turns long.mp4 into 3 vertical shorts with captions, as a stage in my pipeline.
Steps:
1. Transcribe with faster-whisper, word_timestamps=True, save transcript.json.
2. Send it with my selection prompt (prompts/clip-select.txt) to the LLM; validate the JSON; keep the top 3 that don't overlap.
3. Snap start/end to the nearest silence within 0.4 s so cuts never clip a word.
4. Cut with ffmpeg, re-encoding (frame-accurate), 0.2 s audio fade in/out.
5. Reframe to 1080x1920: detect the face every 5th frame (MediaPipe or OpenCV; use their current API docs), smooth the x position (moving average over ~1 s), crop around it. No face found: centre crop. Flag a clip as "two speakers" if two faces stay apart, and fall back to a centre crop or a stacked layout for it.
6. Captions from the transcript words, offset to the clip start, in my caption style. Add the hook_line as a title card for the first 2 s.
7. Write out/clips/report.md: times, scores, why, and the crop mode used.
Done when: three mp4s in out/clips/, the speaker never leaves the frame, no word is cut in half.
```

> **If you're stuck:** the crop shakes like a handheld camera in an earthquake? Your smoothing window is too short or
> you're tracking every frame. Smooth over a full second and only move the crop when the face drifts more than ~8% of
> the width. Calm framing beats perfect framing.

> **Tip:** don't let the model's score be the final word. Watch all six candidates at 2x; you'll often promote the
> fourth one because it's funnier.

Upload your best clip.

## Quiz

1. One speaker, sitting slightly left of centre, barely moving. Tracking or centre crop?
2. Two people in a wide shot, talking in turns. What are your options?
3. The speaker walks across a stage. Why does per-frame tracking look bad?
4. A slide fills the screen with text for 15 seconds. 9:16 crop?

> **Answers:**
>
> 1. A fixed crop around their position. Tracking adds motion and risk for no gain.
> 2. Switch the crop to whoever is speaking (from the transcript or audio), or stack both faces top and bottom.
> 3. It follows every small step, so the frame jitters. Smooth, add a dead zone, and move the crop like a camera
>    operator would: rarely and steadily.
> 4. No. Cropping cuts the text off. Show the slide scaled down with a blurred background, or redraw the key line as a
>    caption.

## You're done when…

- [ ] You can name the five criteria of a clippable moment.
- [ ] Three vertical shorts exist and the best one is uploaded.
- [ ] Your selection prompt and rubric are pasted.
- [ ] Quiz done, and you know when not to track.

Tomorrow: a robot QC inspector that checks every render before you hit Publish.
