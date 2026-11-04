---
day: 22
track: apps
phase: 2
title: "Many models, one app: build an arena"
summary: "Run your app's real AI task on three models side by side, measure speed, cost and quality, and choose with numbers."
estMinutes: 90
badges: [model-whisperer]
resources:
  - "https://docs.anthropic.com/en/api/getting-started"
  - "https://platform.openai.com/docs"
  - "https://ai.google.dev/gemini-api/docs"
  - "https://openrouter.ai/docs"
tasks:
  - id: d22-apps-t1
    type: read
    title: "Map the model landscape and learn how to compare models"
    xp: 10
    proof: none
  - id: d22-apps-t2
    type: build
    title: "Build a model arena: 3 models side by side with latency and cost; paste the repo link"
    xp: 60
    proof: link
  - id: d22-apps-t3
    type: build
    title: "Pick the model for your app's feature and justify it with numbers"
    xp: 20
    proof: text
  - id: d22-apps-t4
    type: quiz
    title: "Do the cost math"
    xp: 15
    proof: none
---

Welcome back from the rest day. On day 18 you used one model because it was the default. But "the best model" is a
myth — there's only the best model *for this job, at this price, at this speed*. Today you build a small arena that
runs your app's real task on three models and puts numbers next to each answer. Then you choose like an engineer, not
like a fan.

## The landscape, and how to compare

Roughly four families you can call over an API (check each provider's current model list — names change monthly):

- **Anthropic Claude** — e.g. `claude-sonnet-5-5` as a strong default, `claude-opus-5-5` for heavy reasoning, plus a
  smaller fast tier.
- **OpenAI** — GPT models in several sizes.
- **Google Gemini** — big and "flash" tiers, very long context, good with images and audio.
- **Open-weight models** (Llama, Qwen, Mistral, DeepSeek and others) — served by companies like **OpenRouter** (one
  key, hundreds of models) or **Groq** (very fast).

Every provider has *tiers*: small/fast/cheap and large/smart/expensive. For a narrow job like "extract six fields from
a job posting", a small model is often just as accurate — at a tenth of the price.

Compare on four numbers, measured on **your** inputs, not on a leaderboard:

1. **Quality** — for structured output this is easy to measure: does the result pass your day-18 schema, and do the
   fields match what you'd have typed?
2. **Latency** — seconds from request to full answer. Users feel anything over ~3 seconds.
3. **Cost per call** — from the `usage` field in each response: input tokens × input price + output tokens × output price.
   Prices are listed **per million tokens** on each provider's pricing page.
4. **Reliability** — how often it errors or times out across, say, 10 runs.

## Step by step

### 1. Build the arena (50 min)

You need keys for the providers you test (spend limits on each!). Simplest route: one direct provider you already use
plus **OpenRouter**, which gives you the other two with a single key.

```text
Goal: a model arena for the AI feature from day 18 (the /api/extract task).

Context: our schema is in shared/schema.ts, the prompt in server/prompts/extract.ts.

Constraints:
- A CLI script arena/run.ts (run with `npm run arena`) — not part of the public app.
- Models come from arena/models.json: [{ id, provider, inputPricePerM, outputPricePerM }]. I will fill in the prices
  myself from the pricing pages; leave them as 0 with a TODO comment.
- Inputs: arena/inputs/*.txt — I'll add 5 real messy examples.
- For each model x input: send the SAME prompt and schema; record latency (ms), input/output tokens from the
  response usage, cost in USD, whether the output passes the Zod schema, and any error.
- Output: a table in the terminal plus arena/results.md with per-model averages (pass rate, median latency,
  average cost, errors). Keys from .env only.

Explain the plan first: how you'll call each provider (SDK or plain fetch), and how you compute cost. Wait for my OK.
At the end, run it with my 5 inputs, show the results table, and point out anything that looks suspicious.
```

Before running, open each provider's pricing page and fill in `models.json` yourself — reading a pricing page is a
skill. Pick three models from **at least two** families, including one small/cheap tier. Run the arena, commit
`arena/` (including `results.md`), push, and paste the repo link.

> **If you're stuck:** a model "fails" every time? Look at the raw response before blaming the model — often it's a
> wrong model id, a provider that needs a different structured-output parameter, or a 429 rate limit. Ask the agent
> to print the raw error for that model only.

### 2. Choose, with numbers (15 min)

Open `results.md`. Look at the outputs side by side, not just the averages — a model can pass the schema and still put
the company name in the role field. Then write your decision in this shape:

> For extraction I'm using **model X**: 5/5 schema passes, median 1.4 s, ~$0.0009 per call. Model Y was equally
> accurate but 3× the cost; model Z was fastest but missed the deadline field twice.

Update `CLAUDE_MODEL` (or your provider config) if the winner isn't your current model, and redeploy.

> **Tip:** keep the arena. Every time a new model ships, rerun it with your inputs. Ten minutes, and you know whether
> switching is worth it.

## Quiz: cost math

Use these made-up prices: model A costs $1 per million input tokens and $5 per million output tokens; model B costs
$3 and $15.

1. One extraction uses 1,500 input tokens and 300 output tokens. What does it cost on model A?
2. Same call on model B?
3. Three users each make 20 calls a day for 30 days. Monthly cost on A vs B?
4. You add a 2,000-token conversation history to every call. New per-call cost on A?

<details><summary>Answers</summary>

1. 1,500 / 1,000,000 × $1 = $0.0015, plus 300 / 1,000,000 × $5 = $0.0015. Total **$0.003**.
2. $0.0045 + $0.0045 = **$0.009** — three times more.
3. 3 × 20 × 30 = 1,800 calls. A: 1,800 × $0.003 = **$5.40**. B: 1,800 × $0.009 = **$16.20**.
4. Input becomes 3,500 tokens: $0.0035 + $0.0015 = **$0.005**. History is often the hidden cost driver.

</details>

## You're done when…

- [ ] You can name the four model families and the four numbers to compare.
- [ ] Your arena runs one task on 3 models and records latency, cost and pass rate — you pasted the repo link.
- [ ] You picked a model and justified it with your numbers.
- [ ] You did the cost math and checked it.

**Tomorrow:** your app learns to see and hear — photos and voice.
