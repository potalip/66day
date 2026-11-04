---
day: 58
track: common
phase: 4
title: "Case studies and a 60–90-second demo"
summary: "Turn your best piece into a case study with real numbers and a 60–90-second demo or showreel that sells it."
estMinutes: 90
resources:
  - "https://playwright.dev/"
  - "https://ffmpeg.org/documentation.html"
  - "https://trac.ffmpeg.org/wiki"
tasks:
  - id: d58-t1
    type: read
    title: "Learn the case-study shape: problem, process, result, numbers"
    xp: 10
    proof: none
  - id: d58-t2
    type: build
    title: "Write one case study and publish it"
    xp: 50
    proof: link
  - id: d58-t3
    type: build
    title: "Make a 60–90-second demo or showreel"
    xp: 40
    proof: link
---

A portfolio shows *what* you made. A case study shows *how you think* — and that's what a client is really
hiring. A demo shows it working without them having to click a thing. Today you add both to the site you shipped
yesterday.

## The shape: problem → process → result → numbers

A good case study reads in two minutes and answers four questions:

1. **Problem.** Whose problem, in their words. "Maria answered 40 booking DMs a week by hand, mostly after 9 p.m."
2. **Process.** Three or four decisions, not a diary. What you tried, what you cut, one thing that went wrong and
   how you fixed it. Mentioning the agent is fine — say what *you* decided.
3. **Result.** What exists now and who uses or watches it.
4. **Numbers.** Measured, not invented. If you have no client figures, use your own measurements: render time per
   video, cost per call, load time, your day-47 eval score (apps), the retention curve from day 37 (video).

The example above is made up to show the shape. Yours must be true — a client who catches one inflated number
stops believing the rest. "Small but real" wins: "3 testers, 2 still use it weekly" is a great line.

## Step 1 — Write the case study (35 min)

Pick the piece with the clearest before/after: usually the day-41 client brief or your capstone beta. If it's your
day-13 boss instead, your mini case study from that day is already a first draft in this exact shape. Let the agent
interview you instead of writing for you:

```text
Goal: help me write a case study for my portfolio, about 400 words.
Context: the project is (one line). Its repo / links: (paste). My portfolio repo is open in this folder.
Process: first ask me 8 short questions, one at a time, covering problem, who it was for,
key decisions, what went wrong, result and numbers. Wait for each answer.
Then draft it as problem → process → result → numbers, in my voice: plain, first person, no hype words
("revolutionary", "seamless", "cutting-edge"). Mark any number I didn't give you as [CHECK].
Done when: the case study is a page at /cases/<project-name> linked from the matching portfolio card,
with one image or preview, and it looks right at 390px and 1280px.
```

Read the draft out loud. Delete every sentence that would be true of anyone's project. Replace every `[CHECK]`
with a real number or remove it. Push.

## Step 2 — The 60–90-second demo or showreel (40 min)

**Apps people — a product demo.** Script it in four beats: 0–5 s the problem in one sentence; 5–60 s the main
flow, start to value, no settings screens; 60–80 s the result; last 5 s the link. Record with OBS Studio or your
system recorder (macOS: Cmd+Shift+5; Windows: Win+Alt+R or the Snipping Tool's video mode). Or let code record it:

```text
Write a Playwright script that opens my live app at 1280x800 with video recording on,
walks through the main flow (sign in with the demo account, create one item, run the AI feature),
pausing 1.5 s on each important screen, and saves the video. Then give me the ffmpeg command
to trim it to under 90 s and convert it to a web-friendly mp4.
```

Add a voiceover in your own voice or with TTS, or simple on-screen captions.

**Video people — a showreel.** 60–90 s, your best 3–8 seconds of each piece, strongest shot first (not your logo),
cut on the beat with music you have the rights to, an end card with your name, what you make and how to reach you.
You built an edit-from-JSON workflow on day 30 — use it:

```text
Goal: a 75-second showreel from my best pieces.
Context: clips are in ./reel-src; my EDL format from day 30 is in edl.example.json; music is ./music/track.mp3.
Constraints: open with the strongest moment, 2–5 s per shot, cuts on beats (detect them or I'll give BPM),
1080p 16:9 plus a 9:16 version, end card with my name and contact, audio around −14 LUFS.
Done when: both files render with one command and I can change a shot by editing one line.
```

Upload it (YouTube or Vimeo, unlisted is fine), embed it at the top of your portfolio, and link it in the case study.

> **If you're stuck:** if the demo drags, cut it in half and watch again. Nobody has ever complained that a demo
> was too short. Cut every pause longer than a second.

## You're done when…

- [ ] You know the four parts and checked every number is real.
- [ ] Your case study is live on your portfolio; you pasted the link.
- [ ] Your 60–90-second demo or showreel is uploaded and embedded; you pasted the link.

Tomorrow: find out where the paid work actually is.
