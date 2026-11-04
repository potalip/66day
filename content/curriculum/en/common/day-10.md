---
day: 10
track: common
phase: 1
title: "Debugging with an agent"
summary: "Hunt three planted bugs with a calm five-step loop, and learn the escape moves that rescue an agent going in circles."
estMinutes: 75
resources:
  - "https://missing.csail.mit.edu/2020/debugging-profiling/"
  - "https://git-scm.com/book/en/v2"
  - "https://docs.anthropic.com/en/docs/claude-code/overview"
tasks:
  - id: d10-t1
    type: read
    title: "Learn the loop: reproduce, read, hypothesize, fix, verify"
    xp: 10
    proof: none
  - id: d10-t2
    type: build
    title: "Find and fix three planted bugs, one line on each cause"
    xp: 50
    proof: text
  - id: d10-t3
    type: build
    title: "Rescue a looping agent and paste your rescue prompt"
    xp: 30
    proof: text
  - id: d10-t4
    type: quiz
    title: "Read four error messages like a detective"
    xp: 15
    proof: none
---

Sooner or later your agent will say "Fixed it!" for the fourth time while the same error stares back at you. That's
not a sign you're bad at this — it's Tuesday. The difference between people who give up and people who ship is a
boring, reliable method for finding what's wrong, plus a few moves for pulling an agent out of a loop.

## The debugging loop

1. **Reproduce.** Make the bug happen on purpose, with one command or one click. If you can't trigger it, you can't
   prove you fixed it.
2. **Read.** Read the error message slowly, all of it. Note the file, the line number and the *first* line of the
   error — the rest is usually a trail of breadcrumbs.
3. **Hypothesize.** Say one guess out loud: "I think `data.current` is empty because the request failed." One guess
   at a time.
4. **Fix.** Change one thing. Small changes are easy to undo.
5. **Verify.** Run the exact reproduction again. Then check you didn't break something next to it.

A doctor doesn't prescribe three medicines at once and hope. Neither should you — or your agent.

The sneakiest bugs don't crash at all. They just give wrong answers. For those, step 1 means writing down what the
output *should* be before you run anything, so you can see the gap.

## Step by step

### 1. The bug hunt (50 min)

Save this file as `streak.mjs` in any folder. It has **exactly three bugs**. None of them crashes the program.

```js
// streak.mjs — sums up your 66-day log
const log = [
  { day: "2026-11-01", minutes: 60 },
  { day: "2026-11-02", minutes: 45 },
  { day: "2026-11-03", minutes: 0 },
  { day: "2026-11-04", minutes: 90 },
  { day: "2026-11-05", minutes: 75 },
];

function totalMinutes(entries) {
  let total = 0;
  for (let i = 1; i < entries.length; i++) {
    total += entries[i].minutes;
  }
  return total;
}

function currentStreak(entries) {
  let streak = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].minutes > 0) streak++;
    else break;
  }
  return streak;
}

function bestDay(entries) {
  let best = entries[0];
  for (const entry of entries) {
    if (entry.minutes < best.minutes) best = entry;
  }
  return best.day;
}

const total = totalMinutes(log);
console.log(`Total: ${(total / 60).toFixed(1)} h`);
console.log(`Current streak: ${currentStreak(log)} days`);
console.log(`Best day: ${bestDay(log)}`);
console.log(`Average: ${Math.round(total / log.lenght)} min/day`);
```

**Reproduce first, by hand.** Look at the log and work out the correct answers on paper: total hours, current streak,
best day, average minutes per day. Then run it:

```bash
node streak.mjs
```

Circle every line where the output disagrees with your paper. Each mismatch points at a function.

**Hypothesize before you ask.** Spend ten minutes guessing on your own — you know more JavaScript than you think after
day 5. Then bring in the agent, but make it follow the loop instead of rewriting everything:

