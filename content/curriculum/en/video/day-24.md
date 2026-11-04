---
day: 24
track: video
phase: 2
title: "Shorts: the vertical grammar"
summary: "Make a 20-second vertical short with three different hooks, respect the safe zones, and publish the strongest one."
estMinutes: 90
resources:
  - "https://www.remotion.dev/docs/"
  - "https://developers.google.com/youtube/v3"
tasks:
  - id: d24-video-t1
    type: read
    title: "Learn hooks, safe zones, pacing and loops"
    xp: 10
    proof: none
  - id: d24-video-t2
    type: build
    title: "Render a 20-second short in 3 hook variants"
    xp: 60
    proof: file
  - id: d24-video-t3
    type: share
    title: "Publish one variant"
    xp: 20
    proof: link
  - id: d24-video-t4
    type: quiz
    title: "Decide: is this a hook?"
    xp: 15
    proof: none
---

On YouTube Shorts, TikTok and Reels, people decide in about one second whether you get the next nineteen. Not because
they're shallow — because the next video is one thumb-flick away. That makes the first second the most important
creative decision in a short. Today you stop guessing and make three openings for the same video.

## The grammar

**Hook in 1–2 seconds.** The first frame and first line must create a question or a promise. Patterns that work:
- **The result first:** show the finished thing, then explain how.
- **A specific, true claim:** "This one shortcut saves me an hour a week."
- **A question the viewer already has:** "Why does your phone die faster in the cold?"
- **A visual surprise:** something moves, breaks or transforms in frame one.

What's *not* a hook: a logo intro, "Hey guys", "In this video I'm going to…", a black screen fading in. Your branded
intro from day 18 belongs at the end of a long video, not at the start of a short.

**Safe zones.** The platform draws its own interface over your video. On a 1080×1920 frame, roughly: the top ~220 px
(status bar, search), the bottom ~420 px (caption, username, sound), and the right ~140 px (like, comment, share
buttons). Keep text and faces in the middle. The exact areas change with app updates, so test with a private upload.

**Pacing.** Something should change every 1–2 seconds: a new word, a cut, a zoom, a number. Silence and stillness feel
twice as long on a phone.

**Loops.** If the last line flows back into the first ("…and that's why — this one shortcut saves me an hour a week"),
viewers often watch the start again before they notice. Replays count.

**Specs:** 1080×1920, 9:16, H.264 + AAC, 30 fps. Keep it to 20 seconds today.

## Step 1 — one body, three hooks

Choose a tiny, useful topic. Example: "three keyboard shortcuts that save you an hour a week". Write the body (seconds
3–20) once, and three hooks (seconds 0–2) of different types from the list above.

```text
Goal: a 20-second vertical short rendered in 3 hook variants.
Context: Remotion project in remotion/; TTS script day22/tts.py; captions scripts day23/transcribe.py and day23/make_ass.py; mixing script day20/mix.py. Folder day24/.
Constraints:
- day24/short.json: { "body": "<body script>", "hooks": [ {"id": "result", "line": "...", "visual": "..."}, {"id": "claim", ...}, {"id": "question", ...} ] }.
- Generate TTS for each hook line and for the body (cached). Measure durations with ffprobe.
- Remotion composition "Short" (1080x1920, 30 fps) with props { hookId, hookText, hookAudio, bodyAudio, durations }. Hook visual is big, bold and moving from frame 0 — no fade from black. Body: a visual change at least every 1.5 s.
- A prop showSafeZones draws translucent red boxes over the top 220 px, bottom 420 px and right 140 px (for checking only; off in final renders).
- The last body line should lead back into the hook for a loop.
- Render out/short-<hookId>.mp4 for all three, then burn captions and mix music at -14 LUFS with my existing scripts.
Done when: day24/ has three finished 18-22 s mp4s that differ only in the first 2 seconds.
```

First render one variant with `showSafeZones` on and look at a still: is any text or key visual inside a red box?
Fix it, then render all three. Verify each:

```bash
for f in day24/*.mp4; do echo "$f"; ffprobe -v error -show_entries stream=codec_name,width,height -show_entries format=duration -of csv=p=0 "$f"; done
```

Now judge them like a stranger: watch only the first 2 seconds of each, on your phone, then ask one person which one
they'd keep watching. Upload the best and list all three hooks with one line each on why you ranked them that way.

> **If you're stuck:** if the hook audio and body audio overlap or leave a gap, the composition is probably using
> fixed frame numbers. Ask the agent to compute the body's start frame from the hook audio duration
> (`Math.ceil(seconds * fps)`).

> **Tip:** say the hook line out loud while staring at the hook frame. If the picture and the words don't say the
> same thing, the viewer has to choose — and they'll choose to scroll.

## Step 2 — publish one

Upload your best variant to YouTube Shorts, TikTok or Instagram Reels (or all three — it's the same file). Write a
short, honest title; if the upload form asks whether the content is AI-generated or synthetic, answer truthfully.
Paste the link. Next week, check how many viewers swiped away — on day 37 you'll learn to read those numbers.

## Quiz

Is this a hook? Yes or no, and why.

1. A logo spins in for 2 seconds, then "Here are three tips".
2. Frame one: a laptop screen full of open windows snapping into a perfect grid. Voice: "One shortcut did this."
3. "Hey everyone, welcome back! Today we're talking about productivity."
4. "Your phone battery isn't dying. It's lying to you."

> **Answers:**
>
> 1. No — two seconds with nothing to wonder about are two seconds to say goodbye.
> 2. Yes — result first, a visual change in frame one, and a promise of how.
> 3. No — a greeting, not a question or a promise.
> 4. Yes, if the video explains it honestly (battery percentage readings drift in the cold). A hook that the video
>    doesn't pay off is clickbait — viewers punish it with swipes.

## You're done when…

- [ ] You can name three hook types and the safe zones from memory.
- [ ] Three hook variants are rendered; the best is uploaded with your ranked list.
- [ ] One variant is published; link pasted.
- [ ] Quiz done.

**Tomorrow:** you'll explain an idea with pictures, not just words — an animated explainer.
