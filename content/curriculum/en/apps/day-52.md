---
day: 52
track: apps
phase: 3
title: "Capstone build 2: the AI that matters"
summary: "Build the AI at the heart of your capstone, prove it with a 10-case eval, and learn what each user costs you."
estMinutes: 120
badges: [phase-3]
resources:
  - "https://docs.anthropic.com/en/api/getting-started"
  - "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview"
  - "https://openrouter.ai/docs"
tasks:
  - id: d52-apps-t1
    type: build
    title: "Build the core AI feature with a small eval and share the commit link"
    xp: 80
    proof: link
  - id: d52-apps-t2
    type: build
    title: "Estimate your cost per active user"
    xp: 20
    proof: text
  - id: d52-apps-t3
    type: share
    title: "Post your progress with a demo GIF"
    xp: 20
    proof: link
---

Yesterday your capstone learned to walk. Today it gets its brain — the AI step that makes people say "oh, *that's*
useful". And because you're building a product, not a demo, you'll do it like a professional: with an eval that
proves it works and a number that says what it costs. Tonight phase 3 ends.

## Three things a production AI feature needs

1. **A clear contract.** Input in, structured output out (JSON with a schema), validated on the server. Your UI never
   parses free-form prose.
2. **Proof.** A small eval — 10 cases is enough today — run with the harness you built on day 47. You'll grow it later.
3. **A price tag.** Every API response reports how many **input** and **output tokens** it used. Multiply by the
   provider's price per million tokens and you know what each call, each user and each month costs. Products that
   skip this step discover it on their credit-card statement.

## Step by step

### 1. Build the AI feature (55 min)

Replace yesterday's simple version or fixture with the real thing.

```text
Goal: implement the core AI step of my capstone: <what it does, e.g. "turn dad's constraints into a 7-day meal plan">.
Read docs/CAPSTONE.md for context. Requirements:
- Prompt lives in its own versioned file (prompts/<name>.v1.md), not inline in code.
- Model from env (CLAUDE_MODEL, default claude-sonnet-5-5). Structured JSON output validated against a schema; on invalid output, retry once, then show a friendly error.
- Guards: max input length, per-user rate limit (e.g. 20 runs/day), 30-second timeout.
- Log every call to the DB: user_id, prompt version, model, input_tokens, output_tokens, latency_ms, ok/error.
- Stream or show progress if it takes more than 2 seconds.
- If ANTHROPIC_API_KEY is missing: return a realistic fixture and show "AI not configured — demo result".
- Keep the core-loop e2e test green (the test mocks the AI).
Done when: the loop works on the live site with real AI output, and calls appear in the log table.
```

Try it with 5 inputs that real users would type. Messy ones. Note what's wrong.

> **If you're stuck:** if output quality is poor, don't add rules one by one. Show the model 2 good examples
> (input → ideal output) in the prompt; that fixes more than ten new instructions. If it's slow, check whether you
> need the smart model tier at all — many tasks run fine on the fast one.

### 2. A 10-case eval (25 min)

Reuse your day-47 runner. If your capstone is a new repo, copy it over.

```text
Create evals/capstone.jsonl with 10 cases for the new AI step: 6 typical (from the inputs I just tried: <paste>),
2 edge, 2 adversarial. Add deterministic checks (schema, limits, language, must_not) and an LLM-judge rubric of
3-4 yes/no questions specific to this feature. Run `npm run eval -- capstone-v1` and show the table.
```

Fix the top failure, re-run, and commit. Paste the commit link — the commit should contain the feature, the prompt
file and the eval with its results.

### 3. Cost per active user (20 min)

Pull real numbers from the log you just added:

```text
From our AI call log, compute: average input_tokens and output_tokens per call, and calls per active user per day from my own testing. Then write docs/COSTS.md: cost per call, per active user per month, and per 100 users, using the prices I'll paste from the provider's pricing page. Include retries, and note any other paid APIs we call.
```

Open your provider's **pricing page** and find the price per million input and output tokens for your model. The
maths, with pretend prices of $3 per million input and $15 per million output tokens:

- One call: 2,500 input × $3/1M + 600 output × $15/1M = $0.0075 + $0.009 ≈ **$0.017**
- One active user: 4 calls a day × 20 active days = 80 calls → **≈ $1.32 a month**
- If you plan to charge $5/month, after payment fees you keep a healthy margin. If a user costs more than they pay,
  you've learned it on day 52 instead of day 90 — perfect timing.

Levers if it's too high: a cheaper model tier, shorter prompts, prompt caching for the repeated part, fewer
calls per flow, or a free-tier limit. Paste your estimate with the numbers behind it.

### 4. Progress post with a GIF (15 min)

Record 10–20 seconds of the loop with the AI working and turn it into a GIF (the ffmpeg command from day 48). Post
where you announced on day 50:

```text
Day 52 of 66: <name> now <does the AI thing>. Here it is working ↓
What surprised me: <one honest line, e.g. the eval caught it inventing prices>.
Next: onboarding so a new user gets value in under 2 minutes. Beta testers, I'll message you on day 54.
```

Paste the link.

## Phase 3 is done

Look back: launch page, feedback loop, parallel agents, MCP, background jobs, a real client, a PWA, a Mini App,
dashboards, voice, evals, open source — and a capstone with a working, measured AI core. That's not "learning to
code". That's how product engineers work. The **phase-3** badge is yours.

## You're done when…

- [ ] The capstone's core AI step works live with structured output, guards and logging; the 10-case eval runs; you
      pasted the commit link.
- [ ] `docs/COSTS.md` has your cost per call and per active user per month, from real token numbers; you pasted it.
- [ ] Your progress post with a demo GIF is live and you pasted the link.

**Tomorrow:** phase 4 — a new user should get value from your capstone in under two minutes.
