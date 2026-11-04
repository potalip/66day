---
day: 37
track: video
phase: 3
title: "Read the numbers, fix the first three seconds"
summary: "Find the exact second viewers leave two of your videos, map it to a scene, and re-cut the weakest opening through your pipeline."
estMinutes: 75
resources:
  - "https://developers.google.com/youtube/v3"
  - "https://www.remotion.dev/docs/"
tasks:
  - id: d37-video-t1
    type: read
    title: "Learn retention curves, hook rate and CTR"
    xp: 10
    proof: none
  - id: d37-video-t2
    type: build
    title: "Write retention notes for 2 of your videos"
    xp: 30
    proof: text
  - id: d37-video-t3
    type: build
    title: "Re-cut the weakest first 3 seconds and upload v2"
    xp: 50
    proof: file
  - id: d37-video-t4
    type: reflect
    title: "Decide what you'll test next"
    xp: 15
    proof: text
---

You've published a short on day 24, an explainer on day 27 and a test upload yesterday. Each of them has been quietly
collecting data on the one thing that matters: when people stopped watching. Today you read that data like an editor,
not like a gambler refreshing a view counter — and you fix one opening with a single storyboard edit.

## Three numbers that matter

- **CTR (click-through rate)** = clicks ÷ impressions. Of the people who *saw* your thumbnail and title, how many
  clicked. It judges the packaging, not the video. Low CTR? Fix the thumbnail and title (day 34), not the edit.
- **Hook rate** = viewers still there at second 3 ÷ viewers who started. It judges your first 3 seconds. On YouTube
  Shorts, Studio shows a similar split as "viewed vs swiped away". If half the people are gone by second 3, nothing
  after that matters yet.
- **Retention curve**: the percentage of viewers still watching at each moment. Every curve drops at the start; what you
  look for is its *shape*:
  - a **cliff** in the first seconds = the opening broke a promise or bored people;
  - a **sudden step down** mid-video = a specific scene (a slow title card, a confusing diagram);
  - a **bump up** = people rewound to rewatch — that's a moment worth copying;
  - a **gentle slope** = normal. Don't chase it.

**Small numbers lie.** With 40 views, one friend who closed the tab moves the curve 2.5%. If your numbers are small,
treat them as hints and combine them with your day-27 habit: watch someone watch. Still useful: the *location*
of the drop is often right even when the percentages are noisy.

Where to look: YouTube Studio → the video → Analytics → Engagement (audience retention) and Reach (impressions, CTR).
TikTok and Instagram show a similar retention graph in each post's insights. If your channel has enough views, the
YouTube Analytics API can return the curve as data, so a script can read it.

## Step by step

### 1. Map the drops to scenes

Your storyboard knows exactly which scene is on screen at every second. That's a superpower most creators don't have.

```text
Goal: retention.py that maps audience drop-offs to storyboard scenes.
Input: a retention CSV (time_s, percent_watching) — exported from the platform's analytics, typed in by hand from the
graph (10-12 points is enough), or fetched via the YouTube Analytics API (metric audienceWatchRatio by
elapsedVideoTimeRatio; needs the yt-analytics.readonly OAuth scope, separate from day 36's upload token) if I pass
--youtube <videoId>. Plus runs/<slug>/storyboard.resolved.json.
Output:
- out/retention.png: the curve with scene boundaries as vertical lines and scene ids on top.
- A table: the 3 steepest drops (percentage points lost per second), with time, scene id, that scene's vo line and visual.
- Hook rate estimate: percent at 3 s.
Constraints: work with as few as 6 data points; say clearly when the data is too sparse to trust.
Done when: python retention.py data/explainer.csv runs/<slug> prints the table and saves the chart.
```

Run it for two videos. Then write retention notes, 3–4 lines per video: hook rate, the biggest drop, which scene it
falls in, and your guess at *why*. Example: *"Explainer: 52% at 3 s. Biggest drop 0:02–0:05, scene 1 — a 3-second logo
sting before anything happens. Second drop at 0:31, the chart with five lines nobody can read."*

> **If you're stuck:** if your platform shows no retention graph yet (too few views), use a "watch test": play the video
> to two people and note the second each of them looks away or reaches for their phone. Feed those times in as your
> data points. Honest data beats no data.

### 2. Re-cut the weakest opening

Pick the video with the worse hook rate. The fix for the first 3 seconds is almost always one of these:

- **Start with the most interesting frame**, not the logo. Move the sting to the end card.
- **Text on screen in frame 1** that states the promise ("Your cat isn't clumsy. It's testing you.").
- **Cut the warm-up**: "Hi, in this video…" is where people leave.
- **Motion from frame 1**: a static first frame reads as a photo, and thumbs keep scrolling.

Change the opening scene in the storyboard, not in a timeline:

```text
In runs/<slug>/storyboard.json, rewrite scene 1 for a stronger first 3 seconds: start on the visual of scene <N>,
put the promise as on_screen_text in frame 1, remove the logo sting from the start (keep it on the end card).
Keep the rest of the video unchanged. Re-render with make-video --from storyboard and save as final-v2.mp4.
Also render out/hook-compare.mp4: v1 and v2 first 5 seconds side by side.
```

Watch `hook-compare.mp4`. Would *you* keep watching v2? Upload `final-v2.mp4` (and publish it as a new upload if you
want real numbers to compare — a re-upload gives you a clean experiment).

### 3. Next test

One hypothesis, one change, one metric. Write it like this: *"If I open on motion instead of a title, the hook rate of my
next short will go above 60%."* Two or three sentences, including how many views you need before you believe the answer.

## You're done when…

- [ ] You can explain CTR, hook rate and the four retention-curve shapes.
- [ ] Retention notes for two videos (hook rate, biggest drop, scene, why) are pasted.
- [ ] The re-cut v2 with a new first 3 seconds is uploaded.
- [ ] Your next test is written as a hypothesis with a metric.

Tomorrow: one-offs become a series — fifty episodes from one template, if you want them.
