---
day: 31
track: apps
phase: 2
title: "Automations in code: your app works while you sleep"
summary: "A scheduled job checks something you care about and messages you on Telegram, with retries, logs and no double posts."
estMinutes: 90
resources:
  - "https://developers.cloudflare.com/workers/configuration/cron-triggers/"
  - "https://docs.github.com/en/actions"
  - "https://core.telegram.org/bots/api"
tasks:
  - id: d31-apps-t1
    type: read
    title: "Learn cron, webhooks and polite scraping"
    xp: 10
    proof: none
  - id: d31-apps-t2
    type: build
    title: "Ship a scheduled job that sends you a Telegram message"
    xp: 60
    proof: text
  - id: d31-apps-t3
    type: build
    title: "Add retries, logs and idempotency"
    xp: 30
    proof: text
  - id: d31-apps-t4
    type: quiz
    title: "Answer: what happens when it runs twice?"
    xp: 15
    proof: none
---

Half of the "automation" people pay for is this: *every morning, look at something, and tell me if it matters.*
New sign-ups in your app, a price drop, a competitor's new blog post, yesterday's sales. No drag-and-drop workflow
builder required. You already have a bot (day 20) and a backend. Today they start working on a schedule.

## Three ways code wakes up

- **Cron (schedule)**: "run at 07:00 every day". Cron syntax is five fields: minute, hour, day of month, month,
  weekday. `0 7 * * *` = 07:00 daily, `*/15 * * * *` = every 15 minutes. Schedules are in **UTC** unless the platform
  says otherwise, so 07:00 UTC is 09:00 in Berlin in summer.
- **Webhook (event)**: another service calls your URL when something happens. Your Telegram bot already works this way.
- **Polling**: you check a source regularly. Cron + polling is how you watch things that don't send webhooks.

Where to run it:

- **Cloudflare Workers Cron Triggers** if your backend is already on Workers: add a `scheduled()` handler next to
  your `fetch()` handler. Precise, fast, free tier is generous.
- **GitHub Actions `schedule`** if your job is a script in a repo. Easy, but runs can start minutes late, and
  scheduled workflows in inactive public repos get paused after 60 days.

### Polite scraping

If the thing you watch has an API or RSS feed, use that. If you must read a web page: check `robots.txt` and the
site's terms, request at most once every few minutes, send a `User-Agent` with a way to contact you, cache results,
and never scrape behind a login or collect personal data. Being polite is also practical: rude scrapers get blocked.

## Step by step

### 1. Decide what to watch (5 min)

Pick something useful *to you*, ideally from your own app: "every morning, send me yesterday's new users, new jobs
saved and AI calls". Other good ones: a weather threshold (Open-Meteo), new items in an RSS feed, a page's price.

### 2. Build the job (45 min)

```text
Goal: a scheduled job that runs daily at 07:00 UTC and sends me a Telegram message.
Context: the main app's Worker (Cloudflare Workers + D1) runs this job, not the bot's Worker from day 20.
Secrets BOT_TOKEN and OWNER_CHAT_ID are added to the main app with wrangler secret put (and to .dev.vars locally).
What to check: <describe it, e.g. count new users and AI calls in the last 24 h from D1>.
Constraints:
- Add a cron trigger in the wrangler config and a scheduled() handler; keep the logic in a separate function
  runDailyReport(env) so it can be unit-tested and triggered by hand.
- Send with Telegram's sendMessage to my chat id (env OWNER_CHAT_ID). Short, readable message, numbers first.
- If nothing changed, still send a one-line "all quiet" message (so I know the job is alive).
- No secrets in code or config files that get committed.
Done when: I can trigger it locally and receive the message in Telegram.
```

First add the two secrets. Your chat id: your day-19 bot logs the chat id of every message, so send it `/start` and
read the id in `npx wrangler tail` (run it inside `bot/`). Then trigger the job locally without waiting until 7 a.m.
Start `npm run dev` and, in a second terminal, call the test URL on the port it printed:

```bash
curl "http://localhost:5173/cdn-cgi/handler/scheduled?cron=0+7+*+*+*"
```

(On plain `wrangler dev` the port is 8787. Older setups use `wrangler dev --test-scheduled` and `/__scheduled`; the
cron-triggers docs have the current way.) Deploy with `npm run build && npx wrangler deploy`, then check the Cloudflare
dashboard: your Worker shows the cron under **Triggers**.

Using GitHub Actions instead? The agent creates `.github/workflows/daily.yml` with `on: schedule: - cron: "0 7 * * *"`
plus `workflow_dispatch:` so you can press **Run workflow** to test. Bot token goes into repository secrets.

Paste for task 2: your cron expression, what it checks, and the exact message you received.

> **If you're stuck:** no message arrives? Ask the agent to log Telegram's full response. `chat not found` means a wrong
> chat id, or you never pressed Start in the bot (bots can't message people who haven't). `401 Unauthorized` means a
> wrong token. (`getUpdates` won't help here: it refuses to work while the day-20 webhook is set.)
> Nothing in the logs at all? Run `npx wrangler tail` while triggering and see if the handler runs.

### 3. Make it boring and reliable (30 min)

A job that works once is a demo. A job that works every day for a year needs three things:

- **Retries with backoff**: the network fails sometimes. Retry 3 times, waiting 1 s, 4 s, 16 s. If Telegram answers
  `429 Too Many Requests`, wait the `retry_after` seconds it tells you.
- **Logs**: one line per run: started, what it found, sent or failed, how long it took. Store the last runs in a
  `job_runs` table, so "did it run on Tuesday?" has an answer.
- **Idempotency**: running twice must not send twice. Give every run a key, like `daily-report:2026-11-04`, and
  store it with a unique constraint. If the key exists, skip.

```text
Goal: make runDailyReport reliable.
Constraints:
- Wrap network calls in a retry helper: 3 attempts, exponential backoff, respect Telegram's retry_after on 429.
- Create a job_runs table (run_key UNIQUE, started_at, finished_at, status, details). Insert the run key first;
  if the insert fails because it exists, log "already sent" and exit.
- Log one structured line per run (JSON) with duration and outcome.
- Vitest tests: retry helper retries then succeeds; a second run with the same key sends nothing.
Done when: triggering twice in a row sends exactly one message and the tests pass.
```

Trigger it twice. One message? Paste task 3: how your retries work, your run key format, and where the logs live.

> **Tip:** if a run crashes *after* writing the key but *before* sending, you'd skip it forever. A good fix is to
> mark the row `status = sent` only after success, and let a retry pick up rows still `pending`. Ask the agent to
> explain this trade-off. It's a classic interview question too.

## Quiz

1. Your cron is `0 7 * * *` and you live in UTC+3. When does it run for you?
2. The job ran twice because of a retry. How do you prevent two Telegram messages?
3. A site's `robots.txt` disallows the page you want. What do you do?
4. GitHub's scheduled run started 12 minutes late. Bug?

<details><summary>Answers</summary>

1. At 10:00 your time, since cron runs on UTC.
2. Idempotency key per run (e.g. date), stored with a unique constraint; skip if it already exists.
3. Don't scrape it. Look for an API, RSS or ask the owner.
4. No, scheduled Actions can be delayed under load. Use Workers cron when timing matters.

</details>

## You're done when…

- [ ] You can explain cron vs webhook vs polling in one line each.
- [ ] A deployed scheduled job sends you a Telegram message. Schedule and example message pasted.
- [ ] Retries, logs and an idempotency key are in place; two triggers = one message. Described.
- [ ] Quiz done.

Tomorrow: the first feature people pay for. Real checkout, test money.
