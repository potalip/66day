---
day: 40
track: apps
phase: 3
title: "Long jobs: queues, webhooks, background work"
summary: "Move your slowest AI task into a background job with a progress bar, retries and a dead-letter shelf for the ones that keep failing."
estMinutes: 90
resources:
  - "https://developers.cloudflare.com/queues/"
  - "https://developers.cloudflare.com/workers/configuration/cron-triggers/"
  - "https://developers.cloudflare.com/d1/"
tasks:
  - id: d40-apps-t1
    type: read
    title: "Find out why requests time out and what queues fix"
    xp: 10
    proof: none
  - id: d40-apps-t2
    type: build
    title: "Build a background job with visible progress"
    xp: 60
    proof: file
  - id: d40-apps-t3
    type: build
    title: "Add retries and a dead-letter queue"
    xp: 20
    proof: text
  - id: d40-apps-t4
    type: quiz
    title: "Decide: sync or async?"
    xp: 15
    proof: none
---

Somewhere in your app there's a button that makes users wait: summarising a 40-page PDF, processing a 2,000-row CSV,
generating a weekly report. Right now it's a spinner, and sometimes an error after a minute, and the user clicks
again, and now it runs twice. Today you move that work to the background, where slow is fine.

## Why requests time out

A normal web request is a phone call: the browser asks, waits on the line, gets an answer. Everyone on the line has a
patience limit: browsers, proxies (Cloudflare drops a request that takes longer than about 100 seconds to respond),
and your serverless platform's own limits on how long a request may run. Long AI calls, big files and many steps blow
past those limits, and when the call drops, the work is lost or, worse, half-done.

A **queue** turns the phone call into a ticket at a counter:

1. The request **creates a job** ("summarise doc 42"), saves it with status `queued`, and immediately answers `202
   Accepted` with a job id. Takes 50 ms.
2. A **worker** (code running separately) picks jobs up, does the slow part, updates `progress` and `status`.
3. The UI **polls** `GET /api/jobs/:id` every 2 seconds (or gets pushed an update) and shows progress. When `done`,
   it shows the result. The user can even close the tab and come back.

If a job fails, the worker **retries** it later, with backoff. If it fails too many times, it goes to a
**dead-letter queue (DLQ)**: a shelf of failed jobs a human looks at, instead of retrying forever and burning money.

Two ways to build it, both fine:

- **Cloudflare Queues**: a managed queue. Your Worker sends messages; a `queue()` handler consumes them in batches;
  `max_retries` and a `dead_letter_queue` are config. Check the current docs for plan limits.
- **A jobs table + cron**: a `jobs` table in D1/SQLite/Postgres and a scheduled handler (day 31) every minute that
  claims queued jobs. Zero new infrastructure; slightly slower to pick up. Works on any host.

## Step by step

### 1. Pick the slow thing (5 min)

Time your slowest feature. Anything that regularly takes more than ~5 seconds, or could grow (bigger files, more
rows), is a candidate. Write down how long it takes now.

### 2. Build the background job (50 min)

```text
Goal: move <slow feature, e.g. "summarise uploaded document"> to a background job with visible progress.
Context: Cloudflare Workers + D1 (use Cloudflare Queues if available on our plan, otherwise a jobs table + a cron trigger every minute). Existing feature code is in <file>.
Constraints:
- jobs table: id, user_id, type, status (queued/running/done/failed/dead), progress 0–100, attempts, input (JSON), result (JSON), error, created_at, updated_at, run_after.
- POST /api/jobs creates a job for the signed-in user and returns 202 + job id. Reject a duplicate: same user + same input while one is still queued/running returns the existing job.
- Worker: claims a job atomically (UPDATE … WHERE status='queued' so two workers can't take the same job), sets running, reports progress at real milestones (extracted, chunked, summarised), saves the result.
- GET /api/jobs/:id returns status/progress/result, only to the job's owner.
- UI: progress bar with a human label per stage, "you can leave this page" note, result when done, friendly error with a "try again" button when failed. Disable the start button while a job runs.
- No API key: the job uses the no-AI fallback and still completes.
Done when: I start a job, see progress move, reload the page mid-way and still see it finish.
```

Run it locally. Start a job, reload mid-way, open a second tab. Screenshot the progress bar mid-job (and ideally the
finished result) for task 2.

> **If you're stuck:** progress jumps from 0 to 100? The worker only updates at the end. Ask for updates after each
> stage. Job never starts locally? With the cron approach, trigger the scheduled handler by hand
> with the same test URL as on day 31 (`/cdn-cgi/handler/scheduled` on your dev port); with Queues, check the consumer is
> configured in the wrangler config.

### 3. Retries and dead-letter (25 min)

```text
Goal: make failures safe.
Constraints:
- On error: attempts += 1; if attempts < 3, set status back to queued with run_after = now + 30 s × 2^attempts (exponential backoff). With Cloudflare Queues use message.retry() with a delay and max_retries = 3.
- After 3 failures: status = dead (or send to the dead-letter queue), keep the error message, and send me one Telegram alert with job id and error.
- Jobs stuck in "running" for more than 10 minutes (crashed worker) go back to queued.
- The job must be safe to run twice: write the result with the job id as key, never append.
- A tiny owner-only /admin/jobs page: list dead jobs with a "retry" button.
- Vitest tests for the backoff and the "stuck job" rule.
Done when: a forced failure retries 3 times, lands in dead, and I get the Telegram alert.
```

Force a failure (ask the agent for a `FAIL_JOBS=1` dev flag). Watch attempts go 1, 2, 3, then dead. Paste for task 3:
your retry schedule, what makes a job "dead", how you get alerted, and how you'd re-run it.

## Quiz

1. Checking whether a username is taken: sync or async?
2. Generating a 30-page PDF report: sync or async?
3. Sending a welcome email after sign-up: sync or async?
4. Why must a background job be safe to run twice?

> **Answers:**
>
> 1. Sync. It's fast and the user needs the answer now.
> 2. Async. It's slow and can fail; show progress and deliver when done.
> 3. Async. Sign-up shouldn't fail or wait because the email provider is slow.
> 4. Retries, crashed workers and duplicate messages mean the same job can run again. Idempotent jobs make that harmless.

## You're done when…

- [ ] You can explain the phone-call vs ticket analogy and what a dead-letter queue is for.
- [ ] A slow feature runs as a background job with real progress; survives a reload. Screenshot uploaded.
- [ ] Retries with backoff, dead jobs, stuck-job recovery and an alert are described.
- [ ] Quiz done.

Tomorrow: the boss. A real person, a real problem, a real tool built in a day. If you haven't yet, message a
small business, creator or team today and book a 20-minute call for tomorrow.
