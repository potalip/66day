---
day: 48
track: video
phase: 3
title: "Open-source your templates"
summary: "Publish your best template as a repo a stranger can run in three commands, then give one small thing back to a video tool."
estMinutes: 75
resources:
  - "https://choosealicense.com/"
  - "https://docs.github.com/en/get-started/start-your-journey/hello-world"
  - "https://www.remotion.dev/docs/"
  - "https://docs.manim.community/en/stable/"
tasks:
  - id: d48-video-t1
    type: read
    title: "Learn what makes a repo inviting"
    xp: 10
    proof: none
  - id: d48-video-t2
    type: build
    title: "Publish a template repo with a README and sample renders"
    xp: 40
    proof: link
  - id: d48-video-t3
    type: build
    title: "Make one small contribution to a video-tool community"
    xp: 30
    proof: link
  - id: d48-video-t4
    type: reflect
    title: "Write what you'd want a stranger to notice first"
    xp: 15
    proof: text
---

Everything you've used for 47 days, from ffmpeg to Remotion to Whisper, exists because someone published their work and
wrote a README. Today you join them. A public template repo is also the best portfolio piece a video engineer can
have: a client can *see* the output and *read* how you think, in one link.

## What makes a repo inviting

People decide in about 30 seconds. In that time they look at:

1. **A moving picture at the top.** A GIF or short mp4 of what the template makes. Video people judge with their eyes.
2. **One sentence of what and for whom.** "A Remotion template that turns a JSON list of tips into 9:16 shorts with
   captions and brand colours."
3. **Quickstart in three commands.** Clone, install, render. If it needs an API key, say which, and ship a
   `.env.example` with no real values.
4. **Inputs and outputs.** An example JSON and the exact file it produces. Render time and rough cost per video if
   it calls paid APIs.
5. **A licence.** Without one, nobody may legally reuse your code. MIT is the common choice for templates.

Two traps specific to video repos:

- **Assets aren't yours to relicense.** Your code can be MIT; the music you downloaded can't. Ship CC0 or your own
  sample assets, or tell users where to get them. Fonts under the Open Font License can usually be included with
  their licence file.
- **Your dependencies have licences too.** Remotion, for example, is free for individuals and small teams but requires
  a company licence for larger companies. Link to its licence page in your README instead of promising "free for
  everyone". Check the current terms.

## Step by step

### 1. Pick and clean the template

Choose the piece you're proudest of: the series template from day 38, the brand kit, the clipper, the QC stage. Strip
client names and private data.

```text
Goal: turn <folder> into a public, open-source-ready template repo.
Do:
1. Remove secrets, client names, private paths. Add .env.example and make sure .gitignore covers .env, out/, cache/.
2. Replace licensed assets with CC0 or self-made samples (or download instructions). List all assets in ASSETS.md with source and licence.
3. README: one-line pitch, sample GIF at the top, quickstart in 3 commands, example input JSON, what it outputs, render time on my machine, API cost per video if any, how to change brand config, licence section that also names the licences of key dependencies.
4. Add LICENSE (MIT) with my name and the year.
5. Make sure a fresh clone works: delete node_modules / venv, follow only the README, render the sample.
Done when: a clean clone renders the sample by following the README alone.
```

Make the GIF from a sample render (the two-pass palette keeps colours clean and the file small):

```bash
ffmpeg -i out/sample.mp4 -t 6 -vf "fps=12,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" docs/sample.gif
```

Push to a public GitHub repo, add topics like `remotion`, `ffmpeg`, `video-automation`. Paste the repo link.

> **If you're stuck:** the GIF is 30 MB? Shorten it (`-t 4`), lower the fps to 10 or the width to 360. Or embed an
> mp4: GitHub plays videos dragged into a README edited on the website.

### 2. Give one thing back

Small is perfect. Pick one:

- Fix a typo, a broken link or an unclear sentence in the Remotion, Manim or Motion Canvas docs (all on GitHub; look
  for "Edit this page").
- Answer a question in a tool's GitHub Discussions with a tested snippet.
- Open a clear bug report with a minimal reproduction for something that tripped you up.
- Add a short recipe to the ffmpeg wiki or a "how I did X" example to a tool's showcase thread.

```text
I want to make one small, useful contribution to <tool>. Look at the docs page I struggled with: <URL>.
Suggest 3 concrete improvements (typo, missing example, outdated command). For the best one, draft the change following the project's CONTRIBUTING guide, and the PR description. I'll review and submit it myself.
```

Submit it yourself, in your own words. Maintainers can tell an AI drive-by from a person who actually hit the
problem. Paste the PR, issue or answer link.

### 3. Reflect

Look at your repo as a stranger would, on a phone. What should they notice in the first ten seconds? Is it actually
the first thing they see? Write two or three sentences.

## You're done when…

- [ ] You know the five things a visitor checks and the two video-specific licence traps.
- [ ] The template repo is public, with README, GIF, licence, and a fresh-clone test passed; link pasted.
- [ ] One contribution link is pasted: PR, issue or answer.
- [ ] Your note on what a stranger should notice is written.

**Tomorrow:** rest. Then you choose the capstone you'll launch on day 65.
