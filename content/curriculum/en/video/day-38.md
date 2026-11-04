---
day: 38
track: video
phase: 3
title: "A series is a template with a name"
summary: "Design a repeatable series format, render three episodes from one JSON file, and publish episode 1."
estMinutes: 120
resources:
  - "https://www.remotion.dev/docs/"
  - "https://www.json.org/json-en.html"
  - "https://developers.google.com/youtube/v3"
tasks:
  - id: d38-video-t1
    type: read
    title: "Learn why series beat one-offs"
    xp: 10
    proof: none
  - id: d38-video-t2
    type: build
    title: "Build a series template and render 3 episodes from JSON; upload one"
    xp: 60
    proof: file
  - id: d38-video-t3
    type: share
    title: "Publish episode 1"
    xp: 20
    proof: link
  - id: d38-video-t4
    type: reflect
    title: "Ask yourself honestly: could you make 50 of these?"
    xp: 15
    proof: text
---

One great video is a lottery ticket. A series is a channel. When people know what they'll get — the same length, the same
shape, the same little ritual at the end — they come back for it, the platform learns who to show it to, and you get faster
with every episode. And for you, unlike most creators, a series is cheap: it's one template plus a JSON file with a row
per episode.

## What makes a format

A **format** is everything that stays the same, so the content can be the only thing that changes. Write it down as a
one-page "format bible":

- **Name + promise** in one line: *"Tiny Origins — the surprising start of an everyday object, in 45 seconds."*
- **Fixed structure with timings:** cold open with the hook (3 s) → series sting (1 s) → the story in 3 beats (30 s) →
  the twist (8 s) → sign-off (3 s).
- **Recurring elements:** the same sting, the same sign-off line, an episode number in the corner, the same colour per
  segment. These are what people recognise in a feed before they read a word.
- **What varies:** the topic, the facts, the visuals, the twist.
- **A boundary:** what this series never does (no listicles, no opinions, no topics you can't source).

Good series formats for code-made video: "X in 45 seconds", "one chart a week", "myth vs fact", "word of the day",
"this day in history", "explain a term from your field". The best one is boring to describe and fun to watch.

Ask yourself one question before you build: **can I name 20 episodes right now?** If you get stuck at seven, the format
is too narrow.

## Step by step

### 1. Write series.json

```json
{
  "series": {
    "name": "Tiny Origins",
    "promise": "The surprising start of an everyday object, in 45 seconds.",
    "brand": "brand/brand.json",
    "structure": [
      { "segment": "cold_open", "seconds": 3 },
      { "segment": "sting", "seconds": 1 },
      { "segment": "story", "seconds": 30, "beats": 3 },
      { "segment": "twist", "seconds": 8 },
      { "segment": "signoff", "seconds": 3, "line": "Small things, long stories. See you next week." }
    ]
  },
  "episodes": [
    { "n": 1, "topic": "the QR code", "angle": "invented for car parts, not menus", "sources": [] },
    { "n": 2, "topic": "bubble wrap", "angle": "it was meant to be wallpaper", "sources": [] },
    { "n": 3, "topic": "the sticky note", "angle": "a glue too weak to work — until it was", "sources": [] }
  ]
}
```

Use your own series idea, of course — ideally on the topic your channel is about. Fill `sources` with at least one real
link per episode that you've opened and read yourself — the render refuses an episode with an empty list.

### 2. Teach the pipeline the format

```text
Goal: render a whole series from series.json with my make-video pipeline.
Context: pipeline from days 33-34, storyboard stage from day 31, brand kit from day 32. Read them first.
Build:
- A SeriesSting and an EpisodeBadge component (episode number, series name) from my brand kit.
- storyboard stage accepts --series series.json --episode N: the LLM must fill the fixed structure (segment names and
  seconds from series.json), use the episode's angle, and only state facts it can tie to the given sources.
  The signoff line is inserted verbatim, never rewritten by the model.
- Refuse to render an episode whose sources list is empty, with a clear message.
- render_series.py: renders all episodes (or --only 2), each into runs/<series-slug>/ep-0N/, reusing the cache.
  Shared assets (sting, music bed, brand) are rendered once.
- Print a summary table: episode, duration, render time, cost.
Done when: python render_series.py series.json produces three finished episodes that look like one show.
```

Watch all three back to back. Do they feel like the same show? If episode 2 feels different, find out why: usually the
model stretched a segment, or one episode had a different visual kind. Fix the template or the prompt, not the episode.
Upload one episode.

> **If you're stuck:** if the model ignores the fixed timings, validate the storyboard against series.json in code and
> feed the errors back once (the same trick as day 31). If the sign-off keeps getting "improved" by the model, don't
> ask the model for it at all — insert it in code after generation.

> **Tip:** put three or four future episodes in series.json as "drafts" now. Ideas come in batches; rendering can
> come later.

### 3. Publish episode 1

Run your day-36 publish stage on episode 1, with the series name and episode number in the title (*"Tiny Origins #1:
The QR code was made for car parts"*). Publish it publicly on your main platform — YouTube Shorts, TikTok, Reels, wherever
your audience is. Paste the link.

### 4. Could you make 50?

Be honest, in 4–5 sentences: how long did one episode take you, end to end, including fact-checking? What did it cost?
What would break first at episode 20 — ideas, sources, your patience, the budget, the format getting stale? What one
change would make 50 realistic?

## You're done when…

- [ ] You can describe your format in one line and name at least 20 possible episodes.
- [ ] Three episodes rendered from one `series.json`; one is uploaded.
- [ ] Episode 1 is published and the link is pasted.
- [ ] You wrote your honest "50 episodes" analysis.

Tomorrow: someone else's product. Promo and demo videos — the kind businesses actually pay for.
