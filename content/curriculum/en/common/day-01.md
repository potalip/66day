---
day: 1
track: common
phase: 1
title: "Hello, agent: your first page in 30 minutes"
summary: "Install a coding agent and have it build your personal 66-day promise page — on your own computer, today."
estMinutes: 75
badges: [hello-agent]
resources:
  - "https://docs.anthropic.com/en/docs/claude-code/overview"
  - "https://developer.mozilla.org/en-US/docs/Learn"
tasks:
  - id: d01-t1
    type: read
    title: "Learn what a coding agent is (and isn't)"
    xp: 10
    proof: none
  - id: d01-t2
    type: build
    title: "Install a coding agent and say hello in a new folder"
    xp: 40
    proof: text
  - id: d01-t3
    type: build
    title: "Have the agent build your 66-day promise page"
    xp: 40
    proof: file
  - id: d01-t4
    type: reflect
    title: "Write why you're here and what you'll build by day 66"
    xp: 15
    proof: text
---

In the next half hour you'll go from "I don't code" to a real web page on your screen that you described in plain
words. It won't be a toy: it's the page you'll put online tomorrow, and it carries the promise you're making to
yourself for the next 66 days.

## What a coding agent is (and isn't)

A chatbot gives you code to copy. A **coding agent** works *inside a folder on your computer*: it reads files, writes
new ones, runs commands, looks at the result and tries again. Think of a fast, eager junior developer sitting at your
keyboard — you're the one who decides what gets built and whether it's good.

What it isn't: a mind reader or an oracle. It will confidently do the wrong thing if you're vague, and it asks
permission before touching files or running commands. Read those prompts; saying "yes" is your job now.

**The terminal** is the text window where you type commands. macOS: *Terminal* (Cmd+Space, type "Terminal").
Windows: *Terminal* or *PowerShell* from the Start menu. Linux: you probably know already (Ctrl+Alt+T on most).

## Step 1 — Install your agent (15 min)

We use **Claude Code** as the main example. It needs a **paid Claude plan (Pro or higher) or API credits** in the
Anthropic Console — the free plan doesn't include it. Plans change, so check the current page before paying.

Install it with the official native installer (no other software needed):

```bash
# macOS, Linux, or WSL
curl -fsSL https://claude.ai/install.sh | bash
```

```powershell
# Windows (PowerShell)
irm https://claude.ai/install.ps1 | iex
```

If you already have Node.js, `npm install -g @anthropic-ai/claude-code` works too. On Windows the installer may ask
for Git for Windows — install it with `winget install --id Git.Git -e`, then reopen the terminal.

Now make a project folder and start the agent there (one line at a time):

```bash
cd ~
mkdir 66-day-promise
cd 66-day-promise
claude
```

The first run asks you to pick a colour theme, opens a browser to log in, and asks whether you trust the files in
this folder — it's your own empty folder, so yes. Then type `hi, what can you do in this folder?` and press Enter.

> **Other agents work too.** OpenAI's Codex CLI, Google's Gemini CLI, or an AI editor like Cursor all do the same
> job. Every prompt in this program is written for "any capable agent". Install whichever you have access to by
> following its official docs.

> **If you're stuck:** "command not found" right after installing almost always means the terminal needs a
> restart. Close it, open a new one, try `claude --version`. If the installer printed a line about adding a folder
> to your PATH, run exactly that line first. Still nothing? Paste the exact error into
> claude.ai (or any chatbot) and ask what it means — that's a legit skill, not cheating.

**Proof:** paste the output of `claude --version` (or your agent's version) and its first reply.

## Step 2 — Build the promise page (15 min)

Copy this prompt, rewrite the "About me" part so it's about *you*, and paste it into the agent:

```text
Goal: build a one-page website called "My 66-day promise" in this folder.

About me: my name is Alex. I'm learning to build apps and videos with AI coding agents,
one or two hours a day, for 66 days starting today. By day 66 I want to have built
a small app that helps my sister book clients for her nail studio.

Content: a big headline with my promise, a short "why I'm doing this" paragraph,
what I want built by day 66, today's date as the start date, and a grid of 66 small
squares (the first one filled in) to show progress.

Constraints: a single index.html file with the CSS inside it, no frameworks, no images
from the internet. Calm and beautiful: lots of white space, one accent color, nice
typography from the system font stack, readable on a phone. Support light and dark
mode automatically.

Done when: index.html exists and you have opened it in my default browser.
```

Approve the agent's requests to create the file. If it doesn't open the page itself, do it:

```bash
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

Don't love something? Just say so, like you would to a designer: `make the headline bigger and the squares round`,
`the green looks like a hospital, try a warm leaf green`. Two or three rounds is normal.

**Proof:** a screenshot of the page in your browser.

> **Tip:** the agent can't see your screen. When something looks off, describe *what* and *where*: "on my phone-sized
> window the grid overflows to the right".

## Step 3 — Write it down (10 min)

Answer in 3–5 honest sentences: why are you here, and what exactly do you want to have built by day 66? A specific
"a bot that reminds my football team about matches" beats "something with AI". You'll reread this on day 66.

## You're done when…

- [ ] You know the difference between a chatbot and a coding agent (and who's in charge).
- [ ] You pasted your agent's version and its first reply.
- [ ] You uploaded a screenshot of your promise page open in the browser.
- [ ] You wrote why you're here and what you'll build by day 66.

**Tomorrow:** this page gets a real address on the internet that you can send to anyone.
