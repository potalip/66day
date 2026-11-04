---
day: 52
track: video
phase: 3
title: "Capstone build 2: scale it and count the cost"
summary: "Push outputs 2 and 3 through the pipeline as a batch and measure exactly what each video costs in minutes and money."
estMinutes: 120
badges: [phase-3]
resources:
  - "https://docs.anthropic.com/en/api/getting-started"
  - "https://elevenlabs.io/docs"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d52-video-t1
    type: build
    title: "Produce outputs 2 and 3 through the pipeline"
    xp: 80
    proof: link
  - id: d52-video-t2
    type: build
    title: "Measure time and cost per video"
    xp: 20
    proof: text
  - id: d52-video-t3
    type: share
    title: "Post your progress with a clip"
    xp: 20
    proof: link
---

One video proves you can make it. Three videos prove you have a *system*. Today you find out whether your pipeline
really scales, or whether every episode is secretly a hand-made one with extra steps. And you'll get the two numbers
every client and every future you will ask: how long does one take, and what does it cost?

## Two kinds of cost

**Machine cost** is what the APIs and compute charge: LLM tokens, TTS characters, video-generation seconds, image
generations, render time if you rent a server. **Human cost** is your minutes: reviewing the script, fixing captions,
re-running a stage. For pricing your work, human minutes usually matter more. A video that costs pennies in API calls
but needs 90 minutes of fixes is not cheap.

Getting real numbers is easy if the pipeline logs them as it goes:

- **Time:** wrap each stage in a timer and log `stage, seconds, cache_hit`.
- **Usage:** most APIs return usage in the response (token counts from LLMs, character counts or audio length for
  TTS, seconds for video models). Log it per call.
- **Prices:** put the current rates from each provider's pricing page into `pricing.json` yourself, with the date you
  checked. Don't hard-code prices from memory, and don't trust the model to remember them either: they change.
- **Manual minutes:** yesterday's `manual.log`, kept honestly.

## Step by step

### 1. Batch outputs 2 and 3

```text
Goal: produce outputs 2 and 3 of my capstone in one batch run, and measure everything.
Context: format file formats/<capstone>.json and manual.log from day 51; pipeline stages in this repo.
Steps:
1. Add a batch command: make-video --format formats/<capstone>.json --batch inputs/batch-02.json (two inputs). Run stages per item; one item failing must not kill the other; resume from the failed stage using the cache.
2. Instrument every stage: wall-clock seconds, cache hit, and API usage from each response (tokens, TTS characters or seconds, video seconds). Write runs/<capstone>/<nn>/metrics.json.
3. Read prices from pricing.json (I fill it in from the providers' pricing pages, with a checked_on date) and compute machine cost per video and per stage.
4. Run QC on both. Upload the finals to an unlisted playlist or a shared folder via my publish stage.
5. Print a table: video, total minutes, machine cost, manual minutes, QC status.
Done when: both videos are rendered, QC'd, uploaded, and the table prints.
```

Before you start, fix the top two issues from yesterday's build log in the *pipeline*, not in the video. That's the
whole point of today.

> **If you're stuck:** the batch keeps redoing expensive stages after a crash? Your cache key is wrong. Make it a hash
> of the stage's *inputs* (script text, voice id, settings), not a timestamp or a random file name. Same inputs, same
> key, no second bill.

> **Tip:** compare manual minutes for output 1 vs outputs 2 and 3. Falling is the sign your pipeline is working. Flat
> means your fixes are going into videos instead of code.

Paste the playlist or folder link with all three outputs.

### 2. Time and cost per video

Paste the table and two lines of interpretation, for example:

```text
video | pipeline min | machine cost | manual min | QC
02    | 11.4         | $0.83        | 25         | PASS (1 WARN)
03    | 9.8          | $0.79        | 12         | PASS
Most expensive stage: AI clips (70% of cost). Most manual time: caption line breaks.
At 3 videos/week, machine cost is about $10/month; the real cost is 40 minutes of my time per video.
```

(Your numbers will differ; that's why you measure.) If you set kill criteria on day 50 around cost or manual time,
check them now and write the verdict.

### 3. Progress post

Post a 10–20 second clip from your best output with one real number: "Episode 3 took 12 minutes of my time, down from
40." Numbers make build-in-public posts worth reading. X, Threads, LinkedIn, Reels or YouTube Shorts. Paste the link.

## Phase 3 is done

You published through APIs, read retention, built a series, served your pipeline as an app, delivered to a client,
dubbed, clipped, QC'd and open-sourced. That's the job description of a video automation freelancer. The badge is
yours. Phase 4 turns it into a launch and a portfolio.

## You're done when…

- [ ] Outputs 2 and 3 came out of a batch run, passed QC, and the folder or playlist link is pasted.
- [ ] A time and cost table with your interpretation is pasted.
- [ ] Your progress post with a clip and one number is live.

Tomorrow: the craft pass, where good becomes good enough to launch.
