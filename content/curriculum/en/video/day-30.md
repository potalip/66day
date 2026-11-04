---
day: 30
track: video
phase: 2
title: "Edit with code: the timeline is a JSON file"
summary: "Cut AI clips, renders and voiceover into a 30-second edit from one JSON file — then re-cut the whole thing by changing one line."
estMinutes: 90
resources:
  - "https://ffmpeg.org/documentation.html"
  - "https://trac.ffmpeg.org/wiki"
  - "https://zulko.github.io/moviepy/"
tasks:
  - id: d30-video-t1
    type: read
    title: "Understand edit decision lists and why editors love them"
    xp: 10
    proof: none
  - id: d30-video-t2
    type: build
    title: "Edit AI clips and voiceover from an EDL JSON into a 30-s video"
    xp: 60
    proof: file
  - id: d30-video-t3
    type: build
    title: "Change one line of the EDL and re-cut"
    xp: 30
    proof: text
  - id: d30-video-t4
    type: quiz
    title: "Quiz: cut, J-cut, L-cut"
    xp: 15
    proof: none
---

Yesterday you got three good-looking clips. Today they become an edit — not by dragging blocks along a timeline, but
by writing the timeline down as data and letting a script render it. This is the moment your videos stop being
one-offs: anything described in JSON can later be written by an LLM, versioned in git, and re-rendered in a minute.

## Edit decision lists

Film editors have used an **EDL** (edit decision list) for decades: a plain list saying "take clip A from 00:02 to 00:06,
then clip B from 00:01 to 00:05, dissolve for 12 frames". The editing software is just a machine that executes the list.
You're building that machine.

Your EDL needs four ideas:

- **Source in/out:** which part of each clip to use (`in: 0.5, out: 4.5` = the 4 seconds starting half a second in).
  AI clips often wobble in the first and last half-second, so trimming them is free quality.
- **Transitions:** a hard **cut** (default, use it 90% of the time) or a short **crossfade** (0.3–0.6 s, for a change of
  time or place).
- **Audio layers:** voiceover on top, music underneath and ducked (lowered) while the voice speaks, ambient clip sound
  quieter still.
- **J-cut and L-cut:** the sound and picture of a cut don't have to change at the same moment. In a **J-cut** you hear
  the next scene before you see it (rain starts, *then* we see the street). In an **L-cut** the sound of the current
  scene carries on over the next picture. They make code-made edits feel human instead of slideshow-like.

Here's the shape you're aiming for:

```json
{
  "fps": 30, "width": 1920, "height": 1080,
  "voiceover": { "src": "vo/explainer.mp3", "start": 0.4 },
  "music": { "src": "music/calm.mp3", "gain_db": -20, "duck_db": -8 },
  "clips": [
    { "src": "clips/s1_v2.mp4", "in": 0.5, "out": 5.0 },
    { "src": "renders/title.mp4", "in": 0.0, "out": 3.0, "transition": { "type": "fade", "dur": 0.4 } },
    { "src": "clips/s2_v1.mp4", "in": 1.0, "out": 7.0, "audio_lead": 0.6 },
    { "src": "renders/chart.mp4", "in": 0.0, "out": 9.0, "audio_tail": 0.8 },
    { "src": "clips/s3_v3.mp4", "in": 0.3, "out": 6.0, "transition": { "type": "fade", "dur": 0.5 } }
  ]
}
```

`audio_lead` makes a J-cut (this clip's sound starts early), `audio_tail` an L-cut (its sound keeps going).

## Step by step

### 1. Build the editor

Work in `~/66/video/pipeline/` (set up yesterday). Your three AI clips are already in `clips/`; copy two code renders
from earlier days into `renders/` (say `day16/title_card.mp4` and `day26/chart.mp4`) and a voiceover from day 22 or 27
into `vo/`. Then:

```text
Goal: a Python script edit.py that renders edl.json into out/edit.mp4.
Context: my pipeline/ folder; clips in clips/, code renders in renders/, voiceover in vo/. ffmpeg is installed.
Use the EDL shape from the JSON I paste below. You may use MoviePy 2 (note: v2 uses subclipped/with_start, not subclip/set_start) or build an ffmpeg filter_complex in Python — pick one and say why.
Constraints:
- Scale/pad every clip to the EDL size and fps, so mixed sources never break the render.
- Transitions: cut by default; "fade" = video crossfade + audio crossfade of the same duration.
- audio_lead / audio_tail implement J- and L-cuts on the clips' own audio, mixed at -18 dB under the voiceover.
- Music under everything, ducked by duck_db while the voiceover plays; final loudness about -14 LUFS.
- Validate the EDL first: missing files, out <= in, out beyond clip length → clear error naming the clip index.
- Print a timeline table (index, start, end, source) and warn if total length differs from the voiceover by > 1 s.
Done when: python edit.py edl.json renders a ~30-s mp4 and prints the timeline table.
```

Look at the timeline table before you watch anything. If clip 3 starts at 14.6 s but your voiceover starts talking about
it at 12 s, the fix is a number in the JSON, not a re-render-and-pray.

> **If you're stuck:** crossfades that land in the wrong place are almost always offset math. With ffmpeg's `xfade`,
> each `offset` is the running total of previous durations minus all previous fade durations. Ask the agent to print
> every computed offset next to the clip it belongs to. A black flash between clips usually means one source has a
> different fps or pixel format — normalise everything (`fps=30,format=yuv420p`) first.

> **Tip:** commit `edl.json` to git together with the render. Next month you'll be able to `git diff` two versions of
> an edit, which no timeline app will ever give you.

### 2. Watch it like a stranger

Play the mp4 once without stopping. Note the single worst moment: a cut that comes too late, a clip that's on screen
longer than its idea, a fade that feels like a PowerPoint. Upload `edit.mp4` and the `edl.json` as today's proof.

### 3. Re-cut by changing one line

Now fix that worst moment by editing **one line** of the EDL: shorten an `out`, swap two clips, turn a fade into a cut,
or add an `audio_lead` to the scene that felt abrupt. Re-render. Paste the line before and after, plus one sentence on
how the edit changed. Example: *"clip 2 `out` 3.0 → 2.2: the title no longer overstays and the first AI shot now lands
exactly on 'imagine'."*

## Quiz

1. A scene goes from a quiet office to a busy street. We hear the traffic half a second before the street appears.
   What's that called?
2. Which EDL field would you change to make it an L-cut instead?
3. Why trim the first and last half-second of most AI clips?
4. Your total edit is 33 s, the voiceover is 29 s. Name two one-line fixes.

> **Answers:**
>
> 1. A J-cut (`audio_lead` on the street clip).
> 2. `audio_tail` on the office clip: its sound continues over the street picture.
> 3. Generated clips often start and end with a warp, a freeze or a drift in style. Trimming them is free quality.
> 4. Shorten the `out` of the longest clip, or delete a clip that repeats an idea. (Or add 4 s of VO, if the story needs it.)

## You're done when…

- [ ] You can explain in-points, out-points, cuts, crossfades, J-cuts and L-cuts in your own words.
- [ ] `edit.mp4` (~30 s) and its `edl.json` are uploaded.
- [ ] You pasted the one line you changed, before and after, with what it fixed.
- [ ] Quiz answered.

**Tomorrow:** an LLM writes the script and storyboard — as JSON your editor can eat.
