---
day: 36
track: video
phase: 3
title: "Publish like a pro: upload by code"
summary: "Your pipeline uploads its own videos through the YouTube Data API — with titles and descriptions written for each platform."
estMinutes: 90
resources:
  - "https://developers.google.com/youtube/v3"
  - "https://docs.anthropic.com/en/api/getting-started"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d36-video-t1
    type: read
    title: "Learn platform specs and the metadata that actually matters"
    xp: 10
    proof: none
  - id: d36-video-t2
    type: build
    title: "Upload a video with a script via the YouTube API (unlisted test)"
    xp: 50
    proof: link
  - id: d36-video-t3
    type: build
    title: "Let an LLM write titles and descriptions per platform"
    xp: 20
    proof: text
  - id: d36-video-t4
    type: quiz
    title: "Quiz: which spec for which platform?"
    xp: 15
    proof: none
---

Phase 3 is called "Ship" for a reason. Your pipeline can make a video in one command, but right now the last mile is
still you, dragging a file into a browser and typing a title at midnight. Today the pipeline learns to publish: proper
file specs, metadata written for each platform, and an upload through an official API.

## Specs and metadata

Every platform re-encodes what you upload, so give it a clean master: **H.264 video, AAC audio, `yuv420p`, constant frame
rate, `+faststart`** (so playback starts before the whole file downloads). Then match the shape:

| Where | Shape | Notes |
|---|---|---|
| YouTube | 16:9, 1080p or higher | chapters from timestamps in the description |
| YouTube Shorts | 9:16 | vertical and up to 3 minutes counts as a Short |
| TikTok, Instagram Reels | 9:16 | keep text out of the bottom ~20% |
| X, LinkedIn feeds | 1:1 or 16:9 | most people watch muted — captions burned in |

Limits change, so check each platform's help page before you trust a number.

**Metadata that matters:** the title (front-load the interesting part; ~60 characters show on phones), the first two
lines of the description (they show before "more"), chapters for anything over 2 minutes, and the thumbnail. Tags matter
far less than people think. And the **AI disclosure**: YouTube asks you to flag realistic altered or synthetic content
— the API has a status field for it (check the current docs for its name) — and TikTok and Instagram have similar labels.

**OAuth in one paragraph.** Uploading to *your* channel needs *your* permission, not just an API key. OAuth is the
"Sign in with Google" dance: your script opens a browser, you approve the scope `youtube.upload`, and Google gives your
script a token. The token lives in a local file that is never committed.

> **Important:** two gotchas. First, videos uploaded through an **unverified** API project may be locked to *private*
> until the project passes Google's free compliance audit. That's fine for today's test. Second, while your OAuth app is
> in "Testing" mode, tokens expire after about a week — re-run the sign-in when that happens.

## Step by step

### 1. Google Cloud setup (15 minutes, by hand)

1. Create a project in Google Cloud Console and enable **YouTube Data API v3**.
2. Configure the OAuth consent screen: external, testing mode, add your own Google account as a test user.
3. Create an OAuth client of type **Desktop app** and download the JSON as `client_secret.json`.
4. Add `client_secret.json` and `token.json` to `.gitignore` **before** anything else.

### 2. The upload script

```text
Goal: a publish stage for my pipeline: upload_youtube.py uploads runs/<slug>/final-16x9.mp4 to my YouTube channel.
Context: client_secret.json (Desktop OAuth client) is in the project root and gitignored. Use google-api-python-client
and google-auth-oauthlib. Scope: youtube.upload only.
Constraints:
- First run opens the browser for consent and saves token.json (gitignored); later runs refresh it silently.
- Read title, description, tags and privacy from runs/<slug>/metadata.json. Default privacy: unlisted.
- Set madeForKids false and the synthetic-media disclosure field when metadata.json says ai_footage: true
  (check the current videos resource docs for the exact field name).
- Resumable upload with a progress percentage; retry on 5xx with backoff; clear message on quota errors.
- Then set the custom thumbnail from thumbs/thumb-1.jpg (warn, don't crash, if the channel isn't allowed custom thumbnails).
- Print the video URL and save it to run.json.
- Add --dry-run that validates the file and metadata without uploading.
Done when: python upload_youtube.py runs/<slug> --dry-run passes, and a real run prints a youtu.be link.
```

Run `--dry-run`, then the real thing. Paste the link. If YouTube locked it to private, paste it anyway with a note.

> **If you're stuck:** `redirect_uri_mismatch` means you created a "Web" OAuth client instead of "Desktop". `quotaExceeded`
> means the project hit its daily quota — uploads are among the most expensive calls, so test with `--dry-run` and upload
> once. `access_denied` usually means you forgot to add yourself as a test user.

> **Safety:** `token.json` can upload to your channel. Treat it like a password: never commit it, never paste it into a
> chat, revoke it in your Google account if it leaks.

### 3. Metadata per platform

```text
Add a metadata stage: from storyboard.json and the transcript, ask the LLM (CLAUDE_MODEL, default claude-sonnet-5-5) for
metadata.json with: youtube {title <= 70 chars, description with a 2-line hook, chapters from scene start times,
5 tags}, shorts {title}, tiktok {caption <= 150 chars, 3 hashtags}, x {post <= 240 chars}. Add an AI disclosure line
when ai_footage is true. Validate lengths in code. Without an API key, build plain metadata from the storyboard title.
```

Paste the generated `metadata.json`. Then edit the YouTube title by hand: models love "Unlocking the secrets of…". You
don't.

## Quiz

1. Your 9:16 video is 2 min 40 s long. Can it be a YouTube Short?
2. Why `+faststart`?
3. Which file must never reach git: `client_secret.json`, `token.json`, or both?
4. Where do people decide whether to expand a YouTube description?

<details><summary>Answers</summary>

1. Yes — vertical and up to 3 minutes counts as a Short (check the current rule; it has changed before).
2. It moves the index to the start of the file so playback can begin before the download finishes.
3. Both. The client secret identifies your app; the token can act as you.
4. In the first two lines, before "more". Put the hook and the key link there.

</details>

## You're done when…

- [ ] You know the clean master spec and which shape each platform wants.
- [ ] A video was uploaded by your script; the link is pasted (unlisted, or private if the project is still unverified).
- [ ] `metadata.json` for four platforms is pasted, with at least one title you rewrote.
- [ ] Quiz done.

Tomorrow: the numbers come in. You'll find the exact second people leave — and fix it.
