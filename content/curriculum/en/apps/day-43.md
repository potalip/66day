---
day: 43
track: apps
phase: 3
title: "Put your app on the home screen"
summary: "Turn your main app into a PWA: an icon on the phone, a full-screen launch, and a polite offline screen instead of a dinosaur."
estMinutes: 75
resources:
  - "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"
  - "https://vite.dev/guide/"
tasks:
  - id: d43-apps-t1
    type: read
    title: "Learn the three parts of a PWA: manifest, service worker, offline"
    xp: 10
    proof: none
  - id: d43-apps-t2
    type: build
    title: "Make your app installable with basic offline and screenshot it on a home screen"
    xp: 50
    proof: file
  - id: d43-apps-t3
    type: quiz
    title: "Quiz: what can a PWA actually do?"
    xp: 15
    proof: none
  - id: d43-apps-t4
    type: reflect
    title: "Decide: app store, PWA or bot, and for whom"
    xp: 15
    proof: text
---

Your users open your app from a bookmark they can't find, inside a browser tab buried under 40 others. Today you
give it an icon on their phone, a full-screen launch with no address bar, and a calm "you're offline" screen when the
train enters a tunnel. No app store review, no $99 developer fee — just three files and an hour.

## What a PWA really is

A **Progressive Web App** is your normal website plus three things:

1. **A web app manifest** — a small JSON file that tells the phone the app's name, icon, colours and how to open
   (`"display": "standalone"` means "no browser bar, look like an app").
2. **A service worker** — a script the browser runs in the background, between your app and the network. Think of it
   as a doorman: every request passes through it, and it can answer from a cache when the network is gone.
3. **HTTPS** — which you already have, because your app is deployed.

That's it. The browser looks at the manifest, sees a valid icon and HTTPS, and offers "Install app". The service worker
is what makes the offline part work.

> **Important — iOS is different.** On iPhone there's no automatic install prompt. The user opens the Share menu and
> taps **Add to Home Screen**. Push notifications work on iOS only for apps that were added this way (iOS 16.4+), and
> Safari can clear a PWA's cached data if it isn't used for a while. Design for this: show a small "How to install on
> iPhone" hint, and never treat the offline cache as the only copy of anything important.

## What "basic offline" means today

Don't try to make your whole app work offline — that's a sync engine, and a week of work. Today's bar:

- The **app shell** (HTML, CSS, JS, icons, fonts) is cached, so the app opens instantly even with no signal.
- **API calls** go network-first; if the network fails, the user sees a friendly message, not a blank page.
- Optionally, the **last data the user saw** (e.g. their list) is shown read-only, with a "you're offline" banner.

## Step by step

### 1. Read and decide (10 min)

Skim the MDN PWA page in the resources. Then decide what your offline screen says. Write it like a human:
"You're offline. Your last 10 notes are below — new ones will need a connection."

### 2. Make it installable (35 min)

If your app is built with Vite, the agent will probably reach for `vite-plugin-pwa`, which generates the manifest and a
Workbox service worker for you. That's a good choice. Give it the job:

```text
Goal: make my main app an installable PWA with basic offline support.
Context: it's a Vite app deployed at <your live URL>; the API lives under /api.
Do this:
1. Add a web app manifest: name, short_name (max 12 chars), start_url "/", display "standalone",
   theme_color and background_color matching our design tokens, icons 192x192 and 512x512 plus a
   maskable 512 icon generated from our logo (put the source image in /public).
2. Add a service worker (vite-plugin-pwa with Workbox is fine): precache the app shell; network-first for /api
   with a 3-second timeout; never cache POST requests or anything with auth headers.
3. Add an offline fallback: if a page or API call fails offline, show a friendly offline banner/page
   (in every language the app supports), not a blank screen.
4. Add an "Install app" button that uses beforeinstallprompt where supported, and on iOS Safari shows a
   short hint: Share -> Add to Home Screen.
5. Make sure a new deploy updates the app: show "New version available — reload" instead of serving stale code forever.
Constraints: don't change existing features; keep the build passing.
Done when: Chrome DevTools > Application shows a valid manifest and an active service worker,
and with Network set to Offline the app still opens and shows the offline message.
```

Then verify it yourself:

```bash
npm run build && npm run preview
```

Open it in Chrome, press F12 → **Application** → **Manifest** (no red errors) → **Service workers** (status:
activated). Go to the **Network** tab, set throttling to **Offline**, reload. The app should open.

> **If you're stuck:** "Service worker not registering" almost always means you're on plain `http://` on a device
> other than localhost, or the worker file is served from a subfolder and can't control `/`. Paste the exact
> DevTools error to your agent. If an old version keeps showing up, tick **Update on reload** in the Service workers
> panel — and remember your users don't have that checkbox, which is why step 5 matters.

### 3. Install it on a real phone (10 min)

Deploy, then open the live URL on your phone. Android/Chrome: menu → **Install app** (or your button). iPhone/Safari:
Share → **Add to Home Screen**. Launch it from the icon. Turn on airplane mode and open it again.

Take a screenshot of your home screen with the icon visible — that's your proof. Bonus: a second screenshot of the
offline screen in airplane mode.

## Quiz

1. Can a PWA send push notifications on an iPhone?
2. Your app opens offline, but the user's list is empty. Is the service worker broken?
3. Can a PWA get into Google Play?
4. Can a PWA read the user's contacts and SMS like a native app?

<details><summary>Answers</summary>

1. Yes, on iOS 16.4+, but only after the user adds it to the home screen and grants permission. In a regular Safari
   tab — no.
2. Probably not. You cached the app shell, not the data. Caching API responses (or storing the last result in
   IndexedDB) is a separate decision.
3. Yes, by wrapping it as a Trusted Web Activity (tools like Bubblewrap or PWABuilder do this). The App Store is much
   stricter about thin web wrappers.
4. No. Web apps get camera, microphone, location, notifications and files — with permission — but not contacts, SMS
   or deep system access. Some APIs (Bluetooth, USB) work only in Chromium browsers.

</details>

## Reflect: app store, PWA or bot?

You now have three ways to reach a phone: a PWA, your Telegram bot, and (in theory) a native app. In 4–6 sentences:
for **your** users, which one would they actually open every day, and why? Think about who they are: a nurse
checking a schedule between shifts wants an icon; a group of friends splitting bills already lives in a chat; a
fitness tracker that needs step counts in the background really does need native.

## You're done when…

- [ ] You can explain manifest, service worker and offline in one sentence each.
- [ ] Your live app shows "Install" on Android/desktop Chrome and installs on iOS via Add to Home Screen.
- [ ] You uploaded a screenshot of your app's icon on a real home screen.
- [ ] In airplane mode the app opens and shows a friendly offline message.
- [ ] You answered the quiz and wrote your app store / PWA / bot reflection.

**Tomorrow:** the same app, but inside Telegram — with users who never have to sign up.
