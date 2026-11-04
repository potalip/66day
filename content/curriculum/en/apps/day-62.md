---
day: 62
track: apps
phase: 4
title: "Launch prep: the kit, the channels, the checklist"
summary: "Build a launch kit from your README, pick channels with their rules in mind, and close every gap that could sink launch day."
estMinutes: 90
resources:
  - "https://www.producthunt.com/"
  - "https://news.ycombinator.com/showhn.html"
  - "https://playwright.dev/"
  - "https://plausible.io/docs"
tasks:
  - id: d62-apps-t1
    type: build
    title: "Assemble the launch kit: copy, 3 screenshots, a 30-second demo, an FAQ"
    xp: 50
    proof: link
  - id: d62-apps-t2
    type: build
    title: "Write the channel plan: where, when and in what format"
    xp: 30
    proof: text
  - id: d62-apps-t3
    type: build
    title: "Run the pre-launch checklist: analytics, errors, support"
    xp: 20
    proof: text
---

Launch day is in three days. Launches rarely fail because the product is bad — they fail because the post was
written at 2 a.m., the screenshot showed an empty state, and the sign-up form broke under 40 visitors. Today you do
all the thinking so that on day 65 you only have to *show up*.

## The launch kit is a press pack for one

Journalists get press kits: everything they need to write about you without asking. Your launch kit is the same,
for you on launch morning. One folder (or one page in your repo, `launch/`), containing:

- **Copy:** a name, a tagline (≤ 60 characters), a 2-sentence description, a 150-word "maker's story" (why you built
  it), and 3 short variants for social posts.
- **3 screenshots:** the value moment, the first screen, one detail that shows care. Real data, not empty states.
- **A 30-second demo:** silent-friendly (captions or on-screen text), starts on the value, not the logo.
- **An FAQ:** the 6–8 questions people will ask in the comments, answered in advance. Is it free? What model? Where
  does my data go? Is it open-source? Why not just use a chatbot?

## Step by step

### 1. Let the agent build the kit from what exists (45 min)

Your README, `docs/CAPSTONE.md` and `docs/BUILDLOG.md` already contain the story. Point the agent at them:

```text
Goal: create a launch kit in ./launch for my capstone.
Context: read README.md, docs/CAPSTONE.md (spec from day 50), docs/BUILDLOG.md (my beta table, quotes and day-55
metrics) and the git log. The live URL is [url].
Make:
1. launch/copy.md — name, tagline (max 60 chars, 5 options), 2-sentence description, 150-word maker story in first
   person, 3 social variants (X/Threads, LinkedIn, a community post). Plain words, no hype, no invented numbers:
   only use metrics and quotes that appear in my notes.
2. launch/screenshots/ — a Playwright script (launch/shoot.mjs) that signs into a demo account, fills realistic
   sample data, and captures 3 screens at 1270x760 and 390x844, light theme, plus one dark. Hide dev banners.
3. launch/demo.webm — a Playwright run with recordVideo that walks first screen → value moment in under 30 s,
   with short pauses so a viewer can follow. Then convert to mp4 and a GIF with ffmpeg.
4. launch/faq.md — 8 likely questions with honest short answers. Mark anything you're unsure about with TODO.
Done when: all files exist, the script re-runs cleanly, and you show me the 5 tagline options.
```

The ffmpeg step the agent will use looks like this — useful to recognise:

```bash
ffmpeg -i launch/demo.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart launch/demo.mp4
ffmpeg -i launch/demo.mp4 -vf "fps=12,scale=800:-1:flags=lanczos" launch/demo.gif
```

Now edit like a human. Pick the tagline a tired stranger would understand in 3 seconds. Rewrite the maker story so
it sounds like you talking to a friend. Resolve every TODO in the FAQ. **Proof for task 1:** link to the `launch/`
folder (or a shared folder) in your repo.

> **If you're stuck:** Playwright can't log in because of your auth flow? Ask the agent to add a demo account seeded by
> a script, enabled only when `DEMO_MODE=true`. Never point the screenshot script at your real account.

### 2. The channel plan (25 min)

Pick **one main channel and two or three supporting ones**. Every community has rules; read them today, not on launch
morning. A quick map:

| Channel | Best for | Rules to respect |
|---|---|---|
| Product Hunt | consumer and maker tools | The day runs on Pacific time; launching early in that day gives you the full 24 h. Create your account and draft the listing today, not on launch morning. Don't ask for upvotes — ask for feedback. |
| Show HN | things people can try right now | Title starts with "Show HN:". No sign-up wall if you can avoid it; be in the comments, answer technical questions plainly. Never ask friends to upvote or comment — HN penalises voting rings. Post from an account that has joined discussions before, not one made that morning. Read the Show HN guidelines. |
| Reddit | niche communities where your users are | Each subreddit has its own self-promotion rules — many need you to be an active member first. Read the sidebar; when in doubt, message the mods. Asking for upvotes breaks Reddit's site-wide rules. |
| X / Threads / LinkedIn | your own audience and network | A thread with the story and the GIF; tag no one who didn't help. |
| YouTube | a 2–3 min walkthrough | Works long after launch day; link it everywhere. |

Then write the plan: for each channel — **when** (date and your local time), **format** (post, thread, video),
**the link** to the exact copy in `launch/copy.md`, and **who** you'll personally tell (the 5 beta testers, the day-41
client, friends who promised to share). **Proof for task 2:** paste the plan.

### 3. Pre-launch checklist (20 min)

Go through this list on the **production** URL and mark each item ✅ or a fix you'll do tomorrow:

- [ ] Analytics fires the four events from day 54; you can see today's numbers.
- [ ] Errors are logged and you get notified (email or a Telegram message) on a spike.
- [ ] AI spend limit set at the provider; rate limits on; fixture fallback works.
- [ ] Support path: a visible contact (email or form) and an auto-reply that says when you'll answer.
- [ ] Link previews: page title, description and an OG image look right when pasted into a chat.
- [ ] Rollback: you know the exact command or button to return to the previous deploy.
- [ ] Privacy: one short page saying what you store and how to delete it.

**Proof for task 3:** paste the checklist with marks.

## You're done when…

- [ ] `launch/` has copy, 3+ screenshots, a 30-second demo and an FAQ; link pasted.
- [ ] Your channel plan lists where, when, format and who you'll tell.
- [ ] The pre-launch checklist is marked on production.

**Tomorrow:** rest. Seriously. Then the dry run on day 64.
