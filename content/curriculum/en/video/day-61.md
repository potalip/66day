---
day: 61
track: video
phase: 4
title: "Productize: sell your pipeline"
summary: "Turn your pipeline into something people can buy: a service page or a template pack, with a clear price and turnaround."
estMinutes: 90
resources:
  - "https://docs.stripe.com/payments/checkout"
  - "https://docs.github.com/en/pages/getting-started-with-github-pages"
  - "https://www.remotion.dev/docs/"
  - "https://contra.com/"
tasks:
  - id: d61-video-t1
    type: build
    title: "Publish a service page or a template pack and paste the link"
    xp: 60
    proof: link
  - id: d61-video-t2
    type: build
    title: "Set your price, turnaround and what's included"
    xp: 20
    proof: text
  - id: d61-video-t3
    type: reflect
    title: "Name what clients keep asking for"
    xp: 15
    proof: text
---

Yesterday you sent five pitches. The question that comes back first is always some version of *"how much, how fast,
and what do I get?"*. If your answer is "it depends, let's chat", you lose half the leads right there. Today you
answer it once, publicly, in a way that makes buying easy. A pipeline that only you can run is a hobby. A pipeline with
a price tag is a **product**.

## Two ways to sell a pipeline

**A. Done-for-you service.** The client sends a brief; your pipeline makes the videos; you review and deliver. You
sell *outcomes*: "4 explainer shorts a month in your brand", "a 60-second product demo with captions in 2 languages".
Best if you enjoy client work and your pipeline gives you a speed advantage.

**B. Template pack.** You sell the tool itself: a Remotion (or Python) template, its JSON schema, a brand config, sample
renders and a README. Buyers render their own videos. You sell *time saved*. Best if your capstone is a tool and you'd
rather not manage clients.

> **Important for templates:** check the licence of everything inside — fonts, music, the framework itself. Remotion, for
> example, has its own licence terms that can require some companies to buy a company licence; say so on your sales
> page and link to it. Never bundle stock music or fonts you aren't allowed to redistribute.

Either way, the page answers six questions: **what** you make, **for whom**, **examples**, **price**, **turnaround**,
**how to start**.

## Step by step

### 1. Do the price maths first (20 min)

Open your day 52 numbers (time and cost per video) and your day 59 offer. Then calculate honestly:

```text
Per video, for a client:
  pipeline run + fixes      ___ min
  your review / QC pass     ___ min
  client comms + 1 revision ___ min
  = total hours             ___ h
  × your hourly target      ___
  + API costs (TTS, AI footage, music licence) × 1.5 safety margin
  = floor price per video   ___
```

Then package it. Three tiers are the classic shape, because people like choosing the middle one:

- **Starter:** 1 video, one format, 1 revision.
- **Standard:** 4 videos a month, 16:9 + 9:16 (your day 34 variants), captions, 2 revisions each.
- **Plus:** Standard + a second language via dubbing (day 45) + thumbnails.

Turnaround should be a promise you can keep on a bad week — if the pipeline takes 1 day, promise 3. **Proof for task 2:**
your three tiers with price, turnaround and what's included, plus one line on how you got the numbers.

### 2. Build the page with your agent (50 min)

```text
Goal: a one-page [service page / template pack sales page] for my video pipeline, deployed as a static site.
Context: my pipeline README, runs/<capstone>/ and runs/ (finished videos), my day 52 time/cost numbers, and these tiers: [paste].
Sections, in order:
1. Hero: who it's for + the outcome in one line + one autoplaying muted 10-s loop of my best output.
2. Examples: 3 videos (embed or mp4 with poster frames, lazy-loaded), each with one line of context.
3. Packages: the three tiers as cards — price, turnaround, included, revisions. Mark the middle one "Most popular".
4. How it works: 4 steps (brief → script approval → render → delivery), with a sample brief form from day 39.
5. FAQ: 6 honest answers (rights and licences, AI disclosure, revisions, file formats, languages, payment).
6. Call to action: [contact form that emails me / link to a Stripe Payment Link / a "buy" link for the template pack].
Constraints: fast on mobile (no heavy autoplay above 2 MB, poster images for every video), light and dark theme, no invented testimonials — only real quotes from my day 41 client and day 55 premiere, with names only if I confirm.
Deploy on GitHub Pages or Cloudflare Pages.
Done when: it's live, Lighthouse mobile performance is reasonable, and you've listed every asset whose licence I should double-check.
```

Open it on your phone. Could a stranger buy from you in 60 seconds without writing to you first? If not, the call to
action is unclear — fix that before anything else. **Proof for task 1:** the live link.

> **If you're stuck:** don't have three strong examples yet? Use your capstone episodes plus the day 41 client pack,
> and label any self-initiated piece honestly ("concept piece, not client work"). Honesty here is a feature —
> clients smell fake portfolios.

> **Tip:** for template packs, the easiest storefronts are Gumroad, Lemon Squeezy or a Stripe Payment Link plus a
> private download link. Check that the platform supports payouts in your country before you set it up.

### 3. Listen for the pattern (10 min)

Look back at every message from clients, testers and viewers since day 41. What do people keep asking for that you
haven't offered? "Can you do it in Spanish?" "Can I get a vertical version?" "Can it use my voice?" The thing you hear
three times is your next package. **Proof for task 3:** three repeated requests and which one becomes a package.

## You're done when…

- [ ] A live service page or template pack page with examples and a clear way to buy; link pasted.
- [ ] Three tiers with price, turnaround and what's included, and how you got the numbers.
- [ ] You named what clients keep asking for.

**Tomorrow:** launch prep. Your capstone gets a trailer and a channel plan.
