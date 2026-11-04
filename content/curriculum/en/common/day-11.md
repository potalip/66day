---
day: 11
track: common
phase: 1
title: "A backend in an hour"
summary: "Your first AI tool goes live on the internet, with a tiny serverless backend keeping the API key out of sight."
estMinutes: 120
resources:
  - "https://developers.cloudflare.com/workers/"
  - "https://vercel.com/docs"
  - "https://owasp.org/www-project-top-10-for-large-language-model-applications/"
tasks:
  - id: d11-t1
    type: read
    title: "Understand why your key can't live in the browser"
    xp: 10
    proof: none
  - id: d11-t2
    type: build
    title: "Build a small AI tool with a serverless backend"
    xp: 50
    proof: text
  - id: d11-t3
    type: ship
    title: "Deploy it with the key stored as a secret"
    xp: 60
    proof: link
  - id: d11-t4
    type: share
    title: "Get one person to try it and write down their reaction"
    xp: 20
    proof: text
---

Your day 9 script works, but only on your laptop, only for you. Today it becomes a real tool with a URL that anyone
can open on their phone — and your API key stays hidden the whole time. This is the moment you go from "I ran a
script" to "I built a thing people use".

## Why the key can't live in the browser

Everything your page sends to a browser is public. Anyone can press F12, open the Network tab or view the source, and
read every line — including a key. Bots also scan GitHub for leaked keys around the clock and usually find them within
minutes. A key in front-end code is a credit card taped to a shop window.

The fix is a **backend**: a small piece of code that runs on a server you control. The browser sends the user's text
to your backend; the backend adds the key, calls the AI, and sends back only the answer. Think of a restaurant: guests
talk to the waiter, the waiter talks to the kitchen, and nobody gets to wander into the kitchen and grab the cash box.

**Serverless** means you don't rent or manage a whole server. You upload one function, the platform runs it whenever a
request arrives, and you pay nothing (or close to nothing) at small scale. Our main example is **Cloudflare Workers**:
generous free tier, fast deploys, and it can serve your HTML from the same place. **Vercel** functions are a fine
alternative — the idea is identical.

The key on the server is called a **secret**: an environment variable the platform stores encrypted and hands to your
code at run time. It's the grown-up version of yesterday's `.env`.

## Step by step

### 1. Pick a tiny tool (5 min)

One input box, one button, one useful answer. Some that work well:

- **Polite No** — paste a request you want to decline, get a kind, firm reply.
- **Plain English** — paste a confusing letter from a bank or landlord, get three bullet points of what it means.
- **Headline Doctor** — paste a post title, get five sharper versions.

Choose one you'd actually use this week. Real beats impressive.

### 2. Build it (50 min)

```text
Goal: a small web tool called <Tool name>: the user pastes text, clicks one button, and gets <what it returns>.

Context: deploy target is Cloudflare Workers (use the current Wrangler CLI and a wrangler config file).
The Worker serves a static index.html from a public/ folder AND handles POST /api/run.
The AI call happens only inside the Worker, using the secret ANTHROPIC_API_KEY (model claude-sonnet-5-5)
<or OPENROUTER_API_KEY — say which>. Check the current docs for the API request format.

Constraints:
- The key never appears in the front-end, in logs or in any response.
- Reject inputs longer than 2,000 characters with a friendly message. max_tokens around 500.
- If the key is missing, the API returns an error, or the call times out, show a calm human message, not a stack trace.
- Clean, mobile-first page: a title, one sentence explaining the tool, a textarea, a button, a result area with a
  "Copy" button, and a loading state on the button.
- For local dev, read the key from .dev.vars and make sure .dev.vars is in .gitignore.
- Explain the request flow in 5 short bullets when done.

Done when: npx wrangler dev runs it locally, I can use it at the printed localhost URL, and git status shows no secrets.
```

Read the five bullets: browser → `/api/run` → Worker adds the key → AI → Worker → browser. If you can say that flow out
loud, you understand backends.

Put your key into `.dev.vars` yourself (same format as `.env`), then:

```bash
npx wrangler dev
```

Try it with a normal input, an empty input and a ridiculously long one. Open DevTools → Network and click the
`/api/run` request: you should see your text going out and the answer coming back — and no key anywhere.

**Proof:** paste the main prompt you gave the agent (with your tool's details filled in).

> **If you're stuck:** if the page loads but the button does nothing, open the browser console first, then the
> terminal where `wrangler dev` runs — server errors show up there, not in the browser. Paste both to the agent.

### 3. Deploy with a secret (60 min)

```bash
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

`wrangler login` opens a browser to connect your Cloudflare account. `secret put` asks you to paste the key into the
terminal — not into a file, not into the chat. `deploy` prints a URL ending in `workers.dev`. Open it on your phone and
use the tool for real.

Then commit and push the code to a new GitHub repo — the secret stays on Cloudflare, not in git.

> **Tip:** prefer Vercel? Ask the agent to restructure the same tool as a Vercel project with a function in `api/`,
> add the key with `vercel env add` or in the project's settings, and deploy with the `vercel` CLI.

> **Safety:** a public AI tool can be spammed. Your day 9 spend limit is your safety net — check it's still on. If you
> share the link widely later, add rate limiting (ask the agent; check Cloudflare's current docs for options).

**Proof:** the live link.

### 4. One real person (20 min)

Send the link to one person who fits the tool — not your most polite friend, your most honest one. Ask them to use it
once without your help, then ask: "What did you expect to happen? What actually happened?"

**Proof:** their reaction in a few sentences, including the part you didn't want to hear.

## You're done when…

- [ ] You can explain why a key in front-end code is public.
- [ ] Your tool runs locally with `wrangler dev`, and you pasted your main prompt.
- [ ] It's live on a `workers.dev` (or Vercel) URL with the key stored as a secret — link pasted.
- [ ] One person tried it and you wrote down what they said.

**Tomorrow:** you taste both tracks — a quick app upgrade and your first code-made video — and pick your path.
