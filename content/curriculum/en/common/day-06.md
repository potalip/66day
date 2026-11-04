---
day: 6
track: common
phase: 1
title: "Git is your time machine"
summary: "Let the agent try a bold redesign on a branch, break things on purpose, and learn that with git nothing is lost."
estMinutes: 75
resources:
  - "https://learngitbranching.js.org/"
  - "https://git-scm.com/book/en/v2"
tasks:
  - id: d06-t1
    type: read
    title: "Understand commits, branches and why agents need them"
    xp: 10
    proof: none
  - id: d06-t2
    type: build
    title: "Try a redesign on a branch, then merge it or throw it away"
    xp: 40
    proof: text
  - id: d06-t3
    type: build
    title: "Break your page on purpose and bring it back with git"
    xp: 30
    proof: text
  - id: d06-t4
    type: quiz
    title: "Match each git command to what it undoes"
    xp: 15
    proof: none
---

Agents are fast, and fast means they can also wreck a working page in ten seconds. The answer isn't to trust them
less — it's to make every experiment cheap to undo. That's git's real job, and after today you'll let your agent
try wild ideas without a knot in your stomach.

## Commits, branches, and why agents need them

A **commit** is a snapshot of your whole folder with a message. Commits line up into a history you can read
(`git log --oneline`), compare (`git diff`) and return to.

A **branch** is a parallel timeline. `main` is the real one — it's what GitHub Pages shows. Make a branch called
`redesign`, and every commit there stays off `main` until you decide to **merge**. Hate the result? Delete the
branch; `main` never knew.

Five commands cover 90% of life:

```bash
git status                 # what changed since the last commit?
git diff                   # show the exact lines
git log --oneline          # the history, one line per commit
git switch -c redesign     # create a branch and step onto it
git switch main            # go back to main
```

> **Tip:** before any big agent task, commit what you have. A clean starting point is the best undo button there is.

## Step 1 — A redesign on a branch (25 min)

Make sure everything is committed (`git status` says "nothing to commit"), then:

```bash
cd ~/66-day-promise
git switch -c redesign
claude
```

```text
Goal: a bold redesign of my promise page. Try a completely different look: a new layout,
a new color mood, different typography. Surprise me.

Context: we're on a git branch called redesign, so it's safe to change a lot.

Constraints: keep all the content and the day counter working. Still one index.html,
still readable at 390px and in dark mode.

Done when: the page is open in my browser and the redesign is committed on the redesign
branch. Don't merge and don't push.
```

Look at it. Then jump between timelines and watch the page change after each switch (refresh the browser):

```bash
git switch main        # old design
git switch redesign    # new design
```

Now decide. **Keep it:**

```bash
git switch main
git merge redesign
git push
```

**Throw it away:**

```bash
git switch main
git branch -D redesign
```

Either choice is a win. You just ran an experiment with zero risk.

**Proof:** paste the output of `git log --oneline` from `main`, and one line on what you decided and why.

## Step 2 — Break it, then fix it (20 min)

**Break it before committing.** Open `index.html`, delete the entire `<style>…</style>` block, save, refresh.
Ugly, right? Now:

```bash
git status                  # index.html is "modified"
git diff                    # red lines: everything you deleted
git restore index.html      # back to the last commit
```

Refresh. Saved.

**Break it after committing.** Ask the agent: `change the headline to "oops" and commit it as "break on purpose"`,
then `git push`. The live site now says "oops" (give Pages a minute). Undo it:

```bash
git revert --no-edit HEAD   # a new commit that cancels the previous one
git push
```

`revert` doesn't erase history; it adds an "undo" commit. That's exactly what you want for anything already pushed.

> **If you're stuck:** git opened a strange text screen asking for a commit message? That's the editor Vim. Type
> `:wq` and press Enter to accept the default message. Totally lost? Run `git status` and paste the output to your
> agent with "explain where I am and how to get back to a clean main".

**Proof:** paste the commands you ran and the last 3 lines of `git log --oneline`.

## Quiz

Which command do you reach for?

1. You edited a file, didn't commit, and want it back the way it was.
2. A bad commit is already pushed to GitHub, and the live site is broken.
3. You want to try something risky without touching the live site.
4. You want to see exactly which lines the agent changed before you commit.

<details><summary>Answers</summary>

1. `git restore <file>` — throws away uncommitted changes to that file.
2. `git revert HEAD` then `git push` — adds a commit that undoes it, history stays honest.
3. `git switch -c experiment` — a branch; `main` (and Pages) stays untouched.
4. `git diff` — every added and removed line.

There's also `git reset --hard`, which rewinds and *erases*. Powerful and dangerous; leave it alone for now and
never use it on work you've already pushed.

</details>

## You're done when…

- [ ] You can explain a branch as "a parallel timeline".
- [ ] You pasted `git log --oneline` after merging or discarding the redesign.
- [ ] You broke your page twice and recovered both times, and pasted the commands.
- [ ] You answered the quiz.

**Tomorrow:** rest day. Look back at the week, and tell the world what you built.
