---
day: 40
track: video
phase: 3
title: "Your pipeline as an app"
summary: "Put a web form or Telegram bot in front of make-video: requests become queued jobs, progress is visible, and the finished video comes back."
estMinutes: 150
resources:
  - "https://www.sqlite.org/docs.html"
  - "https://core.telegram.org/bots/api"
  - "https://grammy.dev/"
  - "https://docs.aiogram.dev/"
tasks:
  - id: d40-video-t1
    type: read
    title: "Learn jobs, queues and progress"
    xp: 10
    proof: none
  - id: d40-video-t2
    type: build
    title: "Build a form or bot that queues a render and returns the video; screenshot"
    xp: 70
    proof: file
  - id: d40-video-t3
    type: build
    title: "Describe your job statuses and failure handling"
    xp: 20
    proof: text
  - id: d40-video-t4
    type: quiz
    title: "Quiz: where should rendering run?"
    xp: 15
    proof: none
---

Right now only one person on Earth can use your pipeline: you, in a terminal. Tomorrow a client might want to type a topic
and get a video without ever seeing a command line. Today you build the front door — the way our own Studio works.

## Jobs, queues, progress

A render takes minutes. A web request or a bot message should be answered in under a second. So you never render "inside"
the request. Instead:

1. **The front door** (web form or Telegram bot) validates the request and writes a **job** into a database: id, who
   asked, topic, options, `status = queued`. It answers immediately: "Got it, you're #2 in line."
2. **The queue** is just that table, ordered by time. No special software needed at this scale — SQLite is plenty.
3. **A worker** — a separate process — takes the oldest queued job, marks it `running`, runs `make-video`, and updates
   the job's `stage` and `progress` from your pipeline's `run.json`.
4. When it finishes, the job becomes `done` with a path to the file, or `failed` with an error. The front door delivers
   the video or a human-readable apology.

Think of a restaurant: the waiter (front door) takes the order and writes a ticket, the kitchen (worker) cooks one ticket
at a time, and nobody stands at the stove holding the customer's hand.

Three rules that save you from real pain:

- **One render at a time** per machine to start with. Two parallel renders usually aren't faster, they just both get slow.
- **Limits before launch.** Every job costs API money. Allow-list who can use it, cap jobs per person per day, cap the
  video length.
- **Jobs can die.** If the worker crashes mid-render, the job stays `running` forever. A job that's been `running` longer
  than the timeout goes back to `queued` (once) or to `failed`.

## Step by step

### 1. Pick your front door

**Default: a web form.** One small FastAPI app (Python, like your pipeline) serving one HTML page: a link anyone can
open. The agent writes one server file and one template.

**Option: a Telegram bot**, if your clients live in Telegram. You haven't built one on this track, so:

1. In Telegram, message @BotFather, send `/newbot`, pick a name and a username ending in `bot`. You get a token like
   `123456789:AA…`. It's the bot's password: put it in `.env` as `TELEGRAM_BOT_TOKEN`, never in code or a chat.
2. Use **aiogram** or **python-telegram-bot**, so the bot shares Python and the jobs database with your worker.
3. Run it with **long polling**: the bot keeps asking Telegram for new messages, so it works from your laptop with no
   public URL or webhook.
4. Make `/start` reply before you add anything else.

The queue and worker are the same either way.

### 2. Build it

```text
Goal: turn my make-video pipeline into an app: <web form | Telegram bot> → job queue → worker → video delivered back.
Context: pipeline from days 33-34 (make-video CLI, writes runs/<slug>/run.json per stage). Python + SQLite.
Build:
- jobs table: id (random, unguessable), requester, topic, options JSON, status (queued|running|done|failed),
  stage, progress 0-100, error, attempts, created_at, started_at, finished_at, result_path.
- Front door (bot: aiogram or python-telegram-bot, long polling, token from .env): a form with topic, length (30/45/60 s), format (16:9 / 9:16), brand (my brand files) — or bot commands
  /new <topic>, /status, /cancel. Validate input; reject topics over 120 chars. Reply instantly with the job id and queue position.
- worker.py: separate process, claims the oldest queued job atomically (UPDATE ... WHERE status='queued' ... RETURNING),
  runs make-video as a subprocess with a 20-minute timeout, updates stage/progress from run.json every few seconds.
- Delivery: web → a status page that refreshes and shows a download link /files/<job_id>.mp4;
  bot → edit one status message as stages change, then sendVideo (compress if > 50 MB, the bot upload limit).
- Limits: ALLOWED_USERS from .env, max 3 jobs per user per day, one running job at a time.
- Failure: retry once on a transient error (network, 5xx); a stale running job (> timeout) is retried once, then failed;
  failed jobs show a friendly message and keep the technical error in the log only.
Done when: I submit a topic, watch the status move through the stages, and receive a playable video.
```

Run the worker and the front door in two terminals, submit a topic, and take a screenshot of the moment the video
arrives: the bot chat with the status message and the video, or the status page with the download link. Upload it.

> **If you're stuck:** if two workers grab the same job, the claim isn't atomic — the agent did a SELECT, then a
> separate UPDATE. Ask for a single `UPDATE … RETURNING` statement. If the status never changes from "queued", the worker
> isn't running or is looking at another database file — print the absolute DB path in both processes.

> **Safety:** a public form that spends your API money is an invitation. Keep the allow-list on until you have rate
> limits and a monthly spend cap with your providers, and never put API keys in the front-end code.

### 3. Break it on purpose

Now prove the failure handling works. Submit a job and kill the worker mid-render, then restart it. Submit a topic that
makes a stage fail (e.g. temporarily remove the TTS key). Submit four jobs as one user. Write down what happened in each
case — statuses, messages the user saw, what the log says. Paste it. Example: *"Killed worker at stage 4 → job stayed
running for 20 min, then went back to queued, finished on retry; user saw 'Taking longer than usual, still working'."*

## Quiz

1. Why can't you render the video directly inside the web request handler?
2. Your front door is a serverless function on the edge. Should the render run there too?
3. Where *can* rendering run?
4. What does "atomic claim" protect you from?

<details><summary>Answers</summary>

1. The request would hang for minutes and time out; meanwhile nobody else gets an answer. Accept, queue, return.
2. No. Serverless functions have short CPU time limits and usually no ffmpeg or headless browser. Keep the light front
   door there if you like, and send jobs to a worker.
3. On a machine that can run long, heavy processes: your own computer for now, a VPS, a container service, or a cloud
   machine (our Studio's render server is a Python service that deploys to AWS). GPU only if you render AI models locally.
4. Two workers taking the same job and rendering it twice — double cost, double delivery.

</details>

## You're done when…

- [ ] You can explain front door, queue, worker and why rendering never happens inside the request.
- [ ] A screenshot shows a video delivered back by your form or bot.
- [ ] You pasted what happened in your three "break it" tests.
- [ ] Quiz done.

Tomorrow: the boss. A real client, a real brief, three videos through this very app. No client lined up
yet? Message a small business or creator today and book a 20-minute call for tomorrow.
