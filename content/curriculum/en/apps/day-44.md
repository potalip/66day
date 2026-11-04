---
day: 44
track: apps
phase: 3
title: "Your app, inside Telegram"
summary: "Open your main app as a Telegram Mini App, match Telegram's theme, and prove on the server who the user really is."
estMinutes: 120
resources:
  - "https://core.telegram.org/bots/webapps"
  - "https://core.telegram.org/bots/payments-stars"
  - "https://grammy.dev/"
tasks:
  - id: d44-apps-t1
    type: read
    title: "Understand Mini Apps: web apps living inside a messenger"
    xp: 10
    proof: none
  - id: d44-apps-t2
    type: build
    title: "Launch your app as a Mini App and share its t.me link"
    xp: 60
    proof: link
  - id: d44-apps-t3
    type: build
    title: "Validate initData on the server and explain how"
    xp: 30
    proof: text
  - id: d44-apps-t4
    type: quiz
    title: "Quiz: should you trust the client?"
    xp: 15
    proof: none
---

Yesterday your app got an icon. Today it gets a billion-user front door. A **Telegram Mini App** is your web app
opened inside Telegram, full screen, with the user already known — no sign-up form, no password, no "check your inbox".
You already have a bot from day 19; today it gets a button that opens your real app.

## How a Mini App works

It's just your website, loaded in Telegram's built-in browser. Telegram adds a small JavaScript object,
`window.Telegram.WebApp`, that gives you:

- **Theme params** — the user's Telegram colours (`bg_color`, `text_color`, `button_color`…), also exposed as CSS
  variables like `var(--tg-theme-bg-color)`. Use them and your app looks native in both light and dark Telegram.
- **Native controls** — a main button at the bottom, a back button, haptic feedback, `expand()` to go full height.
- **initData** — a signed string describing who opened the app: user id, name, language, `auth_date`, and a `hash`.

That last one is the whole security story. Anyone can open your URL in a normal browser and fake
`initDataUnsafe.user.id = 12345`. The **signature** is what stops them: Telegram signs `initData` with a key derived
from your bot token, which only you and Telegram know. Your server checks the signature before trusting a single
field. Rule of thumb: **the client tells you a story; the server checks the passport.**

## Step by step

### 1. Register the Mini App (15 min)

In Telegram, open **@BotFather**:

- `/newapp` → pick your bot → title, short description, a 640×360 image → your app's **HTTPS** URL → a short name.
  You get a direct link like `https://t.me/your_bot/app`.
- Optionally, in your bot's settings, set the **menu button** to open the same URL, so it's one tap from the chat.

Telegram requires HTTPS. Use your deployed app (a preview deploy on Cloudflare or Vercel works well for testing).

### 2. Make the app Telegram-aware (35 min)

```text
Goal: make my main app work as a Telegram Mini App without breaking the normal web version.
Context: deployed at <URL>; frontend <framework>; backend <Workers/Node/Python> with existing user accounts.
Do this:
1. Load the official script https://telegram.org/js/telegram-web-app.js in <head> before our own code (it's harmless in a normal browser). Treat the app as "inside Telegram" only when WebApp.initData is non-empty; only then call WebApp.ready() and WebApp.expand() and switch on the Telegram-specific UI.
2. Map Telegram theme params to our design tokens (bg, text, hint, link, button, button text) so the app follows Telegram light/dark automatically. Listen to the themeChanged event.
3. Use Telegram's BackButton for in-app navigation and the main bottom button for our primary action.
4. On start, POST the raw WebApp.initData string (not initDataUnsafe) to /api/telegram/auth.
Constraints: outside Telegram everything works exactly as before. No new dependencies on the frontend except the official script.
Done when: opening the t.me link shows my app in Telegram's colours, and the normal URL in a browser is unchanged.
```

### 3. Validate initData on the server (40 min)

The algorithm, straight from Telegram's docs:

