---
day: 12
track: common
phase: 1
title: "Taste both tracks, then choose"
summary: "Thirty minutes upgrading your app, thirty minutes rendering your first video from code, then you pick your road."
estMinutes: 90
badges: [track-picked]
resources:
  - "https://ffmpeg.org/documentation.html"
  - "https://pillow.readthedocs.io/"
  - "https://fonts.google.com/"
  - "https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share"
tasks:
  - id: d12-t1
    type: build
    title: "App taste: add a share button and AI-made titles to your tool"
    xp: 30
    proof: file
  - id: d12-t2
    type: build
    title: "Video taste: render a 5-second animated title with Python and ffmpeg"
    xp: 30
    proof: file
  - id: d12-t3
    type: reflect
    title: "Pick your track and say why"
    xp: 15
    proof: text
  - id: d12-t4
    type: share
    title: "Start your public build log"
    xp: 20
    proof: link
---

From day 15 the road forks. The **apps** track builds full-stack AI products and bots. The **video** track makes
videos entirely from code — motion graphics, voice, captions, all the way to your own one-command pipeline. Both use
the same agent skills you've been sharpening. Today you spend half an hour on each, notice which one made you lose
track of time, and choose.

## How to taste fairly

Use a timer: 30 minutes each, no more. Don't judge by which result looks better — first attempts always look rough.
Judge by three questions:

- Which one did I want to keep tweaking when the timer rang?
- Which one would I happily do on a tired Thursday evening?
- Which result would I rather show a stranger in a month?

Your choice isn't a prison: the skills overlap, and plenty of people end up doing both. But for the next seven weeks,
focus wins.

## Step by step

### 1. App taste: share + AI title (30 min)

Open yesterday's AI tool in the agent:

```text
Goal: two small upgrades to my AI tool.

1. AI-made title: every result also gets a short, catchy title (max 6 words) shown above it.
   Get it in the same API call: ask the model to return JSON with "title" and "text" fields, and parse it
   safely — if parsing fails, show the text with a plain default title.
2. Share button: under the result. On phones use the Web Share API (navigator.share) with the title and text;
   where it isn't supported, copy "title + text + link to the tool" to the clipboard and show "Copied!".

Constraints: keep the key on the server as it is now; keep the design consistent; works at 390px wide.
Done when: it works locally, then deploy with npx wrangler deploy and commit.
```

Test it on your phone — the share sheet only appears there (and in some desktop browsers).

**Proof:** a screenshot of a result with its AI title and the share button.

### 2. Video taste: a 5-second animated title (30 min)

You'll make a video without opening a video editor. The idea is how cartoons work: draw 150 still pictures, each
slightly different, then play them at 30 frames per second. Python draws the frames, ffmpeg (installed on day 3)
glues them into an mp4.

Make a new folder in your home folder and open the agent there:

```bash
cd ~
mkdir title-card
cd title-card
claude
```

```text
Goal: render a 5-second animated title card as an mp4, entirely from code.

Context: Python 3 and ffmpeg are installed. New folder, nothing else here. Create a virtual environment in .venv,
install Pillow into it (a plain pip install is often blocked on macOS and Linux), and tell me the exact commands
to activate it and run the script on my operating system.

Spec:
- 1080x1920 (vertical), 30 fps, 150 frames, dark background (#0f1412).
- Big title "<YOUR NAME> · Day 12 of 66" in white, centred. Smaller subtitle below: "<one line about your journey>".
- Motion: 0–1 s the title slides up 80 px and fades in with an ease-out curve; 0.5–1.5 s the subtitle fades in;
  1–2 s a green (#3ecf8e) underline grows from the centre to the title's width; 2–4.5 s hold; 4.5–5 s everything fades out.
- Font: download a free font from Google Fonts (e.g. Inter or Manrope) into fonts/; if it's missing,
  fall back to Pillow's default font at a large size, so the script never crashes.
- Script render.py writes frames to frames/frame_0000.png … then calls ffmpeg:
  ffmpeg -y -framerate 30 -i frames/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 title.mp4
- Put the timing numbers as named constants at the top so I can tweak them.

Done when: python render.py produces title.mp4 that plays in my normal video player.
```

Watch it. Then change one constant — make the slide slower, or the colour gold — and render again. That loop
(tweak a number, re-render, look) is the heart of the video track.

> **If you're stuck:** "externally-managed-environment" from pip means you skipped the virtual environment —
> ask the agent to set up `.venv` as the prompt says. If the video plays on your laptop but not on your phone, the `-pix_fmt yuv420p` flag is
> missing. If the text is tiny, the font file wasn't found — check the path the script prints. If `ffmpeg` is "not
> found", reopen the terminal or revisit day 3.

**Proof:** upload `title.mp4`.

### 3. Choose (15 min)

Write three or four honest sentences: which track you pick, what made the difference, and one thing you hope to have
built by day 35. If it's not the track you chose when you signed up, switch it in your FlowLeaf profile so day 15 opens the right lessons.

**Proof:** paste your sentences.

### 4. Start your public build log (20 min)

A **build log** is a public diary of what you make: short posts, often, with something to look at. It keeps you
honest, it collects people who'll want your work later, and on day 57 it turns into portfolio material for free.

Pick one home: a thread on X or Threads, LinkedIn posts, Bluesky, or a `BUILDLOG.md` in a public GitHub repo.
First entry, in this shape:

- One line: who you are and that you're 12 days into building with AI agents.
- What you shipped so far, with links: promise page, live-data version, the AI tool.
- Your video or screenshot from today.
- The track you picked and what you're building next.

> **Tip:** post the video natively (upload the mp4) rather than linking to it. Platforms show uploaded video to far
> more people.

**Proof:** the link to your first entry.

## You're done when…

- [ ] Your tool shows AI titles and a share button — screenshot uploaded.
- [ ] `title.mp4` rendered from code and plays — file uploaded.
- [ ] You picked a track, said why, and your profile shows it.
- [ ] Your build log has its first public entry — link pasted.

**Tomorrow:** the boss of phase 1 — one real person, one real annoyance, solved by you.
