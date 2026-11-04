---
day: 65
track: video
phase: 4
title: "Boss: launch day"
summary: "You launch your capstone across your channels, stay present in the comments, and publish an honest 24-hour report and thank-you."
estMinutes: 150
boss: true
badges: [launched]
resources:
  - "https://developers.google.com/youtube/v3"
  - "https://www.producthunt.com/"
  - "https://news.ycombinator.com/showhn.html"
tasks:
  - id: d65-video-t1
    type: ship
    title: "Launch publicly and paste the launch post link"
    xp: 120
    proof: link
  - id: d65-video-t2
    type: build
    title: "Write the 24-hour report: views, retention, comments, what broke"
    xp: 40
    proof: text
  - id: d65-video-t3
    type: share
    title: "Publish a thank-you and learnings post"
    xp: 30
    proof: link
---

Sixty-four days ago you rendered 90 frames of a moving square and felt like a wizard. Today you launch a body of work
made by your own pipeline: masters locked, trailer cut, uploads scheduled, a service page waiting for clients. The
making is done. Launch day is about **showing up**: posting well, answering every person, fixing what breaks in
public, and writing down what happened while it's fresh.

## The shape of the day

Your 150 minutes are spread over 24 hours in short, focused blocks. Put them in your calendar now.

| When | Block | Minutes |
|---|---|---|
| T−30 min | Pre-flight | 15 |
| T+0 | Main video goes live + launch post | 15 |
| T+0 → T+2 h | Be present: replies within 15 min | 45 |
| T+3 h | Shorts and supporting channels + personal messages | 20 |
| T+6 h | Check-in: numbers, thumbnail test, replies | 15 |
| Evening | Last reply round | 10 |
| T+24 h | 24-hour report + thank-you post | 30 |

"T+0" is the time from your day 62 channel plan. Choose a time you'll be awake and free for two hours afterwards —
being in the comments matters more than any "best time to post" chart.

## Step by step

### T−30: Pre-flight (15 min)

```text
Pre-flight for launch. For every scheduled or ready video in my channel plan:
1. Confirm the platform's copy matches the file in capstone-v1.0/delivery/ (duration, resolution, checksum of the
   uploaded source where possible).
2. Check that title, description, chapters, captions (SRT) and thumbnail are set, and the scheduled time is right in
   my time zone.
3. Open every link in every description and report any that fail.
Report in a short table. Change nothing; tell me if anything is wrong.
```

Then open on your phone: the main video, captions on, then off. Keep three tabs open all day: the platform studio
(real-time view), your notifications, and your channel plan.

### T+0: Go live and post (15 min)

The main video goes public (or your scheduled premiere starts). Post your launch message on the main channel with the
trailer attached. Templates to adapt — make them sound like you:

```text
X / THREADS / LINKEDIN
1/ Today I'm launching [series / tool / reel]: [what it is for whom, one line]. [trailer, uploaded natively]
2/ Every frame is made by code: [one striking detail — "the charts are rendered from live data"].
3/ What 5 test viewers taught me: [one honest insight — "the first version lost people at 0:41"].
4/ Episode 1 is live: [link]. New episodes [schedule]. I'm reading every comment today.

PINNED COMMENT UNDER THE VIDEO
Thanks for watching! This is episode 1 of [N]. What should I explain next? (Made with my own code pipeline —
ask me anything about how.)

SHOW HN / PRODUCT HUNT (only for a tool people can try)
Show HN: [Name] – turns [input] into [video output] with code
First comment: why I built it, how it works (stack, which models for script/voice), limits, how to try it free,
one specific question I'd love feedback on.
```

> **Tip:** ask for **feedback and questions**, never for likes, upvotes or "smash that subscribe". Platforms and
> communities punish vote-begging, and audiences can smell it.

**Proof for task 1:** the launch post link.

### T+0 → T+2 h: Be present (45 min)

The first two hours shape everything. Reply to every comment within ~15 minutes — specific answers, not "thanks!🔥".
Heart or like good comments; answer questions about *how* it's made generously; that's your proof of craft for future
clients. Criticism? "Fair — noted for episode 2." Never argue about taste.

Something broken? Classic launch-day video bugs: captions missing on one platform, a dead description link, the wrong
thumbnail, audio out of sync on a re-encode. Fix the metadata in the studio immediately. If the video file itself is
broken:

```text
Launch hotfix. Problem: [e.g. "audio drifts out of sync after 0:50 on the 9:16 version"]. Re-export only that
delivery file from its master with the exact pipeline config, run qc.py, and compare duration and audio stream with
the master. Change nothing else. Show me the QC report before I re-upload.
```

> **If you're stuck:** a platform flags your video for copyright in the first hour? Don't panic and don't delete it.
> Open the claim, check it against your `licences/` folder, and dispute with the licence proof if you're right. If you
> aren't sure, replace the track with a library track you have rights to and re-upload — then tell your audience why.

### T+3 h and T+6 h: Spread and check (35 min)

Upload the vertical cuts natively to Shorts, Reels or TikTok, post on supporting channels, and personally message the
people from your plan: test viewers, your day 41 client, creators you've talked to. "It's live — would mean a lot if
you shared it with one person who'd enjoy it" beats any broadcast.

At T+6, look at early numbers. If your platform supports thumbnail testing, let it run; if click-through is clearly
weak after a few hundred impressions, swap to your second-best thumbnail and note the time you changed it.

### T+24 h: The report and the thank-you (30 min)

```text
Help me write the 24-hour launch report. I'll paste the analytics export / screenshots numbers for each video and
platform: views, impressions and click-through rate, average view duration, average percentage viewed, retention at
30 s, new followers, comments. Build one markdown table across platforms, then summarise comments into top 3 praises,
top 3 complaints, top 3 requests. List what broke and how it was fixed. Don't round small numbers up.
```

Check every number against the studio yourself. Add one line comparing it to your day 64 success definition.
**Proof for task 2:** the report.

Finally, the thank-you post: *thanks* (name helpers who are happy to be named), *numbers* (honest, small is fine),
*three lessons*, *what's next* (episode schedule, or "I'm taking clients — here's my service page").
**Proof for task 3:** the link.

## You're done when…

- [ ] Your capstone is launched publicly; the launch post link is pasted.
- [ ] Your 24-hour report covers views, retention, comments and what broke.
- [ ] Your thank-you and learnings post is live; the link is pasted.

You launched. Whatever the numbers say, you are now someone who finishes and ships. Tomorrow: graduation.
