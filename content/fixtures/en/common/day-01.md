---
day: 1
track: common
phase: 1
title: "Meet your coding agent"
summary: "Install a coding agent and get it to build a one-page site that says hello in your name."
estMinutes: 60
resources:
  - https://docs.anthropic.com/en/docs/claude-code/overview
tasks:
  - id: d01-t1
    type: read
    title: "Read the lesson and set up your workspace"
    xp: 10
    proof: none
  - id: d01-t2
    type: build
    title: "Ask the agent to build a one-page \"Hello, I'm …\" site"
    xp: 30
    proof: text
  - id: d01-t3
    type: share
    title: "Post a screenshot of your page and say you've started"
    xp: 20
    proof: link
    optional: true
---

## What a coding agent actually is

A coding agent is an AI that can **read files, write files and run commands** on your computer — with your permission.
You describe what you want in plain language; it plans, writes the code, runs it, and fixes its own mistakes.
Your job is not to type code. Your job is to be a clear client: say what you want, look at the result, ask for changes.

That's the whole skill you'll train for 66 days. Today is the first rep.

## Set up (15 minutes)

1. Create an empty folder called `flowleaf-66` somewhere easy to find.
2. Open a terminal in that folder.
3. Install the coding agent by following its official guide (link below), then start it inside the folder.

> **Tip:** If the terminal feels scary, that's normal. You will only ever need a handful of commands, and the agent can explain any of them.

## Your first prompt

Copy this, replace the parts in brackets, and send it:

```
Create a single index.html page that introduces me.
My name is [your name]. I'm starting a 66-day challenge to learn to build with AI.
Make it clean and calm: one heading, two short paragraphs, a soft background color.
Then tell me how to open it in my browser.
```

Open the file. Now ask for **one** change — a different color, a photo placeholder, a line about why you're doing this.
Notice how the agent edits the existing file instead of starting over.

## You're done when…

- the agent is installed and runs in your folder;
- you have an `index.html` with your name on it, open in the browser;
- you've written one or two sentences below about what surprised you.
