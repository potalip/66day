---
day: 50
track: video
phase: 3
title: "Capstone: pick it, spec it, say it out loud"
summary: "Choose your capstone (a series, a video tool or a client-grade reel), write a spec with milestones to day 65 and announce it."
estMinutes: 90
resources:
  - "https://www.remotion.dev/docs/"
  - "https://developers.google.com/youtube/v3"
  - "https://news.ycombinator.com/showhn.html"
tasks:
  - id: d50-video-t1
    type: read
    title: "Learn what makes a good video capstone"
    xp: 10
    proof: none
  - id: d50-video-t2
    type: build
    title: "Write the spec: audience, format, deliverables, milestones"
    xp: 50
    proof: text
  - id: d50-video-t3
    type: build
    title: "List your risks and kill criteria"
    xp: 20
    proof: text
  - id: d50-video-t4
    type: share
    title: "Announce your capstone publicly"
    xp: 20
    proof: link
---

Fifty days ago you hadn't rendered a single frame. Now you have a pipeline, a series format, a client pack, dubbing,
clipping and QC. The capstone is where it all points at one thing you launch on day 65 and show for years. Today you
decide what that thing is, and you write it down so firmly that future-you can't wriggle out of it.

## What makes a good video capstone

Pick one of three shapes:

| Shape | What you launch on day 65 | Good if… |
|---|---|---|
| **A series** | 3–5 episodes of one format plus a trailer: at least 3 public, the rest scheduled | you want an audience or a channel |
| **A video tool** | your pipeline as a product: web app, bot or CLI that makes one kind of video for others | you like building more than posting |
| **A client-grade showreel** | 3–5 finished pieces in different styles, made for or with real businesses, plus a 60–90-s reel cut from them | you want paid video work soon |

A good capstone, whichever shape:

- **Uses the pipeline.** If episode 3 takes as long as episode 1, it isn't a pipeline project yet.
- **Has a real viewer or user.** A named audience ("solo bakers on Instagram", "Python beginners"), not "everyone".
- **Is small enough to finish.** Days 51–65 hold nine capstone days of about two hours each,
  with rest days and the earning block (days 56–60) in between. Scope for 70% of your energy; the last 30% goes to polish and things breaking.
- **Shows range.** It should use at least three things from days 29–47 (AI clips, dubbing, clipping, QC, publishing API).

Examples: a 6-episode explainer series "Money basics in 60 seconds" in English and Spanish; a Telegram bot that turns
a podcast episode into three captioned shorts; a reel for three local businesses (gym promo, café menu loop,
dentist explainer).

## Step by step

### 1. Write the spec

Talk it through with the agent, but you make the calls.

```text
Help me write a one-page capstone spec. Ask me questions one at a time until you can fill in:
- Shape: series / tool / showreel, and why this one
- Audience: who exactly, where they watch
- Format: length, aspect ratios, style, language(s), platform(s)
- Deliverables on day 65: what exists, where, how many
- Pipeline changes needed (new stages, templates)
- Milestones: day 51 first full output; day 52 outputs 2-3 + time and cost per video; day 53 craft pass + clean QC;
  day 54 five test viewers; day 55 public premiere; day 58 (common day) a 60-90 s demo or reel;
  day 61 productize; day 62 trailer + channel plan; day 64 final masters (series: episodes 4-5 through the
  batch if scope allows); day 65 launch
- Success metric for day 65 (one number) and how I'll measure it
Push back if the scope doesn't fit nine build days of ~2 hours. Output Markdown.
```

Save it as `CAPSTONE.md` in your repo. Paste it as proof.

> **If you're stuck** between two ideas: write the day-65 announcement post for each, three sentences. The one you'd
> be prouder to post wins. Still tied? Pick the one with a real person waiting for it.

### 2. Risks and kill criteria

Name 3–5 risks with a plan each, and **kill criteria**: conditions under which you cut scope instead of pushing harder.

```text
Risks: AI clip provider changes pricing -> fallback: motion-graphics scenes only.
       Client for reel piece 3 goes silent -> replace with a self-initiated brief by day 53.
Kill criteria: if episode 2 takes over 2 hours of manual fixes, cut to 3 episodes and fix the pipeline first.
               if cost per video exceeds my budget by day 52, switch TTS/video tier or drop AI clips.
```

Kill criteria aren't pessimism. They're how professionals ship on time.

### 3. Announce

Post where your audience is: X, Threads, LinkedIn, a YouTube community post, your build log, or Show HN later if it's
a tool. Say what, for whom, and the launch date. Public dates get finished.

## You're done when…

- [ ] You picked a shape and can say why in one sentence.
- [ ] `CAPSTONE.md` with audience, format, deliverables and milestones to day 65 is pasted.
- [ ] Risks with fallbacks and at least two kill criteria are written.
- [ ] The public announcement link is pasted.

Tomorrow: the first full output, start to finish.
