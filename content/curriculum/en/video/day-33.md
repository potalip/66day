---
day: 33
track: video
phase: 2
title: "Pipeline v1: one command, one finished video"
summary: "Wire everything you've built into make-video \"topic\": storyboard, voice, visuals, captions, music and render, with caching per stage."
estMinutes: 120
badges: [pipeline-architect]
resources:
  - "https://www.anthropic.com/engineering/building-effective-agents"
  - "https://www.remotion.dev/docs/"
  - "https://ffmpeg.org/documentation.html"
  - "https://12factor.net/"
tasks:
  - id: d33-video-t1
    type: read
    title: "Learn pipeline basics: stages, caching and failure"
    xp: 10
    proof: none
  - id: d33-video-t2
    type: build
    title: "Run the whole pipeline with one command and upload the mp4"
    xp: 80
    proof: file
  - id: d33-video-t3
    type: build
    title: "Write the README: inputs, outputs, cost per video"
    xp: 20
    proof: text
  - id: d33-video-t4
    type: reflect
    title: "Name the weakest stage and why"
    xp: 15
    proof: text
---

For eighteen days you've built parts: TTS on day 22, captions on 23, a screenwriter on 31, a brand kit yesterday. Today
they become a machine. You type `make-video "why cats knock things off tables"` and, a few minutes later, a finished,
branded, captioned, scored video appears. This is what our Studio does — and by tonight you'll have your own.

## Stages, caching, failure

A **pipeline** is a chain of stages where each one reads files and writes files:

| # | Stage | Reads | Writes |
|---|---|---|---|
| 1 | brief | topic, flags | `brief.json` |
| 2 | storyboard | brief | `storyboard.json` (day 31) |
| 3 | voice | storyboard | `vo/scene-01.mp3…` + real durations (day 22) |
| 4 | visuals | storyboard, durations, brand | `scenes/scene-01.mp4…` (day 32 components; AI clips optional, day 29) |
| 5 | edit | everything above | `edl.json` → `edit.mp4` (day 30) |
| 6 | captions | voice | `words.json` → burned captions (day 23) |
| 7 | music | edit | mixed audio at −14 LUFS (day 20) |
| 8 | render | all | `final.mp4` |

Three ideas make it professional:

- **Files between stages.** Every stage leaves its output in `runs/<slug>/`. You can open any file and see exactly where
  things went wrong. No hidden state.
- **Caching.** Each stage computes a *key*: a hash of its inputs plus its settings. If the key matches last time and the
  output exists, the stage is skipped. Fix a typo in scene 4's voiceover and only scene 4's voice, the edit and the render
  rerun; the expensive AI clips don't. This is what keeps cost per video low.
- **Fail loudly, resume cheaply.** If stage 5 crashes, the message names the stage and the file, and the next run
  starts from stage 5 because 1–4 are cached.

One subtle but crucial detail: **real voice durations win.** The storyboard *guessed* that scene 2 lasts 4 s; the TTS
file says 4.6 s. Stage 3 writes the real durations back, and every later stage uses those. Otherwise captions and visuals
drift out of sync.

## Step by step

### 1. Skeleton first, then wire stages one by one

Don't ask the agent for all eight stages in one go. First the skeleton with fake stages, then real ones:

```text
Goal: a CLI `make-video "topic"` that runs an 8-stage video pipeline (brief, storyboard, voice, visuals, edit,
captions, music, render) and writes everything to runs/<slug>/.
Context: my video workspace already has: storyboard.py (day 31), my TTS script (day 22), Whisper captions (day 23),
edit.py with EDL (day 30), brand kit components (day 32), gen_clips.py (day 29), music mixing (day 20). Read them first
and list what each one's inputs and outputs are before writing code.
Step 1 only: build the orchestrator with each stage as a function stub that writes a placeholder file.
- Each stage declares inputs, outputs, and computes a cache key = sha256(inputs' contents + stage settings + STAGE_VERSION).
- Keys stored in runs/<slug>/cache.json. Skip a stage if its key matches and outputs exist; print "cached".
- Flags: --from <stage>, --force <stage>, --seconds 45, --aspect 16:9, --ai-clips (off by default), --brand <file>.
- run.json logs every stage: status, seconds taken, estimated cost.
- Install it as a command (pyproject [project.scripts] with uv, or a small shell wrapper).
Done when: make-video "test" runs all stubs, and a second run prints "cached" for every stage.
```

Then, one message per stage: *"Now make stage 3 real: call my TTS script per scene, cache per scene, write real
durations back into storyboard.resolved.json."* Test each stage before moving on. That's how pros work with agents:
small verified steps.

> **If you're stuck:** if a stage reruns every time, its cache key includes something that changes on every run — a
> timestamp, a temp path, a random seed. Ask the agent to print the key's ingredients. If a stage never reruns after you
> changed it, bump its `STAGE_VERSION`.

> **No API key?** Every stage needs a fallback: fixture storyboard, a local TTS like Piper or a pre-recorded VO, template
> visuals instead of AI clips. The pipeline must finish end to end with zero keys. Print "AI not configured" and carry on.

### 2. The real run

```bash
make-video "why cats knock things off tables" --seconds 45
```

Watch the terminal: which stages take longest? Then watch `final.mp4` once, fully. Upload it. It doesn't have to be your
best video ever; it has to be made by one command.

Now prove the cache works: edit one `vo` line in `runs/<slug>/storyboard.json` and run with `--from voice`. Only a
handful of stages should do work.

### 3. README with honest numbers

```text
Write README.md for my pipeline: what it does in one sentence; install steps; required and optional env vars (names
only, never values); the command with all flags and examples; a table of stages with inputs/outputs; where outputs go;
how caching works and how to force a rerun. Add "Cost per video": read run.json from my last 3 runs and compute
average time and API cost per stage and in total.
```

Paste the inputs/outputs section and the cost table. A typical finding: *"45-s video in 3 min 40 s; script and voice
cost a few cents, and three AI clips cost more than every other stage combined."* Your numbers will differ — that's
why you measure instead of guessing.

### 4. Weakest link

Which stage produced the thing you'd be most embarrassed to show? Robotic voice, generic visuals, captions out of sync,
a boring hook? Write 3–4 sentences: the stage, the symptom, and one idea to fix it. This is your to-do list for day 34
and beyond.

## You're done when…

- [ ] You can explain stages, cache keys and "resume from the failing stage".
- [ ] `make-video "<topic>"` produced `final.mp4`, uploaded; a rerun skips cached stages.
- [ ] README with inputs, outputs and a measured cost-per-video table is pasted.
- [ ] Weakest stage named, with a symptom and a fix idea.

You've earned **pipeline-architect**. Tomorrow one master becomes three formats and a thumbnail.
