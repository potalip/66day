---
day: 37
track: apps
phase: 3
title: "Feedback loops: users → issues → fixes"
summary: "A feedback button files GitHub issues straight from your app, and you ship three real fixes as agent-made pull requests."
estMinutes: 90
resources:
  - "https://docs.github.com/en/issues"
  - "https://cli.github.com/manual/"
  - "https://docs.anthropic.com/en/docs/claude-code/overview"
tasks:
  - id: d37-apps-t1
    type: read
    title: "Learn to triage feedback like a product person"
    xp: 10
    proof: none
  - id: d37-apps-t2
    type: build
    title: "Add a feedback button that creates a GitHub issue or Telegram message"
    xp: 30
    proof: link
  - id: d37-apps-t3
    type: build
    title: "Fix 3 real feedback items, one PR each"
    xp: 50
    proof: link
  - id: d37-apps-t4
    type: reflect
    title: "Write down which feedback surprised you"
    xp: 15
    proof: text
---

Users tell you things in random places: a DM, a comment under yesterday's post, a sigh while you watch them use the
app. Most of it is lost by Friday. Today you build a pipe: feedback goes in at one end, a tracked GitHub issue comes
out the other, and an agent turns issues into pull requests that you review and merge.

## Triage like a product person

**Triage** means sorting incoming items by what to do with them, like a nurse in an emergency room. For each piece
of feedback, ask:

1. **What type is it?** `bug` (something broken), `ux` (works, but confusing), `idea` (new feature), `question`
   (maybe your copy is unclear, which is a `ux` in disguise).
2. **How many people does it hit, and how badly?** A bug in sign-up beats a typo on the FAQ.
3. **How big is the fix?** Small, medium, large.

Fix **high-impact + small** first. Park big ideas in a `later` label without guilt. And listen for the problem, not
the proposed solution: "add a dark mode toggle" might really mean "the white screen hurts at night", and if your app
already follows the system theme, the real fix is making that discoverable.

A good issue has: what happened, what they expected, steps or a screenshot, the page/URL, and who reported it (no
private data in public repos).

## Step by step

### 1. Feedback button → issue (30 min)

The safe shape: the browser sends feedback to **your** server; your server creates the issue with a token that
never leaves the server. Create a **fine-grained personal access token** on GitHub limited to your app's repo with
Issues: read and write permission only, and store it as a secret (`GITHUB_TOKEN_ISSUES`).

```text
Goal: an in-app feedback button that creates a GitHub issue.
Context: our app (React + Vite front end, API on Cloudflare Workers + D1). Repo is <owner/repo>. Token in env GITHUB_TOKEN_ISSUES.
Constraints:
- A small "Feedback" button on every page opens a dialog: type (bug / confusing / idea), message (10–1000 chars).
  No screenshots in v1 (the GitHub API can't attach images to issues easily); the page URL is enough.
- POST /api/feedback validates input, rate-limits (3 per user per hour), and creates an issue via the GitHub REST
  API with a clear title, the message, page URL, app version, browser, and label "feedback" + the type.
- Never include emails or names in the public issue; store reporter id in our DB, linked to the issue number.
- Fallback if no token: send the feedback to my Telegram chat (day 31 helper). If that's missing too, store it in the DB.
- Accessible dialog: focus trapped, closes on Escape, works at 390px, both themes.
Done when: I submit feedback in the live app and see the issue on GitHub with the right labels.
```

Submit one real piece of feedback yourself. Paste the issue link for task 2.

> **Security:** if your repo is public, anything in an issue is public. Keep a private repo, or keep the user's text but
> strip anything that looks like an email or phone number before posting.

### 2. Collect and triage (15 min)

Ask your 3 users (and anyone from yesterday's post) to send feedback through the button today. Add the things you
noted while watching them. Then, in the GitHub Issues tab, label each one, and pick **3 high-impact, small** issues.

You can also let the agent help you sort:

```bash
gh issue list --label feedback --limit 30
```

```text
Here are our open feedback issues (pasted above). Group duplicates, suggest a type and impact/effort for each,
and propose the 3 best to fix today. Explain each pick in one line. Don't change any code.
```

### 3. Three fixes, three PRs (35 min)

One issue = one branch = one pull request. That keeps every change small and reviewable.

```bash
git switch -c fix/issue-12
```

```text
Goal: fix GitHub issue #12. Read it with: gh issue view 12
Constraints: change only what this issue needs; add or update a test that fails before your fix and passes after;
run npm test and npm run build. Then commit, push the branch and open a PR with gh pr create.
The PR description says what changed, how to test it, and includes "Fixes #12".
Done when: the PR is open and CI is green.
```

Review each PR before merging: read the diff in GitHub's **Files changed** tab, pull the branch and try it, check CI.
If the agent touched unrelated files, ask it to revert them. Merge, and watch `Fixes #12` close the issue automatically.
Repeat for the other two. Paste the link to one merged PR (or all three) for task 3.

> **If you're stuck:** `gh` says you're not logged in? Run `gh auth login`. The agent "fixed" it but the bug is still
> there? Reply in the same session with exactly what you see and a screenshot; don't start a new chat that lost the context.

> **Tip:** Claude Code can also run inside GitHub Actions and answer `@claude` in issue comments (run
> `/install-github-app` in Claude Code to set it up). Handy later; today, do it locally so you see every step.

### 4. Reflect (10 min)

Write 3–5 sentences: which feedback surprised you, what users struggled with that you never noticed, and what you'll
tell them now that it's fixed (yes, tell them: "you asked, it's done" is the best retention trick there is).

## You're done when…

- [ ] You can explain triage and the "high impact, small effort first" rule.
- [ ] The feedback button creates a labelled GitHub issue (or Telegram message). Link pasted.
- [ ] 3 real feedback items fixed, one PR each, with tests; merged PR link pasted.
- [ ] Reflection written, and the reporters were told.

Tomorrow: one agent at a time is slow. You'll run two in parallel without them stepping on each other.
