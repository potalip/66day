---
day: 55
track: video
phase: 4
title: "Boss: the premiere"
summary: "Your capstone goes public: first episodes, the tool or the reel live, a short cut for discovery, and your first real numbers."
estMinutes: 150
boss: true
badges: [boss-beta]
resources:
  - "https://developers.google.com/youtube/v3"
  - "https://ffmpeg.org/documentation.html"
  - "https://www.remotion.dev/docs/"
tasks:
  - id: d55-video-t1
    type: ship
    title: "Premiere your first outputs publicly and paste the link"
    xp: 100
    proof: link
  - id: d55-video-t2
    type: build
    title: "Report first metrics: views, retention and one real quote"
    xp: 40
    proof: text
  - id: d55-video-t3
    type: share
    title: "Post the premiere announcement"
    xp: 30
    proof: link
---

Until now, everyone who saw your capstone got a link from you personally. Today, strangers can find it. This isn't the
big launch — that's day 65 — it's the **premiere**: the first public screening, where you learn how the work behaves
in the wild, with real thumbnails competing for real attention.

## What "premiere" means for your capstone

- **Series:** episode 1 public, episode 2 scheduled for later this week, and a vertical short cut from episode 1 to
  bring people in.
- **Tool:** the tool is open to the public with hard limits (a few renders per person per day, a spend cap set on
  every API key it uses), plus a small gallery of 3 outputs it made and a short demo.
- **Showreel:** your finished pieces (3+) are public as a playlist or a simple page, with a way for a potential client
  to contact you. The 60–90-second reel itself gets cut on day 58 and leads the launch on day 65.

Two numbers matter most at this stage. **Views** tell you if the packaging (title + thumbnail + first seconds) works.
**Retention** — average percentage viewed, or how many people are still watching at 30 seconds — tells you if the
video itself works. A video with 40 views and 70% retention is in better shape than one with 400 views and 15%.

## The 150-minute plan

| Time | Block |
|---|---|
| 0:00–0:30 | Final render + QC on the premiere outputs |
| 0:30–1:05 | Packaging: titles, descriptions, thumbnails, short cut |
| 1:05–1:20 | Publish via your upload script |
| 1:20–1:35 | Announcement post |
| 1:35–2:15 | Be present: replies, watch first numbers |
| 2:15–2:30 | First metrics + quote |

### 0:00 — Final render and QC

Render the premiere outputs from the pipeline (including yesterday's v2 fix), then run `qc.py` on each. Nothing goes
public with a red line in QC. Check rights one more time with your day 47 checklist: music licence, fonts, any AI
footage disclosure the platform requires.

### 0:30 — Packaging

```text
Goal: platform-ready packaging for the premiere.
Context: read the storyboard JSON and transcript for episode-01 (or the tool's demo / the reel), and my day 36
metadata script.
Make:
1. 5 title options (max 60 characters; the promise, not the topic), and a description with chapters from the
   transcript, one link to the [series page / tool / contact], and the AI-disclosure line if needed.
2. 3 thumbnail variants at 1280x720 from the pipeline's thumbnail generator: one face/subject close-up, one big-text,
   one contrast frame from the best moment. Text max 4 words, readable at phone size.
3. A 20–30 s vertical (1080x1920) short cut of the strongest moment, with captions in the safe zone and the hook in
   the first 2 s, ending with "full episode on my channel".
Done when: the chosen title and description sit in runs/<capstone>/01/metadata.json, thumbnails in its thumbs/,
the short in runs/<capstone>/premiere/, QC is clean on every video, and you show me the titles side by side.
```

Pick the title and thumbnail you'd click on a tired evening — then check the thumbnail at phone size (shrink it to
~320px wide). If the text is unreadable, it doesn't exist.

### 1:05 — Publish

Use the upload script from day 36. This time set `"privacy": "public"` in the output's metadata.json instead of
unlisted:

```bash
python upload_youtube.py runs/<capstone>/01 --dry-run
python upload_youtube.py runs/<capstone>/01
```

Remember the day 36 gotcha: if your Google Cloud project is still unverified, the API locks uploads to private. Then
upload the premiere by hand in YouTube Studio today; the audit takes longer than one evening.

Schedule episode 2 for later in the week. Upload the short natively on Shorts, Reels or TikTok — platforms prefer
native uploads to links. **Proof for task 1:** the public link to your main output.

> **If you're stuck:** the API upload fails with a quota or permission error 10 minutes before you planned to post?
> Upload manually in the platform's web studio and fix the script tomorrow. Your API project's quota resets on its
> own schedule; your audience doesn't wait for it.

### 1:20 — Announce

Post where your people already are — where you announced the capstone on day 50 — plus one community where your
audience gathers (read its self-promotion rules first). Draft with the agent, rewrite in your voice:

```text
Draft a 100-word premiere post for [X / LinkedIn / a community]. Hook from the episode's best line;
what the series/tool/reel is in one sentence; one detail that shows care (e.g. "every chart is drawn by code from
real data"); the link; one question to the viewer. No hype words. Two versions: plain and playful.
```

Attach the vertical cut — video posts beat link posts on most feeds. **Proof for task 3:** the post link.

### 1:35 — Be present

Reply to every comment within ~15 minutes. Pin a comment under the video with a question ("What should episode 3
cover?"). If someone points out a real mistake — a wrong number, a typo in a caption — thank them and fix it in the
next episode's pipeline run, publicly.

### 2:15 — First numbers

Platform analytics may lag by hours, so record what you can see now and update tonight:

- **Views** on the main output and the short.
- **Retention:** average percentage viewed, or for tiny numbers, your drop-off logger from yesterday.
- **One quote:** a real comment or message, with permission if you'll publish it.

**Proof for task 2:** those three lines. "62 views, 58% average viewed, and a stranger wrote 'finally someone explains
this without shouting'" is a great first report.

## You're done when…

- [ ] Your first capstone outputs are public; the link is pasted.
- [ ] You reported views, retention and one real quote.
- [ ] Your premiere announcement is live; the link is pasted.

Boss down. Your work is out in the world, and the world has started answering. Day 56 is rest.
