---
day: 38
track: apps
phase: 3
title: "Many agents at once"
summary: "Two agents fix two issues in parallel, each in its own worktree, and you review their pull requests like a senior engineer."
estMinutes: 90
resources:
  - "https://git-scm.com/docs/git-worktree"
  - "https://docs.anthropic.com/en/docs/claude-code/overview"
  - "https://www.anthropic.com/engineering/building-effective-agents"
tasks:
  - id: d38-apps-t1
    type: read
    title: "Understand parallel agents, worktrees and subagents"
    xp: 10
    proof: none
  - id: d38-apps-t2
    type: build
    title: "Run 2 agents on 2 issues in parallel"
    xp: 50
    proof: link
  - id: d38-apps-t3
    type: build
    title: "Review an agent PR and write 3 senior-style comments"
    xp: 30
    proof: text
  - id: d38-apps-t4
    type: quiz
    title: "Decide when not to parallelize"
    xp: 15
    proof: none
---

Yesterday you watched one agent work while you waited. That waiting is the bottleneck now, not the typing. Today you
become a tiny engineering manager: two agents, two tasks, at the same time, and you spend your attention where it
matters most, on reviewing what they produce.

## Worktrees, branches and subagents

Two agents in **one folder** is chaos: they edit the same files, one runs tests while the other is halfway through a
change, and `git status` becomes a crime scene. You need separate workspaces.

- A **branch** is a separate line of history. But one folder can only have one branch checked out at a time.
- A **git worktree** is a second (third, fourth…) folder linked to the same repository, each with its own branch
  checked out. Same history, separate files. Perfect for one agent per folder.
- **Subagents** are helpers that one agent starts for itself, for example to search the codebase or review a diff,
  each with a fresh context. Claude Code supports them, and so do other agents in some form. Good for research and
  review inside one task; worktrees are for truly separate tasks.

The analogy: worktrees are two desks with two copies of the same blueprint. Subagents are interns your lead engineer
sends to the archive.

## Step by step

### 1. Pick two issues that don't collide (10 min)

From yesterday's backlog, pick two issues that touch **different parts** of the app, e.g. one front-end text/layout
fix and one API or data fix. Ask yourself: would both changes edit the same file? If yes, pick another pair.

### 2. Make two worktrees (10 min)

From your main project folder (`~/66/apps/main-app`):

```bash
git switch main && git pull
git worktree add ../main-app-issue-21 -b fix/issue-21
git worktree add ../main-app-issue-22 -b fix/issue-22
git worktree list
```

Each new folder needs its own install and local config:

```bash
cd ../main-app-issue-21 && npm install && cp ../main-app/.dev.vars .dev.vars
```

(Same for the second one. Copy local secrets files by hand; they're in `.gitignore`, so git won't bring them.)

### 3. Two agents, two terminals (35 min)

Open two terminal windows (or two tabs, or two desktop-app sessions), one per worktree, and start an agent in each.
Give each a complete, self-contained brief:

```text
Goal: fix GitHub issue #21 (read it with gh issue view 21).
Context: you're working in a git worktree on branch fix/issue-21. Another agent is working on a different issue in parallel in another folder; don't worry about it, but stay inside this folder and this issue.
Constraints:
- Touch only files needed for this issue. No dependency upgrades, no formatting changes elsewhere.
- If you run a dev server, use port 5174 (`npm run dev -- --port 5174`; the other agent uses 5175).
- Add a test that fails before the fix. Run npm test and npm run build.
- Commit, push, and open a PR with gh pr create: what changed, why, how to test, "Fixes #21".
Done when: the PR is open and CI is green. Then stop and summarise in 3 lines.
```

While they work, don't babysit. Glance at each terminal every few minutes, answer questions, approve commands. This
is the new skill: keeping two contexts in your head without doing the work yourself. Paste both PR links for task 2.

> **If you're stuck:** "port already in use" means both dev servers want the same port; give each its own. A local
> database that seems empty in the second worktree is expected: run your migrations there too
> (`npm run db:migrate:local` or similar). And if the agents collide anyway, merge one PR, then ask the other agent to
> `git fetch origin && git rebase origin/main` and fix conflicts.

### 4. Review like a senior (25 min)

Agents write plausible code fast. Plausible isn't correct. A senior reviewer checks, in order:

1. **Does it solve the issue?** Pull the branch, run it, reproduce the original bug, see it gone.
2. **Scope**: anything changed that the issue didn't ask for? Unrelated files, renamed variables, new dependencies?
3. **Tests**: does the new test really fail without the fix? (Revert the fix locally and run it.)
4. **Edge cases and safety**: empty inputs, other users' data, error handling, secrets.
5. **Readability**: would you understand this in three months?

Pick one of the two PRs and leave **3 comments** in GitHub's review UI (Files changed → click a line → comment).
Make each one specific and actionable, like:

> "This query filters by `item_id` only. Please also filter by `user_id`, otherwise any user can read anyone's
> item. Add a test with two users."

Then hand the comments back: `gh pr view 21 --comments` in that agent's session and ask it to address them. Merge
when it's right, then clean up:

```bash
git worktree remove ../main-app-issue-21
git branch -d fix/issue-21
```

Paste your 3 comments for task 3.

## Quiz

1. Two issues both change `api/items.ts`. Parallel or one after another?
2. The task is "figure out why sign-up is slow". Two agents or one?
3. One task adds a database migration, the other changes the same table's code. Parallel?
4. What's the difference between a worktree and a subagent?

> **Answers:**
>
> 1. One after another. Same file = merge conflicts and each agent working from stale code.
> 2. One. Investigation needs one coherent picture; split later once you know the fix. (A subagent searching code is fine.)
> 3. No. Schema changes ripple everywhere; land the migration first, then the rest.
> 4. A worktree is a separate folder and branch for a separate task; a subagent is a helper one agent spawns inside its own task with a fresh context.

## You're done when…

- [ ] You can explain worktree vs branch vs subagent with the desk analogy.
- [ ] Two agents ran in parallel in two worktrees; two PR links pasted.
- [ ] One PR reviewed with 3 specific comments, addressed and merged. Comments pasted.
- [ ] Quiz done; worktrees cleaned up.

Tomorrow: MCP, the plug that lets your agent (and anyone's) talk to your app directly.
