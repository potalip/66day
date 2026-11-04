---
day: 9
track: common
phase: 1
title: "Your first AI API call"
summary: "Get an API key with a spend limit, keep it out of git, and make two AI models answer the same question side by side."
estMinutes: 90
badges: [first-ai-call]
resources:
  - "https://docs.anthropic.com/en/api/getting-started"
  - "https://openrouter.ai/docs"
  - "https://12factor.net/config"
tasks:
  - id: d09-t1
    type: read
    title: "Get the map: models, tokens and prices"
    xp: 10
    proof: none
  - id: d09-t2
    type: build
    title: "Create a key, cap your spending and lock the key in .env"
    xp: 30
    proof: text
  - id: d09-t3
    type: build
    title: "Write a script that asks two models the same question"
    xp: 50
    proof: file
  - id: d09-t4
    type: reflect
    title: "Decide which model you'd use for what, and why"
    xp: 15
    proof: text
---

Yesterday you knocked on a free door. Today's door costs money per knock, so it wants a key — and that key is the
first real secret you'll own as a builder. By the end of the session you'll have a small script that sends one prompt
to two different AI models and prints both answers next to each other, with what each one cost you. Every AI feature
you build later is this script wearing nicer clothes.

## The beginner's map

**A model** is the AI you're talking to. Providers sell them in **tiers**:

- **Fast and cheap** — great for short, simple jobs: sorting, tagging, rewriting a sentence.
- **Balanced** — the everyday default. For Claude that's `claude-sonnet-5-5`.
- **Heavy and smart** — slower and pricier, for hard reasoning and long, tricky tasks. For Claude: `claude-opus-5-5`.

Other families follow the same pattern: OpenAI's GPT models, Google's Gemini, and open-weight models (Llama, Qwen,
DeepSeek and friends) served by OpenRouter or Groq. Names change every few months, so always check the provider's
current model list instead of trusting a blog post from last spring.

**Tokens** are how models read and how you pay. A token is a chunk of text — roughly three quarters of an English word.
You pay separately for **input** tokens (your prompt) and **output** tokens (the answer); output usually costs several
times more. Prices are quoted per million tokens.

Estimating is simple arithmetic. Suppose a pricing page said $2 per million input and $10 per million output (made-up
numbers — look up the real ones). A 300-token prompt with a 700-token answer costs
300 × 2 / 1,000,000 + 700 × 10 / 1,000,000 = $0.0076. Under a cent. Now multiply by 1,000 users a day, and you see why
tiers matter.

## Step by step

### 1. Key, limit, `.env` (30 min)

Pick one route:

- **Claude directly:** sign up at the Anthropic Console, add a small amount of credit, create an API key.
- **OpenRouter:** one key that reaches models from many providers, including Claude. Handy for comparing families.

Then, before anything else, **set a spend limit**. In the Anthropic Console look for the limits section of your
organization settings; on OpenRouter you can put a credit limit on each key. Start tiny — $5 a month is plenty for
this whole phase. Prepaid credit is a second safety net: you can't spend what isn't there.

> **Safety:** an API key is a password that spends your money. Never paste it into a chat (including your coding
> agent), a screenshot, a commit or a public page. If it ever leaks, delete it in the console and make a new one —
> that takes 30 seconds, so don't hesitate.

Now let the agent prepare the folder, without ever seeing the key:

```text
Goal: set up a new folder ai-compare/ for a Node.js script that calls an AI API.

Constraints:
- Create .gitignore that ignores .env and node_modules.
- Create .env.example with an empty ANTHROPIC_API_KEY= line (or OPENROUTER_API_KEY= — I use <provider>).
- Never open, read or print .env. I will create it myself.
- git init and make a first commit.

Done when: git status is clean and .env is listed in .gitignore.
```

Copy `.env.example` to `.env` yourself, open it in your editor and paste the key after the `=`. Then check git really
ignores it:

```bash
git check-ignore -v .env
git status
```

The first command should print the `.gitignore` line that matches; the second shouldn't mention `.env` at all.

**Proof:** describe your setup in words — provider, the spend limit you set, and the output of `git check-ignore -v .env`.
No key, not even part of it.

### 2. One prompt, two models (50 min)

```text
Goal: a script compare.mjs that sends the same prompt to two models and prints both answers side by side.

Context: Node.js, no frameworks. The key is in .env; run it with node --env-file=.env compare.mjs.
Provider: <Anthropic Messages API | OpenRouter chat completions>. Models: <claude-sonnet-5-5> and <claude-opus-5-5>
(or two models from different families on OpenRouter). Check the provider's current docs for the exact request format.

Constraints:
- Prompt comes from the command line: node --env-file=.env compare.mjs "Explain DNS to a 10-year-old in 3 sentences"
- For each model print: model name, the answer, input and output tokens (from the response's usage field),
  seconds it took, and estimated cost using price constants at the top of the file that I fill in from the pricing page.
- If the key is missing, print "No API key found in .env" and exit — no stack trace.
- max_tokens around 400 so a mistake can't burn money.
- Never print the key.

Done when: I run it and see two labelled answers with tokens, time and cost.
```

Open the provider's pricing page and type the real prices into the constants. Run it with three different prompts: a
simple one, a creative one, and a tricky one ("A bat and a ball cost $1.10 in total…").

> **If you're stuck:** `401` means the key is wrong or not loaded — check `.env` has no quotes or spaces around the key
> and that you ran with `--env-file=.env` (Node 20.6+). `404` or "model not found" means a model id is outdated:
> check the current model list. `429` means slow down or top up.

**Proof:** a screenshot of the terminal with both answers visible.

### 3. Which model for what? (15 min)

Look at your three runs. Write three or four sentences: where was the cheap one good enough? Where did the
smart one earn its price? How many of your calls would you send to each tier in a real app?

**Proof:** paste those sentences.

## You're done when…

- [ ] You can explain tokens, input vs output pricing and model tiers to a friend.
- [ ] You have a key with a spend limit, stored only in `.env`, and `git check-ignore` proves it.
- [ ] Your script prints two answers with tokens, time and cost — screenshot uploaded.
- [ ] You wrote down which tier gets which kind of job, and pasted it.

**Tomorrow:** things will break — and you'll learn the calm, boring method that fixes them.