1. Parse `initData` as URL query parameters. Take out `hash`.
2. Sort **all** the remaining `key=value` pairs alphabetically by key (newer clients also send a `signature` field —
   it stays in) and join them with `\n` → the **data-check-string**.
3. `secret_key = HMAC_SHA256(key = "WebAppData", message = bot_token)`.
4. `expected = hex(HMAC_SHA256(key = secret_key, message = data_check_string))`.
5. Compare `expected` with `hash` in constant time. Also reject if `auth_date` is older than, say, 24 hours.

```text
Goal: add POST /api/telegram/auth that validates Telegram Mini App initData and logs the user in.
Implement the official algorithm exactly (WebAppData HMAC, alphabetical data-check-string, constant-time compare, reject auth_date older than 24h). Use Web Crypto if we're on Workers; or use a maintained library (e.g. @telegram-apps/init-data-node, or aiogram's safe_parse_webapp_init_data in Python) if it fits our stack.
The bot token comes from an environment secret, never from the client.
On success: find or create the user by telegram_id, start our normal session, return the user.
On failure: 401 with a clear error. Log why validation failed, never log the token.
Tests: one valid initData fixture (signed in the test with a fake token), one with a tampered user field, one expired. All three must behave correctly.
Done when: tests pass, and inside Telegram the app greets me by name from the server response.
```

Now attack yourself: open the app in Telegram, copy the `initData` your frontend sends (log it once in dev),
change one letter in the user's name and send it with curl:

```bash
curl -i -X POST https://<your-app>/api/telegram/auth \
  -H "Content-Type: application/json" \
  -d '{"initData":"<the tampered string>"}'
```

You want `401`. If you get `200`, your validation isn't validating. (On Windows, run this in Git Bash — PowerShell
handles the quotes and line breaks differently — or simply ask the agent to send the request for you.)

> **If you're stuck:** the most common bug is building the data-check-string from already-decoded JSON in a different
> order, or including `hash` in it. Second most common: using the bot token directly as the HMAC key instead of the
> `WebAppData`-derived secret. Paste your function and the docs section to the agent and ask it to compare line by line.
> A white screen inside Telegram? Open the Mini App on Telegram Desktop with WebView inspection enabled (see the
> "Debug Mode" section of the Mini Apps docs) to get DevTools.

> **Money note:** if you ever sell **digital** goods or features inside a Mini App, Telegram requires payment in
> **Telegram Stars** (currency `XTR`): your bot creates an invoice link, the app calls `WebApp.openInvoice()`.
> Physical goods and services can use regular payment providers. Read the Stars page in the resources before
> you plan pricing — rules change.

For proof of task 3, write 3–5 sentences: what fields you check, where the token lives, what happens on failure,
and the result of your tampered-curl test.

## Quiz

1. The frontend sends `{"userId": 777}` taken from `initDataUnsafe`. Can the server use it?
2. Why does the check include `auth_date`?
3. Can you validate `initData` in the browser to save a server round-trip?
4. Your Mini App calls the Claude API directly from the frontend with your key. What's wrong?

> **Answers:**
>
> 1. No. `initDataUnsafe` is unsigned convenience data — anyone can forge it. Use only what the server extracted from a
>    validated `initData`.
> 2. To stop replay: a valid string copied last month shouldn't log anyone in today.
> 3. No. Validation needs the bot token; putting it in the browser hands your bot to everyone.
> 4. The key is visible to every user. All model calls go through your server, which checks the session first.

## You're done when…

- [ ] You can explain what `initData` is and why `initDataUnsafe` is not proof of anything.
- [ ] Your app opens from a `t.me/...` link in Telegram's theme colours; you pasted that link.
- [ ] Your server validates `initData`, a tampered string gets `401`, and you described how in a few sentences.
- [ ] You answered the quiz.

**Tomorrow:** you'll have users from the web, a PWA and Telegram. Time to ask your data some questions.
