---
day: 19
track: apps
phase: 2
title: "Telegram bot, part 1: hello from your laptop"
summary: "Create a Telegram bot, run it on your laptop, and give it an AI brain with a clear personality and /help."
estMinutes: 90
resources:
  - "https://core.telegram.org/bots/tutorial"
  - "https://grammy.dev/"
  - "https://docs.aiogram.dev/"
tasks:
  - id: d19-apps-t1
    type: read
    title: "Learn how Telegram bots work"
    xp: 10
    proof: none
  - id: d19-apps-t2
    type: build
    title: "Create a bot with BotFather and run an echo bot locally; paste its @username"
    xp: 40
    proof: text
  - id: d19-apps-t3
    type: build
    title: "Add AI replies with a system prompt, plus /start and /help; upload a chat screenshot"
    xp: 50
    proof: file
  - id: d19-apps-t4
    type: reflect
    title: "Decide what would make this bot genuinely useful"
    xp: 15
    proof: text
---

A side quest for two days. Your web app needs people to open a link; a bot lives where people already are — in a chat
app on their phone. Telegram has around a billion users and the friendliest bot platform there is: no review, no
business verification, a bot in five minutes. (WhatsApp and Discord bots exist too, but setup is heavier.) Today the
bot runs on your laptop. Tomorrow it runs 24/7.

## How Telegram bots work

- **BotFather** is Telegram's official bot that creates other bots. You chat with it, and it gives you a **token** —
  the password for your bot. Treat it like an API key: `.env`, never in git, never in a screenshot.
- Your code talks to the **Bot API**, which is plain HTTP + JSON, exactly like the APIs from day 8.
- Every message a user sends becomes an **update**. Your code needs to receive updates and answer them.
- Today you use **long polling**: your program keeps asking Telegram "anything new?" and waits for an answer. It only
  works while your laptop is on and the program is running. (Tomorrow: webhooks.)
- You don't write raw HTTP: a library does that. **grammY** (TypeScript, recommended — same language as your app) or
  **aiogram** (Python). Both are mature and well documented.
- **Commands** are messages starting with `/`, like `/start` (sent automatically when someone opens your bot) and
  `/help`.

A good bot idea is a **front door to your main app**: forward a job posting to the bot and it extracts the fields with
yesterday's prompt; send "what's due this week?" and it answers. Today we keep it simple; the data connection comes later.

## Step by step

### 1. Create the bot and run an echo (30 min)

1. In Telegram, open **@BotFather** (check the blue verified tick), send `/newbot`, pick a display name and a
   username ending in `bot` (e.g. `jobjar_helper_bot`).
2. In your repo (`main-app`), create a `bot/` folder and inside it a file named `.env` — in your code editor, not in a
   chat. Paste the token as one line: `BOT_TOKEN=123456:ABC...`, no quotes, no spaces. (Creating the file in an
   editor rather than with `echo` also avoids a Windows PowerShell quirk that saves it in an encoding Node can't read.)

3. Make sure `.env` is in your `.gitignore` (`git status` must not show it). Then ask the agent:

```text
Goal: a minimal Telegram echo bot in the bot/ folder of this repo, using grammY and TypeScript.

Constraints:
- Read BOT_TOKEN from bot/.env (Node's --env-file or dotenv). Never print the token.
- Long polling for now (bot.start()). Replies to any text message with the same text.
- An npm script "bot:dev" that runs it with tsx in watch mode.
- Log one line per incoming message: chat id and first 40 characters.

Explain your plan (files, packages, commands) first and wait for my OK.
When done, run it, tell me what to send to the bot, and confirm from the logs that the message arrived.
```

Send your bot a message. It echoes. Paste its @username as proof.

> **If you're stuck:** `401 Unauthorized` means the token is wrong or has a stray space — copy it again from
> BotFather (`/mybots` → your bot → API Token). `409 Conflict` means two copies of the bot are running; close the extra
> terminal.

### 2. Give it an AI brain (40 min)

A **system prompt** is the instruction that defines who the bot is, what it does, what it refuses and how it talks.
Write it like a job description, not a vibe: short replies (chat, not essays), the one job it helps with, what to say
when asked something off-topic.

```text
Goal: replace the echo with AI replies.

Context: the bot belongs to my app from docs/SPEC.md. Use the same provider as the web app; key in bot/.env as
ANTHROPIC_API_KEY, model from CLAUDE_MODEL (default claude-sonnet-5-5).

Constraints:
- System prompt in bot/prompts/system.ts. Draft it with me: role, the one job, tone (friendly, brief, max ~80 words
  per reply), what to do with off-topic requests, never claims to have saved data (it can't yet).
- /start: a 2-line welcome explaining what the bot does with one example message to try.
- /help: the list of commands and 2 example messages. Register commands with setMyCommands so they show in the menu.
- Show "typing..." while waiting. Messages longer than 2,000 characters are refused politely.
- If the AI call fails or the key is missing, reply with a friendly fallback, never crash, and log the error.

First show me the system prompt draft and your plan, and wait for my OK.
At the end, list 5 test messages (including an off-topic one and a very long one), tell me what each should do,
then I'll send them and report back.
```

Send all five test messages. Fix anything that surprised you with one precise follow-up prompt. Screenshot a chat
showing `/start` and at least one AI reply, and upload it. Commit and push (check again: no `.env` in `git status`).

> **Tip:** prefer Python? Ask for the same thing with **aiogram 3** instead of grammY. Everything in these two days
> works the same way.

### 3. Reflect (10 min)

Imagine a friend using this bot daily. What would make it genuinely useful, not just a chatbot with a name? Write
3–5 sentences: the one thing it should do, what it needs to remember, and when it should send a message unprompted.

## You're done when…

- [ ] You can explain token, update, long polling and command in your own words.
- [ ] The echo bot ran locally — you pasted its @username.
- [ ] The bot answers with AI, has `/start` and `/help`, survives errors — you uploaded a chat screenshot.
- [ ] You wrote what would make the bot genuinely useful.

**Tomorrow:** buttons, memory, and a bot that keeps answering while your laptop sleeps.
