---
day: 29
track: apps
phase: 2
title: "Tests your agent writes (and you actually trust)"
summary: "Your agent writes tests for the logic that matters, and GitHub runs them on every push. Green check or it didn't happen."
estMinutes: 90
resources:
  - "https://vitest.dev/"
  - "https://playwright.dev/"
  - "https://docs.github.com/en/actions"
tasks:
  - id: d29-apps-t1
    type: read
    title: "Learn what to test when an agent writes the code"
    xp: 10
    proof: none
  - id: d29-apps-t2
    type: build
    title: "Get the agent to write passing tests for your core logic"
    xp: 50
    proof: link
  - id: d29-apps-t3
    type: build
    title: "Set up CI on GitHub Actions and get a green run"
    xp: 40
    proof: link
  - id: d29-apps-t4
    type: quiz
    title: "Spot the good test and the useless one"
    xp: 15
    proof: none
---

Your app has three real users now. That changes everything: from today, a bug isn't your problem, it's *their* problem.
And your agent changes dozens of lines per request, so "I clicked around and it seemed fine" doesn't scale anymore.
You already have a few Vitest tests from days 18, 24 and 26 (the schema, the fallback parser, the two-account leak,
the confirm step). Today you check that they can actually fail, add the ones that are missing, and get a safety net
that runs by itself on every push.

## What a test actually is

A test is a tiny program that calls your code with a known input and checks the output. If someone (you, the agent,
future-you at 1 a.m.) breaks that behaviour, the test turns red before users notice.

The trap with agents: they happily write **tests that test nothing**. A test that mocks the function it's testing, or
asserts `expect(result).toBeDefined()`, will pass forever and protect you from nothing. Your job isn't to write tests,
it's to **choose what gets tested and check that each test can fail**.

Test these, in this order:

1. **Pure logic with rules**: price calculations, date math, limits, permissions ("can user A edit item B?").
2. **Parsers and validators**: the day-18 code that turns AI output into validated JSON. Feed it garbage on purpose.
3. **One happy path end to end**: a Playwright test that opens the app, does the main thing, sees the result.

Skip: styling, third-party libraries, and the AI model's exact wording (it changes every run, so test the *shape*, not the words).

> **Tip:** the best single trick: after a test passes, break the code on purpose (flip a `>` to `<`). If the test stays
> green, it's useless. This is called mutation testing, and you just did it by hand.

## Step by step

### 1. Pick three things worth protecting (5 min)

Open your app's code with the agent and ask what's risky:

```text
Goal: find the 3–5 functions in this repo most worth unit-testing.
Context: this is my main app (React + Vite front end, API on Cloudflare Workers + D1, AI feature with structured output). Some Vitest tests already exist; list them first and say which ones could never fail.
Constraints: prefer pure functions with business rules, validation and parsing. Ignore UI styling.
Done when: you list each function with file path, why a bug there would hurt users, and 2–3 cases to test (including one edge case and one invalid input). Don't write any code yet.
```

Read the list. Cross out anything that's really testing a library. Keep three.

### 2. Let the agent write the tests (30 min)

Your app is TypeScript, so it's **Vitest** (it shares config with Vite). If you built the bot in Python with aiogram,
its tests use **pytest**.

```text
Goal: add unit tests for the 3 functions we agreed on.
Context: Vitest, already set up in this Vite project (pytest only for a Python bot).
Constraints:
- No mocking of the function under test. Mock only network and the AI API.
- Each test name says the rule in plain words, e.g. "rejects a deadline that is before the posting date".
- At least one edge case and one invalid input per function.
- Add an "npm test" script that runs once and exits (vitest run), not watch mode.
Done when: npm test passes locally and you show me the output.
```

Then run it yourself:

```bash
npm test
# Python version:
pytest -q
```

Now do the mutation trick: ask the agent to break one rule temporarily, run `npm test`, and confirm it goes red. Undo.
Commit and push, then copy the commit link from GitHub. That's your proof for task 2.

> **If you're stuck:** "Cannot find module" or ESM errors usually mean the test config doesn't match the project's.
> Paste the full error to the agent with "fix the test setup, don't change app code". If a function is impossible to
> test because it reads the database directly, ask the agent to pull the rule into a pure function first. That's not
> extra work, that's the test improving your design.

### 3. One end-to-end smoke test (optional but recommended, 15 min)

```text
Goal: add one Playwright test that starts the dev server, opens the main page, performs the core action (e.g. create an item) and checks it appears.
Constraints: use the AI fallback/fixture, never the real AI API, in tests. Keep it under 40 lines.
Done when: npx playwright test passes locally.
```

### 4. CI on GitHub Actions (25 min)

**CI** (continuous integration) = a fresh computer at GitHub that installs your project and runs your tests on every
push and pull request. It catches "works on my machine".

```text
Goal: add a GitHub Actions workflow at .github/workflows/ci.yml.
Context: Node project with npm test (and npm run build). Optional Playwright test.
Constraints: run on push and pull_request; use the current major versions of actions/checkout and actions/setup-node with Node 22 and npm caching; run npm ci, npm test, npm run build.
No secrets needed: tests must use fixtures, not real API keys.
Done when: the workflow file is committed and you explain each step in one line.
```

It will look roughly like this (the agent may pick newer major versions of the actions; that's fine):

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
```

Push, open the **Actions** tab on GitHub, and watch it run. Green check? Open the run and copy its URL, that's
task 3's proof. Red? Click the failed step, copy the log, give it to the agent.

> **Security, for later:** if CI needs an env variable, add it under **Settings → Secrets and variables → Actions**, never
> in the YAML. Today you shouldn't need any.

## Quiz

1. A test mocks `calculateTotal` and asserts the mock returned 42. Useful?
2. Your AI summary feature returns different wording every run. What do you assert?
3. A test passed. How do you know it can ever fail?
4. CI is green but the live app is broken. Name one likely reason.

> **Answers:**
>
> 1. Useless. It tests the mock, not your code.
> 2. The shape: required fields exist, types are right, lengths are within limits, and the fallback kicks in on bad output.
> 3. Break the code on purpose and watch it go red.
> 4. Tests don't cover that path, or production config/secrets differ from CI. Add a test for exactly what broke.

## You're done when…

- [ ] You can explain why a test that can't fail is worse than no test.
- [ ] 3+ meaningful tests pass with `npm test` (or `pytest`), and one was broken on purpose and went red. Commit link pasted.
- [ ] `.github/workflows/ci.yml` runs on push and you pasted the link to a green run.
- [ ] Quiz done.

Tomorrow: you build the kind of tool that small teams pay for first, a dashboard over their own spreadsheet.
