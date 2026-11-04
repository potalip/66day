---
day: 66
track: common
phase: 4
title: "Graduation: 66 days later"
summary: "Look at how far you've come, put your capstone at the top of your portfolio, and set your next 66 days."
estMinutes: 60
badges: [graduate]
resources:
  - "https://docs.anthropic.com/en/docs/claude-code/overview"
  - "https://missing.csail.mit.edu/"
tasks:
  - id: d66-t1
    type: reflect
    title: "Compare day 1 and day 66: write what's a habit now"
    xp: 30
    proof: text
  - id: d66-t2
    type: build
    title: "Update your portfolio with the capstone"
    xp: 30
    proof: link
  - id: d66-t3
    type: reflect
    title: "Plan your next 66 days: one goal, one weekly habit"
    xp: 20
    proof: text
  - id: d66-t4
    type: share
    title: "Publish your graduation post"
    xp: 30
    proof: link
---

Sixty-six days ago you typed one sentence into a terminal and waited to see what would happen. Yesterday you
launched something strangers can use or watch. There's nothing new to learn today. Today you measure the distance.

## Today's ritual: two tabs and a letter

Open two browser tabs side by side: the promise page you shipped on day 2, and your portfolio. Don't analyse
anything yet. Just look from one to the other.

Then open the letter you wrote to yourself on day 14. Read it once, slowly. Notice what you got right about
yourself — and what you didn't see coming.

## 1. Day 1 vs day 66 (20 min)

Start with three numbers. Count your commits across every project folder (the number from day 21 is your
checkpoint):

```bash
# run in the folder that holds your projects
for d in */; do [ -d "$d.git" ] && git -C "$d" log --oneline | wc -l; done | awk '{s+=$1} END {print s}'
```

Then: how many things you've put online, and how many real people have used or watched your work. Rough counts are
fine — honest ones only. (On Windows, run the loop in Git Bash.)

Now write, briefly and plainly:

- What did you need help with on day 1 that you now do alone?
- Which habits stuck? The daily slot, committing before risky changes, reading the error first, writing a spec
  before the prompt, shipping small, asking a real person instead of guessing.
- Which didn't stick? Name one without beating yourself up. It's information for the next 66.
- One sentence for day-1 you.

## 2. Put the capstone on top (20 min)

Your capstone is now your strongest piece. Give it the best seat:

```text
Goal: update my portfolio so the capstone is the first and largest piece.
Context: capstone details: (name, one-line result, live link or channel, launch post link).
Numbers from my 24-hour launch report: (paste). Demo or trailer: (link or file).
Constraints: keep the existing design; move the weakest older piece off the page if there are now more than 5;
add a short case study page for the capstone using the problem → process → result → numbers shape;
update the headline if my niche has changed: (new headline or "keep it").
Done when: it looks right at 390px and 1280px, all links work, and it's deployed.
```

Apps people: link the live product and your launch post. Video people: embed the trailer or first episode so it
plays right on the page, and link the channel or tool.

## 3. Your next 66 days (10 min)

One goal, one weekly habit. Not ten. Ten is how plans die.

- **Goal** — specific and checkable on day 132: "3 paying clients", "v2 of my app with 50 weekly users",
  "12 episodes of my series", "20 applications for junior AI-builder roles".
- **Weekly habit** — small enough to survive a bad week: "Every Friday I ship one thing and post it." "Every Sunday:
  one proposal, one follow-up."

Then go back to where you started: add a short *Next 66* section to your day-1 promise page with the goal and the
habit, and push it. The page that held your first promise now holds the next one.

## 4. The graduation post (10 min)

Skip "what a journey". Be specific, the way you've learned to be:

```text
66 days ago I'd never opened a terminal. Today: 412 commits, 9 things live, 1 launched product
that 140 people have tried, 1 paying client.
What's a habit now: I write a spec before I prompt, and I ship before I'm ready.
Hardest part: week 5, when nothing deployed and I nearly quit.
Next 66 days: three paying clients. Portfolio: (link)
```

Those numbers are an example; use yours, even if they're small. Small and true is what makes people trust the rest.
Add the two screenshots — day 2 and today. Post it wherever you've been posting your build log, and tag the people
who tested, watched or helped along the way.

## You're done when…

- [ ] You pasted day 1 vs day 66: your numbers, what's a habit now, what didn't stick, and the line for day-1 you.
- [ ] Your portfolio leads with the capstone; you pasted the link.
- [ ] You pasted one goal and one weekly habit for the next 66 days.
- [ ] You pasted the link to your graduation post.

## One last thing

The research behind the number 66 found that habits take around that long, on average, to become automatic — and
that missing a single day doesn't undo them. So here's the truth about tomorrow: there's no lesson, no XP, no
checklist. Day 67 is just a day.

Open the terminal anyway. Not because a program told you to. Because by now, you'd miss it.
