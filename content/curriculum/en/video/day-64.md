---
day: 64
track: video
phase: 4
title: "Final masters and a dress rehearsal"
summary: "Lock final masters and thumbnails in one tidy folder, tag the pipeline, and watch a friend go from post to video to follow."
estMinutes: 90
resources:
  - "https://ffmpeg.org/documentation.html"
  - "https://trac.ffmpeg.org/wiki"
  - "https://git-scm.com/book/en/v2"
tasks:
  - id: d64-video-t1
    type: build
    title: "Lock final masters and thumbnails in one folder and paste the link"
    xp: 50
    proof: link
  - id: d64-video-t2
    type: build
    title: "Run a dry run: a friend goes from post to video to follow"
    xp: 30
    proof: text
  - id: d64-video-t3
    type: reflect
    title: "Define what success means for this launch"
    xp: 15
    proof: text
---

In film, "picture lock" is the moment the edit is final — after that, nobody touches the cut, only the delivery.
Today is your picture lock. You'll produce **final masters**, put everything in one folder a stranger could
understand, and run a dress rehearsal of tomorrow's launch with one friend. After today: no more "just one tweak".

## Master vs. delivery file

A **master** is the highest-quality version of a video, the one you'd keep for ten years and re-export from. A
**delivery file** is a copy made for one platform: compressed, right aspect ratio, right loudness. You never edit a
delivery file — you re-export from the master. That's why a client can ask for "the vertical version, but for
LinkedIn" in a year and you can deliver in minutes.

Your folder should look something like this:

```text
capstone-v1.0/
  README.md              what's here, versions, licences, credits
  masters/               episode-01_master.mov (or high-bitrate mp4), trailer_master.mov
  delivery/
    youtube/             episode-01_16x9.mp4, episode-01.srt, episode-01_thumb.jpg
    vertical/            episode-01_9x16.mp4, trailer_9x16.mp4
    square/              ...
  qc/                    one QC report per delivery file
  licences/              music, fonts, footage, voice consent
  checksums.sha256
```

## Step by step

### 1. Lock the masters (40 min)

```text
Goal: final masters and delivery files for every launch video, in a clean folder structure.
Context: the pipeline config, out/ (current renders), the day 62 trailer, my channel plan.
Do:
1. Re-render every launch video from the pipeline at master quality (ProRes 422 HQ .mov, or H.264 at CRF 16 if
   ProRes is impractical), with the exact final config. Name them <slug>_master.<ext>.
2. From each master, export delivery files per platform in the channel plan (16:9, 9:16, 1:1 where needed),
   loudness-normalised to the target, with SRT captions and the chosen thumbnail.
3. Run qc.py on every delivery file and save reports into qc/.
4. Copy all licence files and voice-consent notes into licences/. Write README.md listing every file, its version
   and its credits. Generate checksums.sha256.
5. Commit the pipeline and tag it: git tag -a v1.0.0 -m "Capstone launch masters".
Done when: every QC report is clean, the folder matches the structure, and you show me the README.
```

The master render command your agent will run may look like this:

```bash
ffmpeg -i render/episode-01.mov -c:v prores_ks -profile:v 3 -c:a pcm_s16le masters/episode-01_master.mov
sha256sum masters/* delivery/*/* > checksums.sha256
```

Upload the folder to cloud storage (Google Drive, Dropbox, or an object storage bucket) and share a view link.
Then **replace** the scheduled uploads from day 62 with files from `delivery/` if anything changed — and check them
one last time in the platform studio.

> **If you're stuck:** ProRes masters are huge and your upload is slow? Keep ProRes on your disk and an external
> backup, and upload the delivery files plus README to the shared folder. The rule is "one authoritative master
> exists, and you know where" — not "everything in the cloud".

**Proof for task 1:** the folder link.

### 2. The dress rehearsal (35 min)

Find a friend who hasn't seen your capstone (your day 54 viewers don't count). Recreate tomorrow as closely as you can:

1. Send them your actual launch post — trailer attached — the way a stranger would see it in a feed.
2. Ask them to think out loud while they decide whether to click.
3. Watch them go **post → video → follow**. Do they click? Where do they stop watching? Do they subscribe, follow,
   or visit your service page — and if not, why not?
4. Ask afterwards: *What is this? Who is it for? What would make you come back next week?*

Write down the time, the drop points, their answers, and anything that broke (a dead link, a thumbnail that crops
badly on their phone, captions that don't show). Fix at most **one** thing tonight. Everything else goes to v1.0.1.

**Proof for task 2:** your notes, including whether they followed and why.

> **Tip:** test the post on a *different* phone from yours. Link previews, thumbnails and autoplay look different on
> different apps and operating systems, and your launch audience will use all of them.

### 3. What does success mean? (15 min)

Write it down now — or tomorrow your mood will rewrite it. Three lines:

- **A number you control:** "I reply to every comment in the first 24 hours."
- **A number you hope for:** "500 views across platforms, 50% retention at 30 s, 20 new followers."
- **A feeling:** "I'd proudly send this link to my next client."

Only the first is guaranteed. The last is the one you'll talk about on day 66. **Proof for task 3:** your three lines.

## You're done when…

- [ ] Masters, delivery files, thumbnails, QC reports and licences are in one folder; the pipeline is tagged v1.0.0; link pasted.
- [ ] A friend did the full dry run; drop points, follow decision and their answers are written down.
- [ ] You defined success in three lines.

**Tomorrow:** launch day. Everything's ready. So are you.
