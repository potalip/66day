---
day: 13
track: common
phase: 1
title: "Foundation boss: one real person's problem"
summary: "Interview one real person, fix their annoyance with a small tool or a code-made video, hand it over, and get the verdict."
estMinutes: 150
boss: true
badges: [boss-foundation]
resources:
  - "https://developers.cloudflare.com/workers/"
  - "https://trac.ffmpeg.org/wiki"
  - "https://pixabay.com/music/"
tasks:
  - id: d13-t1
    type: build
    title: "Interview one person and write their problem in three lines"
    xp: 20
    proof: text
  - id: d13-t2
    type: build
    title: "Build the fix, as a small tool or a 20–30 second code-made video, and put it online"
    xp: 100
    proof: link
  - id: d13-t3
    type: ship
    title: "Hand it over and quote their honest feedback"
    xp: 60
    proof: text
  - id: d13-t4
    type: share
    title: "Publish a mini case study"
    xp: 30
    proof: link
---

Twelve days ago you'd never talked to an agent. Since then you've shipped a page, pulled live data, called AI models,
hidden a key behind a backend and rendered video from code. Today all of it meets the final exam of phase 1: a real
person with a real annoyance. Not a tutorial, not a toy. Someone who'll either use what you made — or politely won't,
which is also data.

## The rules of the boss

- **One person, one annoyance.** A parent, a friend who runs a small business, a colleague, the organiser of your
  running club. Someone you can reach today.
- **Small enough to finish.** You have about 85 minutes of building. If it can't be done in that time, cut it until
  it can. A finished small thing beats an impressive half-thing every single time.
- **Either track.** A small tool (apps) or a 20–30 second video made with code (video). Use the track you picked
  yesterday — or the other one, if their problem clearly calls for it.
- **It goes online and into their hands.** A link they can open, not a file on your laptop.

## Step by step

### 1. The interview (20 min)

Ask about their life, not your idea. People are bad at predicting what they'd use and great at describing what
already annoys them. Five questions:

1. "What's a small task you do every week that you'd happily never do again?"
2. "Tell me about the last time you did it. What happened, step by step?"
3. "How do you deal with it now?"
4. "What's the most annoying part?"
5. "If it were magically fixed, what would be different?"

Don't pitch. Don't say "I could build an app for that" yet. Listen and write down their exact words.

Then write the problem in three lines:

- **Who:** Maria, runs a 6-table café, does everything herself.
- **Annoyance:** every evening she writes the same replies to Google reviews and it takes 30 minutes.
- **Solved looks like:** she pastes a review and gets a warm reply in her own tone, ready to post.

**Proof:** your three lines.

> **If you're stuck:** nobody has a problem? Ask differently: "What did you complain about this week?" Or look at what
> people ask *you* for help with. Recurring favours are recurring problems.

### 2. Build it (85 min)

First, decide the format in one sentence: "a page where Maria pastes a review and gets a reply" or "a 25-second
vertical video that shows the café's new opening hours and how to pre-order". Then pick a prompt.

**Tool route** — reuse your day 11 setup (same Worker pattern, new repo):

```text
Goal: a small web tool for <person>, who <the annoyance, in their words>.
Solved looks like: <line 3 of my problem statement>.

Context: reuse the pattern from my previous tool: Cloudflare Worker serving public/index.html plus POST /api/run,
AI key as a secret, model claude-sonnet-5-5 (or what I used before). If this needs no AI at all, skip the API.

Constraints:
- One screen, phone first, big buttons, plain words — <person> is not technical.
- The page explains itself in one sentence; no sign-up.
- Inputs capped at 2,000 characters; friendly errors; key never leaves the server.
- No real personal data of <person> or their customers in the repo.

Done when: deployed with npx wrangler deploy, works on my phone, code pushed to GitHub.
```

**Video route** — build on your day 12 title card:

```text
Goal: a 20–30 second vertical video (1080x1920, 30 fps) for <person>, solving: <the annoyance>.
Solved looks like: <line 3 of my problem statement>.

Context: Python + Pillow + ffmpeg, like my title-card project in ~/title-card (new folder, its own .venv). Assets in assets/: <photos/logo/screenshots I have permission to use>, a font in fonts/, and music.mp3 (royalty-free, from Pixabay Music).

Spec:
- The script lives in scenes.json: a list of scenes with text, duration in seconds and an optional image. I'll edit the wording there without touching code.
- Each scene: text fades/slides in with ease-out; images get a slow zoom; 0.3 s crossfade between scenes.
- Last scene: a clear call to action (<what the viewer should do>), held for 3 seconds.
- Music under everything, fades out over the last 2 seconds. Final mp4 is H.264 with yuv420p, plays on phones.
- One command: python render.py renders frames and calls ffmpeg.

Done when: final.mp4 is 20–30 seconds, readable on a phone with sound off, and I've watched it twice.
```

Watch it on your phone with the sound off: can you read every line before it disappears? If not, lengthen that scene
in `scenes.json` and re-render. Upload it somewhere they can open with one tap: YouTube as unlisted, a cloud-drive
link, or straight into a chat.

> **Safety:** use only photos, logos and voices you have permission to use. Ask before you put someone's face or
> business in a public video.

> **If you're stuck:** at minute 60, if it isn't working, cut scope — drop a feature, a scene, the AI part. Then use
> your day 10 escape moves. Ship the smaller thing.

**Proof:** the link — tool URL or video link.

### 3. Hand it over (25 min)

Send it with one sentence: "Remember the reviews thing? I made this for you — try it on tonight's reviews." Better
still, watch them use it, in person or on a call, and keep your hands off the keyboard. Then ask:

- "Would you use this next week? What would stop you?"
- "What was confusing?"
- "What's the one thing you'd change?"

**Proof:** quote their feedback word for word (ask if you may publish it), including the critical bits.

### 4. The mini case study (20 min)

Post it in your build log. Shape:

1. **The problem** — their three lines, in plain words.
2. **What I made** — one sentence and the link or video.
3. **How** — tools, time spent, one thing that went wrong and how you fixed it.
4. **The verdict** — their quote.
5. **Next** — what you'd do with another day.

That's the same structure professionals use in portfolios. You'll polish this exact post on day 58.

**Proof:** the link to your post.

## You're done when…

- [ ] You interviewed one real person and pasted their problem in three lines.
- [ ] Your tool or video is online — link pasted.
- [ ] They tried it, and you quoted their honest feedback.
- [ ] Your mini case study is public — link pasted.

**Tomorrow:** you rest, look back at how you actually worked, and set up your workshop for phase 2.
