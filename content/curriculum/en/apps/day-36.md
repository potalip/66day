---
day: 36
track: apps
phase: 3
title: "A launch page that converts"
summary: "One page, one promise, one button. You build your app's landing page and let five real people pick the headline."
estMinutes: 90
resources:
  - "https://www.producthunt.com/"
  - "https://news.ycombinator.com/showhn.html"
  - "https://tailwindcss.com/docs"
tasks:
  - id: d36-apps-t1
    type: read
    title: "Learn the four parts: problem, promise, proof, call to action"
    xp: 10
    proof: none
  - id: d36-apps-t2
    type: build
    title: "Build and deploy a landing page for your main app"
    xp: 50
    proof: link
  - id: d36-apps-t3
    type: build
    title: "Test 5 headlines with 5 people and record the votes"
    xp: 20
    proof: text
  - id: d36-apps-t4
    type: share
    title: "Share your landing page publicly"
    xp: 20
    proof: link
---

Welcome to Phase 3: Ship. Your app works, it's tested, it takes payments, it's reasonably safe. And almost nobody
knows it exists. A stranger who lands on your app today sees a login screen and leaves. Today you give them a reason
to stay: a single page that explains, in five seconds, why this app is for them.

## Problem, promise, proof, call to action

Every landing page that works has the same four parts, top to bottom:

1. **Problem**: the annoyance, in the user's own words. "Your group chat has 400 messages and nobody knows who's
   bringing the tent." If a reader nods, you've got them.
2. **Promise**: the headline. What their life looks like after, specific and short. Not "AI-powered trip planning
   platform", but "Plan a group trip in one link, not 400 messages."
3. **Proof**: why believe you. A 20-second screen recording or 3 screenshots of the real app, a quote from one of
   your 3 users (with permission), a concrete number ("set up in 2 minutes").
4. **Call to action (CTA)**: exactly **one** primary button, repeated at the top and bottom. "Try it free", "Join the
   waitlist". Not five links competing for attention.

Below that, optional: 3 short "how it works" steps, a tiny FAQ (price, privacy, "do I need an account?"), and a footer
with contact and your privacy note from day 34.

The five-second test: show the page to someone for five seconds, hide it, ask "what does this do and who is it for?"
If they can't answer, the headline failed, not the person.

## Step by step

### 1. Write the words first (15 min)

Copy beats design. Ask the agent to help you think, then decide yourself:

```text
Goal: draft landing page copy for my app.
Context: the app does <one sentence>. Users are <who>. My 3 real users said: <paste their actual words or
feedback from day 27>.
Constraints: give me the problem in the user's words (2 sentences), 5 different headline options (max 10 words each,
no buzzwords like "revolutionary", "AI-powered", "seamless"), a one-line subheadline, 3 how-it-works steps,
3 FAQ entries and one CTA label.
Done when: each headline takes a different angle (time saved, pain removed, outcome, identity, curiosity).
```

Pick your favourite headline for now. You'll test it in step 3.

### 2. Build and deploy (40 min)

```text
Goal: a landing page for the app at the root URL "/" (move the app itself under "/app" if needed).
Context: our React + Vite + Tailwind project and design tokens; copy is below.
Constraints:
- Sections: hero (headline, subheadline, primary CTA, real screenshot or short muted autoplay video),
  problem, how it works (3 steps), proof (user quote with first name only), FAQ, final CTA, footer.
- One primary CTA style only (accent green). It goes to sign-up or a waitlist form that stores emails in our DB.
- Mobile-first: perfect at 390px; the CTA is visible without scrolling on a phone.
- Light and dark theme; Lighthouse mobile performance 90+; proper <title>, meta description and an Open Graph
  image so the link looks good when shared.
- Track a "cta_clicked" event with the analytics from day 34.
Done when: it's deployed and you show me phone and desktop screenshots in both themes.
```

Look at the screenshots like a stranger. Is the CTA obvious? Is there anything you'd skip? Cut it. Deploy and paste the live link.

> **If you're stuck:** if it looks generic, it's usually the screenshot. Replace stock illustrations with a real
> crop of your app doing the main thing. Real beats pretty. If the link preview in a messenger shows no image, ask the
> agent to check the `og:image` URL is absolute and publicly reachable.

### 3. Headline test with 5 people (20 min)

Take your 5 headlines from step 1. Send them to 5 people who could be users (not your mum, unless she's the target
user). Ask one question:

> "Which of these would make you click to try it? Pick one, and tell me in one sentence why."

Number them, shuffle the order for each person if you can. Record the votes, then put the winner on the page. Paste
for task 3: the 5 headlines, the votes, the best "why", and which headline is live now.

> **Tip:** if votes split evenly, the "why" sentences are the real data. People often tell you a better headline
> than any of yours. Steal it.

### 4. Share it (10 min)

Post the link where your users actually hang out: a relevant subreddit or community (read its self-promotion rules
first), X/Threads/LinkedIn with a 20-second screen recording, a Discord or Slack you're part of. Write like a human:
the problem, what you built, one honest ask ("I'd love to know where you get confused"). Save the big launches
(Product Hunt, Show HN) for when your capstone is ready. Paste the post link.

## You're done when…

- [ ] You can name the four parts and the five-second test.
- [ ] The landing page is live with one CTA, works at 390px in both themes, and tracks clicks. Link pasted.
- [ ] 5 headlines tested with 5 people; votes and the winner pasted.
- [ ] Shared publicly; post link pasted.

Tomorrow: people start talking back. You'll turn their feedback into GitHub issues and fixes.
