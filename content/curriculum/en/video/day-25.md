---
day: 25
track: video
phase: 2
title: "Animated explainers"
summary: "Storyboard one idea in six frames, then animate a 30-second explainer in Manim or Motion Canvas, timed to your voice."
estMinutes: 120
resources:
  - "https://docs.manim.community/"
  - "https://motioncanvas.io/docs/"
  - "https://platform.openai.com/docs/guides/text-to-speech"
tasks:
  - id: d25-video-t1
    type: read
    title: "Learn visual metaphors and step builds"
    xp: 10
    proof: none
  - id: d25-video-t2
    type: build
    title: "Animate a 30-second explainer of one concept"
    xp: 60
    proof: file
  - id: d25-video-t3
    type: build
    title: "Write a 6-frame storyboard in text first"
    xp: 20
    proof: text
  - id: d25-video-t4
    type: quiz
    title: "Practise show, don't tell"
    xp: 15
    proof: none
---

The best explainer videos don't *tell* you how something works — they let you watch it work. A sorting algorithm
becomes bars swapping places; compound interest becomes a snowball. Today you make one of those, and you'll find the
hard part isn't the code: it's deciding what to draw.

## Visual metaphors and step builds

**A visual metaphor** maps an abstract idea onto something you can see change. Ask: *what moves, grows, splits or
connects in this idea?* Then draw exactly that, and nothing decorative.

**A step build** reveals one element at a time, in the order the viewer needs it. Never show the finished diagram
first — a full diagram is a wall; a diagram that builds is a story.

Three rules that keep explainers clear:
1. **One idea per scene.** If a frame needs two sentences of voiceover, it's two frames.
2. **Transform, don't replace.** When A becomes B, morph it. The viewer's eye keeps track of what changed.
3. **The voice and the picture say the same thing at the same time.** If the voice says "half", something on screen
   halves at that moment.

### Two tools built for this

- **Manim** (Community Edition) — Python. Created by the 3Blue1Brown channel for maths videos, great for diagrams,
  graphs, equations and any "this turns into that" animation. It draws with Cairo — the same library you used on
  day 16.
- **Motion Canvas** — TypeScript, with a live editor in the browser and a timeline you can sync to audio. Great if you
  liked Remotion's web workflow.

Pick one. If unsure, take Manim: you already know Python.

```bash
# in ~/66/video with the venv active (day 15)
pip install manim
manim --version
```

> **If you're stuck:** Manim needs Cairo and Pango system libraries on some systems. Follow the installation page for
> your OS in the Manim docs (it has exact commands for macOS, Windows and Linux), and give your agent the full error.
> You don't need LaTeX unless you write maths formulas.

## Step 1 — storyboard first (task 3)

Yes, the app lists it third. Do it first anyway: ten minutes of storyboard saves an hour of re-animating. Choose one
concept you can explain in 30 seconds. Example: **"How binary search finds a word in a 1,000-page dictionary in ten
steps."**

```text
Goal: a 6-frame text storyboard for a 30-second animated explainer.
Context: concept "<your concept>". Audience: curious beginners. It will be animated in Manim.
Constraints:
- Exactly 6 frames. For each: frame number, duration in seconds (total 30), what is ON SCREEN (shapes, positions, colours), what CHANGES (the animation), and the voiceover line (max 15 words).
- One idea per frame. Frame 1 is a hook. Frame 6 is the payoff in one image.
- Use a single visual metaphor throughout, and transform objects between frames instead of replacing them.
Done when: someone could draw each frame from the description alone.
```

Read it critically: can you picture every frame? Is any frame just text on screen? Replace it with something that
moves. Save as `day25/storyboard.md` and paste it.

## Step 2 — animate it

```text
Goal: a 30-second animated explainer from my storyboard, with voiceover.
Context: day25/storyboard.md. Manim CE installed. TTS script day22/tts.py, mixing script day20/mix.py.
Folder day25/.
Constraints:
- Generate one TTS file per voiceover line (cached) and write day25/durations.json with each line's length (ffprobe).
- day25/explainer.py: one Manim Scene. Each storyboard frame is a section whose animations' run_time plus wait equals that line's duration, so picture and voice stay in sync.
- Use Transform/ReplacementTransform between frames where the storyboard says objects change. A consistent palette: dark background, one accent colour, one highlight colour. Text with Text(), clear sans-serif font.
- Render 1920x1080 at 30 fps (manim -qh --fps 30). Concatenate the voice lines,
  mux them with the render, then run mix.py for music ducked under the voice at -14 LUFS.
Done when: day25/explainer.mp4 is ~30 s and each visual change happens when the voice describes it.
```

Preview fast while you iterate (`manim -pql day25/explainer.py Explainer` renders a low-quality draft), and render
high quality only at the end. Check the final:

```bash
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height -show_entries format=duration -of default=noprint_wrappers=1 day25/explainer.mp4
```

Watch it once **muted**: does the picture alone tell the story? Then once with **eyes closed**: does the voice alone
make sense? A good explainer passes both. Upload `explainer.mp4`.

> **Tip:** if a section feels slow, cut the wait, not the animation. Viewers forgive a quick move; they don't
> forgive staring at a finished diagram.

## Quiz

What would you *show* instead of writing the sentence on screen?

1. "The file is split into small chunks before it's sent."
2. "Prices went up by 40% over five years."
3. "Most of the work happens in the last step."
4. "Two systems talk to each other through an API."

> **Answers:**
>
> Many answers are good; here's one each.
> 1. A rectangle cracks into ten small blocks that fly off one by one.
> 2. A shopping basket whose price tag counts up year by year while the basket stays the same.
> 3. A progress bar that crawls through steps 1–4 and then jumps from 20% to 100% on step 5.
> 4. Two boxes with a narrow door between them; a labelled envelope passes through and a reply comes back.

## You're done when…

- [ ] Your 6-frame storyboard with durations and voice lines is pasted.
- [ ] `explainer.mp4` (~30 s, voice in sync, music ducked) is uploaded.
- [ ] It passes the muted test and the eyes-closed test.
- [ ] Quiz done.

**Tomorrow:** real data, moving — without lying.
