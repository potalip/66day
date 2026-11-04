---
day: 44
track: video
phase: 3
title: "Screen tutorials that zoom themselves"
summary: "Record a 60-second tutorial once; code adds the zooms, callouts, chapters and description for you."
estMinutes: 90
resources:
  - "https://www.remotion.dev/docs/"
  - "https://playwright.dev/"
  - "https://github.com/SYSTRAN/faster-whisper"
tasks:
  - id: d44-video-t1
    type: read
    title: "Learn what makes a screen tutorial watchable"
    xp: 10
    proof: none
  - id: d44-video-t2
    type: build
    title: "Render a 60-second tutorial with automatic zooms and callouts"
    xp: 60
    proof: file
  - id: d44-video-t3
    type: build
    title: "Generate chapters and a description from the transcript"
    xp: 20
    proof: text
  - id: d44-video-t4
    type: quiz
    title: "Zoom or cut? Decide for four moments"
    xp: 15
    proof: none
---

Raw screen recordings are a 1920-pixel desert with a tiny cursor somewhere in it. On a phone, nobody can read the
button you clicked. Editors fix this by zooming in by hand, click after click. You'll make code do it: log every click,
then let the renderer push in, highlight and pull back out. The subject is your own pipeline web form from day 40.
Went the Telegram-bot route on day 40? Ask the agent for a one-page local form in front of `make-video` (about
10 minutes of its work), or record any web tool you know well.

## What makes a tutorial watchable

1. **One outcome, stated in the first five seconds.** "In 60 seconds you'll render a video from a topic."
2. **The eye always knows where to look.** Zoom to the action, then return to the full screen so viewers keep their
   bearings. A soft highlight or arrow beats a red circle that screams.
3. **No dead air.** Loading spinners get cut or sped up. Typing gets sped up 2–4x.
4. **Readable at phone size.** At 1080p, UI text is often 12–14 px. A 1.8–2.2x zoom makes it legible.
5. **Chapters** so people jump to the step they need. YouTube needs the first chapter at `0:00`, at least three
   chapters, each at least 10 seconds long.

## Step by step

### 1. Record with a click log

Two routes. **Scripted (recommended):** a Playwright script drives your web app, records the browser video, and logs
the timestamp and on-screen box of every action. No sync problems, and you can re-record in one command when the UI
changes. **Manual:** record with OBS (free, any OS) while a small Python script with `pynput` logs your clicks; click
once in a corner at the start so you can line up both clocks.

```text
Goal: a 60-second screen tutorial of my pipeline web form, with automatic zooms and callouts.
Context: the web app runs locally (see README). Remotion is set up from earlier days. Voiceover uses my TTS stage.
Steps:
1. record.ts (Playwright): open the app at 1920x1080, record video, perform: type a topic, pick a format,
   click Render, wait for the result, click the video. For each action log {t_ms, x, y, w, h, label} to clicks.json.
   Speed: realistic typing, 600 ms pause after each click.
2. A Remotion composition takes the recording + clicks.json and, for each click, zooms to 2x centred on the target
   over 12 frames with easing, holds, and eases back out before the next action. Clamp the zoom window to the frame.
3. A callout component shows the action label next to the target (brand font and colours), fading in with the zoom.
4. Cut or 4x speed-up any segment longer than 2 s where nothing changes on screen (compare frames).
5. Short VO from my TTS stage; burned captions from my caption stage. Export 1920x1080 and a 1080x1920 version.
Done when: out/tutorial.mp4 is about 60 s, every click is zoomed and labelled, nothing jitters.
```

If you'd rather stay in ffmpeg, `scale` with `eval=frame` (the zoom) plus a `crop` whose x and y
follow time (the pan) can do the same job; easing is just more painful to write. `zoompan` looks like the obvious
filter, but it was built for still images and often wobbles on moving video because it snaps to whole pixels. Remotion keeps the zoom as React math you already know from days 18–19.

> **If you're stuck:** zoom lands next to the button, not on it? Your coordinates are in a different space: CSS pixels
> vs video pixels, or a device scale factor of 2. Ask the agent to draw a red dot at each logged point on a frame grab
> before any zooming. Fix the dot, and the zoom follows.

> **Tip:** zoom on *intent*, not on every event. Three clicks in the same panel = one zoom that holds.

Upload `tutorial.mp4` as proof.

### 2. Chapters and description from the transcript

```text
Goal: YouTube-ready chapters and a description for out/tutorial.mp4.
Steps: transcribe with faster-whisper (segment timestamps) to transcript.json. Send the transcript to the LLM:
group it into 3-5 chapters, each at least 10 s, first one at 0:00, titles of max 5 words in the viewer's
language. Then write a 2-sentence description, the chapter list, and one line about what tool is shown.
Validate in code: first chapter 0:00, ascending, >= 10 s apart. Print the result to paste.
Done when: the block pastes straight into a YouTube description and the chapters show up.
```

Paste the generated chapters and description.

## Quiz

1. A 40-second segment of the user typing a long prompt. Zoom, cut or speed up?
2. The user clicks Render, then a 25-second progress bar. What do you do?
3. Three quick clicks in the same settings panel, 1.5 s apart. Three zooms or one?
4. A result appears at the opposite corner of the screen from the last zoom. Pan, or zoom out and back in?

<details><summary>Answers</summary>

1. Speed up 3–4x with a zoom on the text field, so viewers see the prompt forming but don't wait for it.
2. Cut most of it: keep a second of the bar, a "fast-forward" label or a jump cut, then the result.
3. One zoom framing the whole panel, held across the three clicks. Pumping in and out three times is seasickness.
4. Zoom out briefly, then in. A long diagonal pan at 2x loses the viewer; the wide shot re-orients them.

</details>

## You're done when…

- [ ] You can list the five rules of a watchable tutorial.
- [ ] A ~60-second tutorial with automatic zooms and callouts is uploaded.
- [ ] Generated chapters and a description are pasted, starting at 0:00.
- [ ] Quiz answered without peeking (mostly).

Tomorrow: the same video, in a second language, without hiring a voice actor.
