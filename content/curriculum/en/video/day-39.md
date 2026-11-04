---
day: 39
track: video
phase: 3
title: "Video for business: demos and promos"
summary: "Record a real product with Playwright, add code-driven zooms and callouts, and write the brief template you'll use with paying clients."
estMinutes: 90
resources:
  - "https://playwright.dev/"
  - "https://www.remotion.dev/docs/"
  - "https://www.upwork.com/"
tasks:
  - id: d39-video-t1
    type: read
    title: "Learn what businesses actually buy"
    xp: 10
    proof: none
  - id: d39-video-t2
    type: build
    title: "Make a 30-s promo with code-driven callouts and zooms"
    xp: 60
    proof: file
  - id: d39-video-t3
    type: build
    title: "Write your client brief template"
    xp: 20
    proof: text
  - id: d39-video-t4
    type: quiz
    title: "Quiz: spec the deliverable"
    xp: 15
    proof: none
---

Until now you've made videos for your own channel. In two days you'll make them for a real client. Today is the bridge:
you make the kind of video businesses pay for — a product promo with zooms and callouts — and you write the one document
that keeps client work from turning into endless "small changes".

## What businesses actually buy

Nobody wakes up wanting "a video". They want more sign-ups, fewer support tickets, a full class on Saturday. The video is
how they get there. The most common paid jobs for someone with your skills:

- **Product demo** (30–60 s) for a landing page: autoplays muted, so it must make sense without sound.
- **Feature announcement** for social: "new: book in two taps", 15–30 s, vertical.
- **Ad variants**: the same message in 6, 15 and 30 s, three hooks each. Your pipeline makes nine versions in the time
  an editor makes one.
- **Onboarding explainers**: "how to set up your account", which cut support questions.
- **Local business reels**: a café's new menu, a gym's schedule, a shop's weekly offer — the same template every week.

What clients really pay for is **clarity, speed, consistency and variants**. Code is good at all four. That's your
pitch.

**Code-driven callouts** are the signature move. Instead of keyframing a zoom by hand, a script clicks through the
product, records the screen, and writes down *where* each button was at *which* second. Your renderer then zooms into that
rectangle and points an arrow at it automatically. Change the website, re-run, and the whole promo updates itself.

## Step by step

### 1. Pick a product you're allowed to show

Your own AI tool from day 11 is perfect. A friend's small business site works too — ask first, and record only public
pages or a demo account, never real customer data.

### 2. Record with Playwright, then direct with code

```text
Goal: a 30-second, 1920x1080 product promo made from an automated screen recording with code-driven zooms and callouts.
Context: product URL: <url>. My brand kit from day 32 and my pipeline from day 33. Playwright and ffmpeg installed.
Part A — record.mjs (Playwright, Chromium):
- Viewport 1920x1080, recordVideo at the same size. Follow steps.json: [{ action: goto|click|type|wait, selector, text?, callout: "label shown on screen", hold_s }].
- Before each click, log { t: seconds since start, box: element boundingBox, callout } to timeline.json.
- Move the mouse smoothly to each target (steps of ~25) so the cursor path looks human. Slow typing (~60 ms per key).
Part B — compose (Remotion or Python, whichever my pipeline uses):
- Play the recording; at each timeline entry, ease-zoom (my brand's easing) so the box fills ~45% of the frame, hold, then ease out. Draw a rounded highlight around the box and a callout label in brand colours.
- Intro card (2 s, product name + one-line promise), end card (3 s, CTA + URL) from my brand components.
- Music bed at -14 LUFS; no voiceover needed — the video must work muted.
- Also output 9:16 using my day-34 formats flag (zoom targets keep the box inside the vertical safe zone).
Done when: node record.mjs && <render command> produces out/promo-16x9.mp4 (~30 s) and out/promo-9x16.mp4.
```

Write `steps.json` yourself — 4 to 6 steps that tell a story: the problem screen, the one action, the result. That's
your script. Example for a booking site: open the homepage → click "Book a repair" → pick Saturday 10:00 → confirm → the
"See you Saturday" screen.

Watch the result muted. Can someone who has never seen the product say what it does? Upload the mp4.

> **If you're stuck:** if zooms land in the wrong place, the recording and the timeline started at different moments.
> Ask the agent to record `t = 0` when the video context is created and add a visible frame counter in a debug render.
> If the boxes are offset, check `deviceScaleFactor` is 1.

> **Tip:** the same `steps.json` re-run after the client changes their website gives you an updated promo in five
> minutes. Mention that in your pitch: "updates included".

### 3. Your client brief template

Save this as `templates/client-brief.md` and adapt it in your own words. Paste your version as proof.

```text
Client & contact:            Deadline:             Budget:
1. Goal: what should viewers DO after watching? (one action, one metric)
2. Audience: who exactly, where they'll see it, sound on or off?
3. Deliverables: number of videos, length, aspect ratios, captions (languages), thumbnails, file format.
4. Must say: the 1–3 messages that have to be in it. Must NOT say: claims, competitors, prices.
5. Assets: logo (SVG), colours, fonts, product access/demo account, footage, music preferences.
6. Examples: 2 videos they like and 1 they hate — and why.
7. Process: script approval before render; 2 rounds of revisions included; extra rounds cost X.
8. Rights: who owns the final files, music/AI footage licences, disclosure of AI-generated parts.
9. Delivery: where (folder/link), naming, when payment is due.
```

## Quiz

A café owner writes: *"Can you make us a video for Instagram about our new breakfast menu?"* Turn it into a spec.

1. What's the first question you ask?
2. What deliverables would you propose?
3. What must the café provide?
4. What protects you from the fifth round of "tiny changes"?

> **Answers:**
>
> 1. "What should people do after watching — come in this week, order online, follow?" The goal decides everything else.
> 2. For example: one 20-s Reel (9:16) with burned-in captions and a thumbnail, plus a 1:1 cut for the feed; delivered
>    as H.264 mp4s.
> 3. Logo, colours, menu items and prices (checked by them), photos or permission to film, opening hours for the end card.
> 4. Two revision rounds written in the brief, script approval before rendering, and a price for extra rounds.

## You're done when…

- [ ] You can name three kinds of video businesses buy and what they really pay for.
- [ ] A ~30-s promo with automated zooms and callouts is uploaded (and works muted).
- [ ] Your client brief template is pasted.
- [ ] Quiz done.

Tomorrow: your pipeline gets a front door — a bot or a web form anyone can use.
