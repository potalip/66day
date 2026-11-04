---
day: 34
track: apps
phase: 2
title: "Polish: fast, accessible, measurable"
summary: "Lighthouse and accessibility fixes with before/after scores, plus privacy-friendly analytics and an error log that tells you the truth."
estMinutes: 90
resources:
  - "https://developer.mozilla.org/en-US/docs/Web/Accessibility"
  - "https://plausible.io/docs"
  - "https://posthog.com/docs"
tasks:
  - id: d34-apps-t1
    type: read
    title: "Learn the basics of speed, accessibility and measurement"
    xp: 10
    proof: none
  - id: d34-apps-t2
    type: build
    title: "Run a Lighthouse and accessibility pass with before/after scores"
    xp: 50
    proof: file
  - id: d34-apps-t3
    type: build
    title: "Add your own events table, analytics and an error log; capture the first event"
    xp: 30
    proof: text
  - id: d34-apps-t4
    type: reflect
    title: "Write down what your users actually do"
    xp: 15
    proof: text
---

Right now you're guessing. You guess the app is fast (on your laptop, on Wi-Fi). You guess people can use it (with a
mouse, with perfect eyesight). You guess which feature they love. Today you swap guesses for numbers: a speed score,
an accessibility score, real usage events, and a log that tells you when something breaks for someone else.

## Three things, in plain words

**Speed.** Users on a mid-range phone and a patchy 4G connection decide in about three seconds. Lighthouse (built
into Chrome DevTools) simulates exactly that and scores you 0–100. The usual culprits: huge images, a giant JavaScript
bundle, fonts that block the page, layout that jumps while loading.

**Accessibility (a11y).** About one in six people lives with some disability, and everyone is "temporarily disabled"
sometimes: bright sun, a broken arm, one hand holding a baby. Basics: real buttons (not clickable `div`s), labels on
every input, enough colour contrast, visible focus outlines, works with the keyboard alone, images have `alt` text.

**Measurement.** Two different tools for two questions:
- *Analytics*: "what do people do?" Page views, sign-ups, the key action. The backbone is **your own `events` table**
  in D1: one row per meaningful action, written by a tiny `track()` helper. You own it, you can query it with SQL
  (day 45) and reuse it for your capstone (day 54). A dashboard tool on top is optional: **Plausible** (cookieless,
  paid or self-hosted) or **PostHog** (free tier, EU hosting). Collect as little as you need, no personal data.
- *Error logging*: "what broke, for whom, when?" Catch front-end errors and failed API calls, store them, get a ping.

## Step by step

### 1. Measure "before" (10 min)

Open your live app in Chrome → DevTools → **Lighthouse** → Mobile → Analyze. Screenshot the four scores. Or from the
terminal:

```bash
npx lighthouse https://your-app.example --form-factor=mobile --output=html --output-path=before.html --view
```

Also try your main flow **with only the keyboard**: Tab, Shift+Tab, Enter, Space, Escape. Note where you get stuck or
lose the focus.

### 2. Fix with the agent (35 min)

Give the agent the report, not your feelings:

```text
Goal: raise our Lighthouse mobile Performance and Accessibility scores without changing features.
Context: here is the Lighthouse report (paste the failed audits) and my keyboard notes: <notes>.
Constraints:
- Images: correct sizes, modern formats, width/height set, lazy-load below the fold.
- Split heavy routes with dynamic import; remove unused dependencies.
- Accessibility: real buttons and links, labels on all inputs, contrast at least 4.5:1 in BOTH light and dark themes, visible focus styles, dialogs trap focus and close on Escape, meaningful alt text.
- Add an automated a11y check: a Playwright test using @axe-core/playwright on the main pages, run in CI.
Done when: you list each fix with the audit it addresses; CI is green.
```

Measure again with the same settings, and save the "after" screenshot. Upload a single image with before and after
side by side for task 2. Don't chase 100: 90+ on accessibility and a clear gain on performance is a great day.

> **If you're stuck:** scores jumping around between runs is normal for Performance. Run three times and take the
> middle. For contrast failures in dark mode, ask the agent to fix the colour tokens once, not each component.

### 3. Analytics + error log (30 min)

```text
Goal: privacy-friendly analytics and an error log.
Constraints:
- Events table (D1 migration): events(id, user_id NULL, anon_id, name, props_json, created_at), with indexes on (name, created_at) and (user_id, created_at). anon_id is a random id in a first-party cookie, so visitors who haven't signed up are counted too; link it to user_id on sign-up.
- A server helper track(name, props) used inside our API handlers, plus POST /api/events for front-end-only events (accepts only an allow-list of names, rate-limited). Never let a failed track() break the user's request.
- Track exactly: session_started, signup_completed, core_action_done, ai_called (props: model, tokens, ms), upgrade_clicked. Props never contain emails, names or message text.
- Optional: mirror the same events to Plausible OR PostHog (EU host, session recording and input autocapture off), production only.
- Error log: window error + unhandledrejection handlers and an API error middleware send
  {message, stack (trimmed), route, release, time} to POST /api/errors, stored in an errors table.
  Rate-limit that endpoint. A new error type sends me one Telegram message (reuse day 31's helper).
- A tiny /admin/errors page (owner only) listing the last 50 errors.
- Mention analytics in our privacy note in one plain sentence.
Done when: I trigger a test event and a test error and see both, and this query works:
SELECT name, COUNT(*) FROM events GROUP BY name.
```

Add a hidden test button or run `setTimeout(() => { throw new Error("test from day 34") })` in the browser console
(a bare `throw` typed into the console doesn't reach your error handler). Then do your main action and check
it landed: `npx wrangler d1 execute <db-name> --remote --command "SELECT name, created_at FROM events ORDER BY id DESC LIMIT 5"`.
Paste for task 3: the five event names, the output of that query, any dashboard tool you added, and the first error you saw.

> **Tip:** Sentry is the industry-standard error tracker with a free tier. If you'd rather not build your own log,
> it's a fine choice. Do it with the same rules: no personal data, owner-only access.

### 4. Reflect (10 min)

Wait until your 3 users have used the app (or ask them to today), then look at the numbers and write 4–6 sentences:
where do people drop off, which feature nobody touches, what surprised you, and **one** change you'll make because of it.

## You're done when…

- [ ] You can say what Lighthouse, a11y basics and analytics each measure.
- [ ] Before/after Lighthouse scores uploaded; axe test runs in CI.
- [ ] An `events` table with 5 tracked events and an error log are live; query output and first error pasted.
- [ ] Reflection on real user behaviour written.

Next: a rest day, then Phase 3. Your app goes out into the world, starting with a launch page.
