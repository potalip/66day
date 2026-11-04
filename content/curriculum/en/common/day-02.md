---
day: 2
track: common
phase: 1
title: "Ship it: your page goes live"
summary: "Put your promise page on GitHub and turn on GitHub Pages — by tonight it has a real URL you can send anyone."
estMinutes: 90
badges: [first-ship]
resources:
  - "https://docs.github.com/en/pages/getting-started-with-github-pages"
  - "https://docs.github.com/en/get-started/start-your-journey/hello-world"
tasks:
  - id: d02-t1
    type: read
    title: "See how a page travels from a folder to a URL"
    xp: 10
    proof: none
  - id: d02-t2
    type: build
    title: "Create a GitHub repo and push your page with the agent's help"
    xp: 30
    proof: link
  - id: d02-t3
    type: ship
    title: "Turn on GitHub Pages and open your live URL"
    xp: 60
    proof: link
  - id: d02-t4
    type: share
    title: "Send the link to one person and write down what they said"
    xp: 20
    proof: text
---

Yesterday's page lives in one folder on one laptop. Today it gets an address on the internet. Most people who "want
to learn to code" never ship anything; by the end of today you'll have shipped on day two.

## From a folder to a URL

Three pieces, one analogy:

- **Git** is a save-game system for your folder. Every **commit** is a named save point you can return to.
- **GitHub** is a shelf in the cloud where your saves live. A folder tracked by git is a **repository** (repo);
  sending your commits to GitHub is a **push**.
- **GitHub Pages** is a free shop window: point it at a repo with an `index.html`, and GitHub serves it at
  `https://<your-username>.github.io/<repo-name>/`.

Your agent will type the git commands. Your job is to understand what each step is for, and to check the result.

## Step 1 — A GitHub account (10 min)

Sign up at github.com. Pick your username carefully: it ends up in every link you share, so `mira-builds` beats
`xXcoder2009Xx`. GitHub asks you to turn on two-factor authentication — do it, an authenticator app is easiest.

## Step 2 — Tools: git and the GitHub CLI (10 min)

Check whether git is already there: `git --version`. Then install whatever is missing. `gh` is GitHub's command-line
tool; it handles logging in so you never paste passwords into the terminal.

```bash
# macOS: install Homebrew, the standard Mac package manager (it brings git along),
# run the "Next steps" lines it prints at the end, then install gh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install gh

# Windows
winget install --id Git.Git -e
winget install --id GitHub.cli -e

# Ubuntu / Debian
sudo apt update
sudo apt install git gh
```

On Linux, if apt says it can't find `gh`, follow the Linux instructions at cli.github.com. Reopen the terminal, then log in and introduce yourself to git:

```bash
gh auth login
git config --global user.name "Mira Santos"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

The last line makes new projects start on a branch called `main` (some git versions still default to `master`).
For `gh auth login` choose GitHub.com → HTTPS → "Login with a web browser". For the email, GitHub's private
`…@users.noreply.github.com` address (Settings → Emails) keeps your real one out of public history.

## Step 3 — Push with the agent (15 min)

Go to your project folder and start the agent, then paste the prompt below:

```bash
cd ~/66-day-promise
claude
```

```text
Goal: put this folder on GitHub as a public repository called 66-day-promise.

Context: I'm a beginner. git and the GitHub CLI (gh) are installed and I'm logged in with gh. The folder contains my index.html page.

Constraints: explain each command in one plain sentence before you run it. Make one first commit with a clear message. Don't add any files except a short README.md that says what this page is.

Done when: the repo exists on GitHub, the commit is pushed, and you've printed the repo URL.
```

Open the URL it prints. You should see `index.html` and `README.md` on GitHub.

**Proof:** paste the repo link, e.g. `https://github.com/mira-builds/66-day-promise`.

## Step 4 — Turn on Pages (10 min)

On the repo page: **Settings → Pages**. Under *Build and deployment*, set Source to **Deploy from a branch**,
branch **main** (if you only see `master`, pick that), folder **/ (root)**, then **Save**. Wait a minute or two and refresh: a box appears with your
live URL. Open it on your phone, too — that's the real test.

> **If you're stuck:** a 404 page usually means "not yet" — wait two minutes. Still 404? Check that the file is
> called exactly `index.html` (lowercase) and sits at the top of the repo, not in a subfolder. The *Actions* tab
> shows each deploy; a red one has a log you can paste to your agent with "what went wrong?".

> **Safety:** a public repo and a Pages site are visible to everyone. Keep phone numbers, home addresses and
> anything you'd regret off the page. Same rule forever: passwords and API keys never go into a repo.

**Proof:** paste your live link, e.g. `https://mira-builds.github.io/66-day-promise/`.

## Step 5 — Show one human (10 min)

Send the link to one person — a friend, a sibling, a colleague. Not "what do you think?", which gets you "nice!".
Try: "I'm starting a 66-day challenge to learn to build with AI. This is day 2. What's the first thing you notice?"
Write down what they said, word for word if you can.

## You're done when…

- [ ] You can explain commit, push and Pages in one sentence each.
- [ ] You pasted your repo link.
- [ ] You pasted your live GitHub Pages link and opened it on your phone.
- [ ] You sent it to one person and wrote down their reaction.

**Tomorrow:** the terminal stops being scary, and your computer gets the three tools the rest of the program runs on.
