---
day: 20
track: apps
phase: 2
title: "Telegram bot, part 2: always on"
summary: "Add buttons and per-user memory, move your bot to a webhook so it runs 24/7, and watch three people use it."
estMinutes: 120
badges: [bot-builder]
resources:
  - "https://core.telegram.org/bots/api"
  - "https://grammy.dev/"
  - "https://developers.cloudflare.com/workers/"
  - "https://docs.aiogram.dev/"
tasks:
  - id: d20-apps-t1
    type: read
    title: "Understand polling vs webhooks"
    xp: 10
    proof: none
  - id: d20-apps-t2
    type: build
    title: "Add inline buttons and per-user memory; paste the command list"
    xp: 50
    proof: text
  - id: d20-apps-t3
    type: ship
    title: "Deploy the bot on a webhook so it answers 24/7; paste the t.me link"
    xp: 60
    proof: link
  - id: d20-apps-t4
    type: share
    title: "Have 3 people try it and write down what confused them"
    xp: 20
    proof: text
---

Close your laptop and your bot dies. That's the problem with yesterday's version — and today you fix it. You'll also
make it pleasant to use: buttons instead of typing, and memory so it doesn't greet a regular like a stranger. By tonight
three people have used a bot that runs while you sleep.

## Polling vs webhooks

- **Long polling** — your program keeps asking Telegram "anything new?". Needs a process running all the time. Great
  for development, awkward for production: a laptop or an always-on server must stay up.
- **Webhook** — you give Telegram a URL once, and *Telegram* calls it with each update. Your code only wakes up when a
  message arrives. That's a perfect match for **serverless** hosting like the Cloudflare Worker you deployed on day 11:
  free when idle, always reachable.

Two rules to remember: a bot uses *either* polling *or* a webhook, never both at once; and a webhook URL is public, so
you set a **secret token** that Telegram sends with every request, and your code rejects requests without it.

**Per-user memory** means storing a little state keyed by the user's chat id: the last ~10 messages so the AI has
context, plus a setting or two. It lives in a database (D1 again), not in a variable — a serverless function forgets
everything between requests.

**Inline buttons** sit under a bot message. Tapping one sends your code a *callback* (not a chat message), and you
answer it to stop the little loading spinner.

## Step by step

### 1. Buttons and memory (45 min)

```text
Goal: make the bot in bot/ friendlier and give it memory.

Constraints:
- Per-user memory in a D1 table messages(chat_id, role, text, created_at). Send the last 10 messages for that
  chat to the model as history. Store nothing else about the user.
- /reset clears that user's history; /forget deletes everything stored about them and confirms.
- Under each AI reply, inline buttons: "Shorter", "More detail", "Start over". Handle callbacks and always
  answer the callback query.
- Keep /start and /help; update setMyCommands; /help mentions what is stored and how to delete it.
- Structure the code so the same bot works with polling locally (npm run bot:dev) and with a webhook in production.

Explain your plan first (schema, files, how the same code runs both ways) and wait for my OK.
When done: run it locally with polling, give me a test script of 6 steps proving memory, /reset and the
buttons work, and tell me what the logs should show.
```

Run through the test script yourself. Then paste the final command list (what your `/help` shows) as proof.

### 2. Deploy on a webhook (45 min)

```text
Goal: deploy the bot to Cloudflare Workers on a webhook.

Constraints:
- Use grammY's webhook adapter for Cloudflare Workers (check the current grammY hosting docs).
- Secrets via wrangler secret put: BOT_TOKEN, ANTHROPIC_API_KEY, WEBHOOK_SECRET. Reject any request
  whose X-Telegram-Bot-Api-Secret-Token header doesn't match WEBHOOK_SECRET.
- Remote D1 database with the migration applied (--remote).
- A script scripts/set-webhook.mjs that reads bot/.env and calls setWebhook with the URL and secret_token,
  and one that calls getWebhookInfo. Never print the token.

List every command you will run before running it, and wait for my OK.
After deploying: call getWebhookInfo and show me the result (no errors, pending_update_count 0).
Then tell me to stop my local polling bot and send a message from my phone.
```

Stop the local bot, close your laptop lid for a minute, and message the bot from your phone. It answers. Your link is
`https://t.me/<your_bot_username>` — paste it as proof.

> **If you're stuck:** `getWebhookInfo` shows a `last_error_message`? Read it — an error mentioning 401
> means your secret check rejects Telegram (the secrets don't match). If the bot answers the same message twice,
> your handler took too long and Telegram retried: ask the agent to reply faster or use a quicker model, and check
> the grammY docs on webhook timeouts. Run `npx wrangler tail` to see live logs.

> **Tip:** on Python with aiogram? Webhooks work the same way; host it on any small always-on server or a
> Python-friendly platform (check current docs). Or keep polling on a server — that's fine too.

### 3. Three real people (20 min)

Send the t.me link to three people with one sentence of context, then **watch** (in person or on a call) without
helping. Note where they hesitate, what they type that the bot doesn't understand, and what they expected a button to
do. Write it down: three names (or initials), and what confused each one.

> **Safety:** tell testers what the bot stores (their recent messages) and how `/forget` deletes it. Check your
> provider's dashboard after the test — set a spend limit if you haven't.

## You're done when…

- [ ] You can explain why webhooks suit serverless and why the secret token matters.
- [ ] Buttons and per-user memory work, plus `/reset` and `/forget` — you pasted the command list.
- [ ] The bot answers with your laptop closed — you pasted the t.me link.
- [ ] Three people tried it — you wrote what confused each.

**Tomorrow:** a rest day. You earned the bot-builder badge; let it sink in.
