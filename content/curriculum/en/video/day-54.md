---
day: 54
track: video
phase: 4
title: "Test audience: find where they drop"
summary: "Five real viewers watch your capstone; you find the exact second they drift away and fix it in a v2."
estMinutes: 90
resources:
  - "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started"
  - "https://developers.cloudflare.com/workers/"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d54-video-t1
    type: ship
    title: "Get 5 viewers to watch and log where they dropped"
    xp: 60
    proof: text
  - id: d54-video-t2
    type: build
    title: "Fix the top issue and export a v2 mp4"
    xp: 40
    proof: file
  - id: d54-video-t3
    type: reflect
    title: "Decide what you will not fix before launch"
    xp: 15
    proof: text
---

Yesterday you watched your own video three different ways. But you know what it's *supposed* to say, so your brain
fills every gap. Five fresh viewers can't do that. Film studios call this a **test screening**: before the premiere,
show the cut to a small audience and watch them, not the screen.

## Retention, by hand

On day 37 you read retention curves in a platform's analytics. With only five viewers, those curves are noise — so
today you measure retention the old-fashioned way: **the second someone stops paying attention**. The signals:

- they glance at their phone or another tab;
- they ask "how long is this?";
- they reach for the scrubber to skip ahead;
- they say "okay, I get it" before the end.

Each signal gets a timestamp. Five viewers, five timestamps (or "watched to the end"). If three of them drift around
0:41, that's not taste — that's your video.

## Step by step

### 1. Pick five and set the scene (15 min, plus waiting)

Five people who match the audience in your day 50 spec. If your capstone is a **series**, show the episode you craft-passed yesterday. If it's a
**tool**, have them *use* it to make one video and then watch the result. If it's a **showreel**, show it to people
who hire — a small-business owner, a marketer, a creator you know.

Ask, don't beg:

> Hi Mira — I'm finishing a [series about X / tool that makes Y / reel]. Could you watch 2 minutes of it and tell me
> honestly where you got bored? There's no wrong answer — the moment you'd scroll away is exactly what I need.

Best: watch live, in person or on a video call with screen sharing. Say one sentence and then nothing.

### 2. Optional: a drop-off logger (15 min)

Can't watch everyone live? Let the agent build a tiny watch page:

```text
Goal: a private watch page that tells me where each test viewer stopped watching.
Build a single static page with an HTML <video> element for [video url], a "name" field, and one big button:
"I'd scroll away here". Log: viewer name, the furthest second reached, every pause/seek with its timestamp, and button presses with their timestamp. Send events to a tiny Cloudflare Worker that stores them in D1 (or KV), and give me a /report page listing each viewer's events in order.
Constraints: no third-party trackers; nothing stored beyond name + timestamps; one line on the page says exactly what is logged; the URL is unlisted.
Done when: I watch it myself, press the button at 0:12, and see that row on /report.
```

> **If you're stuck:** the Worker part fights you? Skip it. Send an unlisted link and ask each viewer to reply with
> one timestamp and one sentence. Five honest messages beat a dashboard nobody fills in.

### 3. Log who dropped where (15 min)

Collect everything in one table:

| Viewer | Dropped at | Signal | What they said |
|---|---|---|---|
| Mira | 0:41 | checked phone | "the chart part was long" |
| Tom | end | — | "the ending felt sudden" |

Then look for **clusters**: two or more drops within ~5 seconds of each other mark a weak spot. **Proof for task 1:**
paste the table (first names or initials only).

### 4. Fix the top issue in the pipeline (35 min)

Pick **one** — the biggest cluster. Typical causes and fixes:

- **Slow opening** → move the payoff line to the first 3 s; cut the intro card.
- **A long middle stretch** → split one long scene into two shorter beats, or add a visual change (zoom, new
  graphic) every 3–5 s.
- **Confusing moment** → one more caption or on-screen label, not more voiceover.
- **Abrupt ending** → a 2-second "what's next" card instead of a hard cut.

```text
Goal: fix the main retention problem in runs/<capstone>/<nn>/ (the output I tested) and render v2.
Evidence: 3 of 5 viewers drifted between 0:38 and 0:45 (table attached). Viewers said: [quotes].
Propose 2 options for fixing that stretch in the storyboard/EDL (with the new durations), wait for my choice, then apply it in the pipeline (not as a manual edit), re-render into the same folder with a -v2 suffix (e.g. final-9x16-v2.mp4), and run qc.py on it.
Done when: v2 is rendered, QC is clean, and the total runtime change is reported.
```

If you can, show v2 to one of the people who dropped. Did they get past the spot? **Proof for task 2:** attach v2.

> **Tip:** resist fixing the second and third issue today. One fix you can measure teaches you more than three you
> can't tell apart.

### 5. The "not now" list (10 min)

Some notes are real but not for this week: "maybe a different voice", "what if it were animated", "make it longer".
Write each down with a reason it waits. This list protects your launch from endless polishing. **Proof for task 3:**
the list and the item that hurts most to postpone.

## You're done when…

- [ ] Five real viewers watched; your drop-off table is pasted.
- [ ] The biggest weak spot is fixed in the pipeline and v2 is attached.
- [ ] You wrote what you will *not* fix before launch, and why.

**Tomorrow:** boss day. Premiere.
