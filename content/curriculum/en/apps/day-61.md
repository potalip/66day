---
day: 61
track: apps
phase: 4
title: "Productize yourself: a starter kit in 15 minutes"
summary: "Extract auth, database, AI and payments from your capstone into a starter kit that spins up a new project in under 15 minutes."
estMinutes: 90
resources:
  - "https://docs.github.com/en/get-started/start-your-journey/hello-world"
  - "https://docs.stripe.com/payments/checkout"
  - "https://developers.cloudflare.com/d1/"
  - "https://12factor.net/"
tasks:
  - id: d61-apps-t1
    type: build
    title: "Build your starter-kit repo and paste the link"
    xp: 60
    proof: link
  - id: d61-apps-t2
    type: build
    title: "Spin up a new project from it and time yourself"
    xp: 20
    proof: text
  - id: d61-apps-t3
    type: reflect
    title: "Name what you keep rebuilding"
    xp: 15
    proof: text
---

Yesterday you sent your first five pitches. If even one of them says "yes", you'll need to start a new project fast —
and you've already built the boring parts three or four times: sign-in, a database, a careful AI call, a checkout.
Today you stop rebuilding them. A **starter kit** is your own pre-assembled foundation: clone, rename, fill in
`.env`, deploy — and you're working on the client's actual problem within 15 minutes instead of day three.

## What goes in, what stays out

A starter kit is a kitchen with the knives sharpened, not a frozen dinner. It contains the parts *every* project
needs, wired and tested, and nothing about your capstone's specific idea.

**In:**

- **Auth** — sign-up, sign-in, sign-out, a protected route, session checks on the server.
- **Database** — one migration with a `users` table and one example table, plus a typed query helper.
- **AI** — one server-side function that calls the model with timeouts, retries, a token limit, a rate limit, and a
  fixture fallback when `ANTHROPIC_API_KEY` (or your provider's key) is missing.
- **Payments** — a checkout in **test mode** (Stripe Checkout) and a webhook handler that verifies the signature and
  marks the user as paid.
- **The boring essentials** — `.env.example`, a README with a 3-command setup, `CLAUDE.md`/`AGENTS.md` describing the
  structure and rules, one Vitest test, one Playwright smoke test, light and dark theme, a CI workflow that runs the build.

**Out:** your capstone's screens, prompts, data, brand, and anything with real keys.

> **Tip:** the project memory file is the secret weapon. A good `CLAUDE.md` in the starter means every future agent
> session starts already knowing your stack, your folder layout and your rules ("never put keys in the client").

## Step by step

### 1. Extract the starter (50 min)

Work in a **new** repo, not in your capstone. Open your agent with both folders available and give it this:

```text
Goal: create a reusable starter kit in ./starter from my capstone in ./capstone.
Keep (generalised, with neutral names): auth, database layer + first migration, the AI call helper with
timeouts/retries/rate limit/fixture fallback, Stripe Checkout in test mode + verified webhook, theme (light/dark),
one Vitest test, one Playwright smoke test, a GitHub Actions workflow that runs install + build + tests.
Remove: every capstone-specific screen, prompt, table, copy and asset. Replace the home page with a tiny demo:
sign in → one form → AI answer → "Upgrade" button that opens test checkout.
Add: .env.example with every variable and a comment each; README with "3 commands to run" and "how to deploy";
CLAUDE.md and AGENTS.md describing the stack, folders, commands and rules; a LICENSE (MIT unless I say otherwise).
Constraints: no real keys anywhere, including git history. Must run with no AI key (fixture mode) and no Stripe key
(payments button shows "Payments not configured").
Done when: a fresh clone runs with `npm install`, `npm run db:migrate:local`, `npm run dev`; build and tests pass.
Show me the final file tree before you finish.
```

Read the file tree. Anything with your capstone's name in it? Send it back. Then push to GitHub and, in the repo's
**Settings**, tick **Template repository** — now "Use this template" creates a clean copy in one click.

> **If you're stuck:** if payments are the part that keeps breaking, ship the kit without them today and add a
> `docs/payments.md` with the steps instead. A working kit with three parts beats a broken kit with four. Selling in a
> country where Stripe isn't available? Keep the webhook pattern and swap the provider later — the shape is the same.

**Proof for task 1:** the repo link.

### 2. Race the clock (20 min)

Now prove it. Start a timer and create a brand-new project from the template — say, the simplest thing from one of
yesterday's pitches.

```bash
gh repo create my-new-thing --template your-name/starter --private --clone
cd my-new-thing
cp .env.example .dev.vars    # or .env, depending on your stack
npm install && npm run db:migrate:local && npm run dev
```

Then ask the agent to rename the app, change the demo form to fit the new idea, and deploy. Stop the timer when the
new project is **live on a URL** with sign-in working. Under 15 minutes? Excellent. Over? Write down exactly which
step ate the time — that's the next thing to automate (often a `setup` script that asks 3 questions and fills in names).

**Proof for task 2:** your time and the slowest step.

### 3. Notice your patterns (10 min)

Look back over 60 days of commits. What did you build more than twice? An admin page? A "send me a Telegram message
when X happens" helper? CSV export? Those repeated chores are your real specialty — and they're exactly what a client
pays for without knowing it. **Proof for task 3:** three things you keep rebuilding, and which one goes into the kit next.

## You're done when…

- [ ] The starter-kit repo exists as a GitHub template, runs in fixture mode, and the link is pasted.
- [ ] You spun up a new live project from it and pasted your time and the slowest step.
- [ ] You named three things you keep rebuilding.

**Tomorrow:** launch prep. Your capstone gets a story, a kit and a channel plan.
