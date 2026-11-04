---
day: 57
track: common
phase: 4
title: "Your portfolio site: 3–5 pieces, live today"
summary: "Build and deploy a one-page portfolio that tells a client in 30 seconds what you make and how to hire you."
estMinutes: 120
badges: [portfolio-live]
resources:
  - "https://docs.github.com/en/pages/getting-started-with-github-pages"
  - "https://developers.cloudflare.com/workers/"
  - "https://vercel.com/docs"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d57-t1
    type: read
    title: "Learn what clients look at in the first 30 seconds"
    xp: 10
    proof: none
  - id: d57-t2
    type: build
    title: "Build and deploy your portfolio site"
    xp: 70
    proof: link
  - id: d57-t3
    type: build
    title: "Get 2 reviews and note what you changed"
    xp: 20
    proof: text
---

For eight weeks you've been making things. Starting today, you also make it easy for someone to *pay* you for
making things. That starts with one link you can paste anywhere: a portfolio that does its job in 30 seconds while
your capstone beta keeps running in the background.

## What clients look at in 30 seconds

A busy client opens your link between two meetings. In order, they check:

1. **What do you make, for whom?** One sentence at the top. "I build AI-powered tools and Telegram bots for small
   businesses" beats "Hi, I'm Alex, a passionate creator".
2. **Is the first piece good?** They look at one, maybe two. Put your strongest work first.
3. **Is it real?** A live link they can click, a video that plays right there. Screenshots alone feel like mock-ups.
4. **How do I reach you?** Email or a messenger handle, visible without scrolling to the very bottom.

What they skip: skill bars ("JavaScript 80%"), long bios, lists of tools. Show the result, mention the tools in one
line per piece. And be honest that you build with AI coding agents — directing them well *is* the skill you're
selling, and clients increasingly ask for it.

## Step 1 — Pick and prepare 3–5 pieces (25 min)

Start from your day-35 seeds, add the day-41 client work and your capstone beta. For each piece write: title, a
one-line result ("cut booking messages by half for a 2-person studio"), your role, built with, link.

**Apps people:** each piece needs a live URL, a screenshot, and ideally a 5–8-second clip of the main flow.
Your agent can take clean screenshots with Playwright (`npx playwright install chromium` once, then
`npx playwright screenshot --viewport-size=1280,800 https://your-app.example.com shot.png`).

**Video people:** your reel *is* the product, so it must play instantly. Make a light, muted preview and a poster
frame for each piece; link the full version on YouTube or Vimeo:

```bash
# poster frame at 3 seconds
ffmpeg -ss 3 -i explainer.mp4 -frames:v 1 -q:v 3 explainer.jpg
# 8-second silent preview, 720p, web-friendly
ffmpeg -ss 0 -t 8 -i explainer.mp4 -vf "scale=-2:720" -c:v libx264 -pix_fmt yuv420p -crf 28 -preset slow -an -movflags +faststart explainer-preview.mp4
```

Aim for previews under ~5 MB each. GitHub blocks files over 100 MB and Cloudflare Pages caps single files at 25 MiB,
so full-length masters belong on a video platform, not in your repo.

## Step 2 — Build it with your agent (30 min)

Create a new repo (`portfolio`) and paste:

```text
Goal: a one-page portfolio site that tells a client in 30 seconds what I make and how to hire me.
Context: I'm a beginner who builds with AI coding agents (my track: apps or video — see the pieces).
Keep the pieces in projects.json so I can add more later without touching the layout.
Pieces: (paste your 3–5 pieces: title, one-line result, role, built with, link, image or preview path)
Constraints: static site (plain HTML/CSS/JS or Vite, your choice, explain why in one line); mobile-first; light and dark theme following the system; strongest piece first and largest; video previews autoplay muted, loop and have a poster; contact (email + one messenger) in the hero and footer; proper title, meta description and an Open Graph image; loads fast — no heavy frameworks for a single page.
Done when: it runs locally, looks right at 390px and 1280px wide, and you tell me how to deploy it.
```

Look at it on your phone-width window, not just your laptop. Ask for changes in screenshots-and-sentences — "what
and where", the way you briefed your promise page on day 1.

## Step 3 — Deploy (15 min)

Pick one; your agent knows all three:

- **GitHub Pages** — what you did on day 2. Settings → Pages → deploy from `main`.
- **Cloudflare** or **Vercel** — connect the repo, every push redeploys. Nice if you want a custom domain later.

```bash
git add -A && git commit -m "Portfolio v1" && git push
```

> **If you're stuck:** a 404 on GitHub Pages is almost always the wrong branch or folder in Settings → Pages, or a
> build output folder (like `dist`) that isn't the one being published. Paste the exact Pages settings and your
> folder tree to the agent and ask it to check both.

## Step 4 — Two reviews (20 min)

Send the link to two people: one who builds (a FlowLeaf peer) and one who could be a client (a shop owner, a
creator, a manager friend). Ask exactly this:

```text
Can you open this for 30 seconds and then tell me: what do I do, which piece did you look at, and would you know how to contact me? Brutal is fine.
```

Change at least one thing based on what they said, then push again.

## You're done when…

- [ ] You read what clients check in 30 seconds.
- [ ] Your portfolio is live with 3–5 pieces; you pasted the link.
- [ ] You pasted both reviews in a line each and what you changed.

Tomorrow: turn your best piece into a case study and cut a 60–90-second demo.