```text
Goal: find the bugs in streak.mjs. Don't edit the file yet.

Context: for this log the correct output is: Total 4.5 h, Current streak 2 days, Best day 2026-11-04,
Average 54 min/day. The actual output is: <paste what you got>.

Constraints:
- For each wrong line, point to the exact line of code responsible and explain the cause in one sentence.
- Propose the smallest possible fix for each (one line), but wait for my OK before changing anything.

Done when: every output line matches the correct values after the fixes, and you've shown me the diff.
```

Approve the fixes, run `node streak.mjs` again, and compare with your paper. That's verify.

**Proof:** three lines, one per bug: where it was and why it was wrong, in your own words.

<details><summary>Check your hunt (open only after you're done)</summary>

1. `totalMinutes` starts at `i = 1`, so it skips the first day. Should start at `0`.
2. `bestDay` uses `<`, so it finds the *worst* day. Should be `>`.
3. `log.lenght` is a typo, so it's `undefined` and the average becomes `NaN`. Should be `log.length`.

`currentStreak` was innocent. Suspecting an innocent function and clearing it is also good debugging.

</details>

### 2. Rescue a looping agent (30 min)

An agent is **looping** when it keeps trying fixes that don't change the result, rewrites more and more code, or
undoes its own previous fix. Here are the escape moves, in order:

1. **Stop.** Interrupt it (in Claude Code press `Esc`; in most terminals `Ctrl+C` works). Don't let it dig deeper.
2. **Give the exact error.** Copy-paste the real message and the command that produced it. "It's broken" is not an error.
3. **Narrow the scope.** Name the one file or function it may touch. Forbid everything else.
4. **Ask for causes before code.** "List three possible causes and how to test each, then wait."
5. **Reset.** If the code got messier, go back to the last good commit, then start a **fresh session** (`/clear` in
   Claude Code, or a new chat) with a short summary. A clean context often fixes what twenty messages couldn't.

```bash
git status                 # what changed?
git diff                   # how exactly?
git restore .              # throw away uncommitted changes (careful: they're gone)
git log --oneline          # find the last good commit if you need to go further back
```

Practise on a fake emergency. Open your day 8 weather page and misspell one parameter in the API URL — say,
`temprature_2m`. Don't fix it yourself. Tell the agent only "the weather line is broken, fix it" and watch for two
minutes. Then run all five escape moves, starting with a proper rescue prompt like this:

```text
Stop. Don't change any files.
The weather line on my page shows the fallback. Exact error from the browser console / Network tab:
<paste>
Reproduce: open index.html, reload.
Scope: only weather.js. Don't touch the HTML or CSS.
First list 3 possible causes, ranked, with a way to check each without editing code. Then wait for me.
```

Finish with `git restore .` or a proper fix, and make sure the live line is back.

**Proof:** paste your rescue prompt.

> **If you're stuck:** if you can't tell whether the agent is looping, count. Three attempts at the same error
> without new information = loop. Stop at three.

## Quiz

What does each message tell you, and where do you look first?

1. `TypeError: Cannot read properties of undefined (reading 'temperature_2m') at weather.js:14:31`
2. `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
3. `Error: listen EADDRINUSE: address already in use :::5173`
4. `ReferenceError: totl is not defined`

<details><summary>Answers</summary>

1. The thing *before* `.temperature_2m` — `data.current` — is undefined, on line 14, column 31. The API probably
   returned an error object instead of weather. Check the response in the Network tab.
2. Your code expected JSON but got an HTML page — usually a wrong URL that returned a 404 page.
3. Another program (often an older dev server) already uses port 5173. Stop it or use another port.
4. A name that was never declared — here a typo for `total`.

</details>

## You're done when…

- [ ] You can recite the five steps of the loop.
- [ ] All three bugs are fixed and you pasted one line on each cause.
- [ ] You ran the escape moves on a real or staged loop and pasted your rescue prompt.
- [ ] You can read an error message for file, line and the actual problem.

**Tomorrow:** your AI script grows a backend and goes online — with the key safely hidden.
