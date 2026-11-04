---
day: 32
track: apps
phase: 2
title: "Taking money: payments that can't be faked"
summary: "A test-mode Stripe checkout unlocks a paid feature via a verified webhook, and cancelled, failed and duplicate payments are handled."
estMinutes: 120
badges: [money-ready]
resources:
  - "https://docs.stripe.com/payments/checkout"
  - "https://docs.stripe.com/webhooks"
tasks:
  - id: d32-apps-t1
    type: read
    title: "Understand how an online payment really flows"
    xp: 10
    proof: none
  - id: d32-apps-t2
    type: build
    title: "Wire test checkout → webhook → feature unlocked"
    xp: 60
    proof: file
  - id: d32-apps-t3
    type: build
    title: "Handle cancelled, failed and duplicate payments"
    xp: 30
    proof: text
  - id: d32-apps-t4
    type: quiz
    title: "Prove you never trust the redirect"
    xp: 15
    proof: none
---

The day someone pays for something you built is a different day. Today you build the whole money path in **test
mode**: no real cards, no real money, but exactly the same code you'd run in production. By tonight your app has a
"Pro" switch that only a real (test) payment can flip.

## How a payment really flows

Five actors: your **front end**, your **server**, **Stripe**, the **customer's bank**, and Stripe's **webhook** back
to you. The flow with Stripe Checkout (a payment page Stripe hosts for you, so card numbers never touch your app):

1. User clicks "Upgrade". Your **server** creates a Checkout Session (price, user id in `metadata` or
   `client_reference_id`, `success_url`, `cancel_url`) and returns its URL.
2. The browser goes to Stripe's page. The user pays, or doesn't.
3. Stripe redirects the browser to your `success_url`. **This proves nothing.** Anyone can type that URL.
4. Separately, server to server, Stripe sends a **webhook**: a signed POST to `/api/stripe/webhook` with an event
   like `checkout.session.completed`.
5. Your server **verifies the signature**, checks the event is new, and only then sets `plan = 'pro'` in the database.

The success page just says "Thanks! Activating…" and polls your API until the database says Pro.

> **Important:** Stripe availability depends on your country. If you can't open an account where you live, do the
> lesson with the closest provider available to you (Paddle, Lemon Squeezy and others work as a "merchant of record").
> The pattern below (server-created session, signed webhook, idempotent unlock) is the same everywhere.

## Step by step

### 1. Set up Stripe test mode (15 min)

Create a Stripe account, stay in **test mode** (toggle in the dashboard), create a Product "Pro" with a one-time or
monthly Price, and copy the Price id (`price_...`). Put your **test** secret key in `.dev.vars` / `.env` as
`STRIPE_SECRET_KEY`. Install the Stripe CLI and log in:

```bash
stripe login
stripe listen --forward-to localhost:8787/api/stripe/webhook
# it prints a webhook signing secret: whsec_... → save it as STRIPE_WEBHOOK_SECRET
```

### 2. Build checkout → webhook → unlock (55 min)

```text
Goal: users can buy "Pro" with Stripe Checkout (test mode) and Pro unlocks only via a verified webhook.
Context: our app (React + Vite, API on Cloudflare Workers / Node, D1 database, auth from day 24).
Price id is in env STRIPE_PRICE_ID; keys in STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.
Constraints:
- POST /api/billing/checkout (signed-in only) creates a Checkout Session with client_reference_id = user id
  and returns the URL. Never accept price or user id from the browser.
- POST /api/stripe/webhook reads the RAW body and verifies the Stripe-Signature header
  (on Workers use the async verification with the SubtleCrypto provider). Reject invalid signatures with 400.
- On checkout.session.completed with payment_status "paid": set users.plan = 'pro' for client_reference_id.
- Store processed event ids in a stripe_events table (id UNIQUE); if seen before, return 200 and do nothing.
- The success page polls GET /api/me until plan is 'pro'. One Pro-only feature checks plan on the SERVER.
- Missing Stripe keys: show "Payments not configured" instead of crashing.
Done when: a test card payment unlocks Pro, and the Pro feature returns 403 for a free user even via curl.
```

Test it with Stripe's test card `4242 4242 4242 4242`, any future date, any CVC. Watch the `stripe listen` terminal
print the event and your server answer `200`. Screenshot the unlocked Pro feature next to the Stripe dashboard's
test payment (or your terminal showing the event). That's task 2.

> **If you're stuck:** "No signatures found matching the expected signature" almost always means your framework
> parsed the JSON before verification. The check needs the raw text body, byte for byte. Second most common: you're
> using the dashboard's webhook secret locally instead of the `whsec_` that `stripe listen` printed.

### 3. Unhappy paths (35 min)

Real money is mostly edge cases. Make each one boring:

- **Cancelled**: user closes the Stripe page or hits back. They land on `cancel_url`: friendly message, still free, no error.
- **Failed**: card declined. Test with `4000 0000 0000 0002`. Stripe shows the error on its page; nothing changes in
  your database. Check it.
- **Duplicate webhook**: Stripe retries webhooks and may send one twice. Re-send it yourself:
  `stripe events resend evt_...`. Your `stripe_events` table must make the second one a no-op.
- **Webhook arrives before the redirect** (or long after): your success page polls, so both orders work.
- **Refund** (bonus): handle `charge.refunded` and set the plan back to free.

```bash
stripe trigger checkout.session.completed
stripe events resend evt_XXXXXXXX
```

Paste for task 3: how each of the four cases behaves in your app and which line of code makes the duplicate safe.

> **Security:** never log full webhook payloads with customer emails to public places, never put the secret key in the
> front end, and before going live switch to live keys only in production env, after a review.

## Quiz

1. The user lands on `/success?session_id=cs_test_...`. Can you unlock Pro now?
2. Why must the server, not the browser, choose the price?
3. Stripe sent the same event twice. What stops a double unlock or double email?
4. Your webhook returns 500 for an hour. What does Stripe do?

<details><summary>Answers</summary>

1. No. Anyone can open that URL. Unlock only on a verified webhook (or by fetching the session from Stripe's API on the server).
2. Anything from the browser can be edited. A user could buy "Pro" for one cent.
3. Storing the event id with a unique constraint and skipping already-processed events.
4. It retries with backoff for a while (check the current docs for the window), so your handler must be idempotent.

</details>

## You're done when…

- [ ] You can draw the five-step flow and point at the step you never trust.
- [ ] Test payment → verified webhook → Pro unlocked. Screenshot uploaded.
- [ ] Cancelled, declined, duplicate and early-webhook cases described and tested.
- [ ] Quiz done. Badge: **money-ready**.

Tomorrow: the less fun but critical day. Making sure nobody can steal from you, your users or your API bill.
