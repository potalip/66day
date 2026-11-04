---
day: 31
track: video
phase: 2
title: "The LLM as your screenwriter"
summary: "Turn any topic into a validated storyboard JSON — scenes, voiceover, visuals, timings — and pick the hook with a rubric, not a vibe."
estMinutes: 75
resources:
  - "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview"
  - "https://docs.anthropic.com/en/api/getting-started"
  - "https://www.json.org/json-en.html"
tasks:
  - id: d31-video-t1
    type: read
    title: "Learn three script structures that hold attention"
    xp: 10
    proof: none
  - id: d31-video-t2
    type: build
    title: "Turn a topic into storyboard JSON with a prompt and a schema"
    xp: 50
    proof: text
  - id: d31-video-t3
    type: build
    title: "Write 5 hooks and score them against a rubric"
    xp: 30
    proof: text
  - id: d31-video-t4
    type: reflect
    title: "Write down what you overruled the model on"
    xp: 15
    proof: text
---

Yesterday your editor learned to read JSON. Today you hire the writer who produces that JSON: a language model that
turns "a topic" into scenes, voiceover lines, visual instructions and durations. The model is fast and tireless. It is
also bland by default. Your job is to give it structure, then overrule it where it plays safe.

## Structures that hold attention

You don't need screenwriting school. Three shapes cover almost every short explainer:

- **Hook → promise → three beats → payoff.** "Your phone knows where you are without GPS. Here's how, in three steps."
  Each beat answers one question; the payoff ties back to the hook.
- **But / therefore.** Every scene connects to the previous one with "but" (a twist) or "therefore" (a consequence),
  never "and then". "Satellites send a time signal. *But* a microsecond error is 300 metres. *Therefore*…"
- **Myth → reveal → proof.** Start with what everyone believes, break it, show the evidence.

Two rules for every structure: something on screen changes every 2–4 seconds, and the first sentence must be
understandable with the sound off (that's what on-screen text is for).

**Why a schema?** A model asked for "a script" returns prose you have to chop up by hand. A model given a **JSON
schema** returns data your pipeline can use directly: each scene has a duration, a voiceover line and a visual
instruction your renderer understands. And you can check it with code — e.g. voiceover speed. English narration runs
at roughly 2.5 words per second; a 4-second scene with 18 words will sound like an auctioneer.

## Step by step

### 1. Write the schema and the screenwriter

```text
Goal: a script storyboard.py that turns a topic into storyboard.json, validated against a schema.
Context: my video workspace. Claude API key in .env as ANTHROPIC_API_KEY; model from env CLAUDE_MODEL,
default claude-sonnet-5-5. My renderers can do these visual kinds: "template" (title, lower_third, list),
"chart" (data file + chart type), "diagram" (Manim/Remotion scene name), "ai_clip" (prompt for gen_clips.py).
Schema (write it as schema/storyboard.schema.json and as a pydantic model):
  title, audience, duration_s, aspect ("16:9" | "9:16"),
  hooks: 5 strings,
  scenes: [{ id, duration_s, vo, on_screen_text (<= 6 words), visual: { kind, ... } , sfx? }]
Constraints:
- Use the API's structured output / tool-use feature so the reply must match the schema; still validate locally.
- Code checks after validation: scene durations sum to duration_s (±2 s); each vo has <= 2.7 words per second
  of its scene; no scene longer than 6 s. On failure, send the errors back to the model once and retry.
- If ANTHROPIC_API_KEY is missing, print "AI not configured" and copy fixtures/storyboard.example.json instead.
- Save the prompt you sent next to the output (storyboard.prompt.txt) so I can diff prompts later.
Done when: python storyboard.py "how your phone finds you without GPS" --seconds 45 writes a valid storyboard.json.
```

Run it on a topic you actually care about — ideally the next video for your channel. Open `storyboard.json` and read
only the `vo` lines aloud, with a timer. Paste the full JSON (or the first 3 scenes if it's huge) as proof.

> **If you're stuck:** if the speed check keeps failing, the model is cramming facts. Add to the prompt: "One idea per
> scene. Cut adjectives first." If the JSON is valid but every visual is `ai_clip`, list in the prompt what each kind is
> *for* ("chart: anything with a number").

> **Tip:** the system prompt is part of your product. Keep it in a file (`prompts/screenwriter.md`) and commit it.
> Changes to it are as important as changes to code.

### 2. Score the hooks

The schema asked for 5 hooks. Now judge them with a rubric — 0, 1 or 2 points each:

| Criterion | 2 points means |
|---|---|
| **Specific** | a number, object or name ("300 metres", not "a lot") |
| **Gap** | opens a question the viewer wants closed |
| **Fast** | under 12 words, the point lands in 3 seconds |
| **Visual** | frame 1 can show it, not just say it |
| **Honest** | the video really delivers on it |

Ask the agent to add `score_hooks.py` that scores the hooks **in a separate API call**, as a judge that didn't write
them — models grade their own writing generously. Then score them yourself without looking at the model's numbers.
Paste a table: hook, model score, your score, one-word reason where you disagree.

### 3. Overrule

Change at least two things by hand in `storyboard.json`: the hook you'll actually use, a scene that tells instead of
shows, a fact you need to double-check, a joke that isn't funny. Write 3–5 sentences on what you overruled and why. This
is the most important skill of the day: the model drafts, you direct.

> **Important:** LLMs state wrong facts confidently. Every number in the voiceover gets a source in your notes before it
> goes into a render.

## You're done when…

- [ ] You can name three script structures and the "something changes every 2–4 s" rule.
- [ ] A schema-valid `storyboard.json` for a real topic is pasted (with the speed checks passing).
- [ ] Your hook table (5 hooks, model score vs your score) is pasted.
- [ ] You wrote what you overruled and why.

Tomorrow: you stop picking colours and fonts by hand — your brand becomes a config file.
