---
day: 24
track: apps
phase: 2
title: "Users and logins: your data is yours"
summary: "Add sign-in through a proven provider, make every record belong to someone, and prove that two users can't see each other."
estMinutes: 120
resources:
  - "https://supabase.com/docs"
  - "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"
  - "https://owasp.org/www-project-top-10-for-large-language-model-applications/"
tasks:
  - id: d24-apps-t1
    type: read
    title: "Learn sessions, cookies, OAuth and magic links"
    xp: 10
    proof: none
  - id: d24-apps-t2
    type: build
    title: "Add sign-in so each user sees only their own data; paste the commit link"
    xp: 60
    proof: link
  - id: d24-apps-t3
    type: build
    title: "Run the two-account test and report what leaked (it should be nothing)"
    xp: 30
    proof: text
  - id: d24-apps-t4
    type: quiz
    title: "Tell authentication from authorization"
    xp: 15
    proof: none
---

Right now anyone with your link sees everyone's job applications, and anyone can burn your AI budget. Before real
users arrive on day 27 that has to end. Today you add sign-in — and, more importantly, you make sure that once
someone is signed in, they can only ever touch their own data. You'll attack your own app to prove it.

## Sessions, cookies, OAuth, magic links

- **Authentication** answers "who are you?" — signing in.
- **Authorization** answers "what are you allowed to do?" — "this job belongs to user 42, and you're user 17, so no".
  Most real-world data leaks are authorization bugs, not broken passwords.
- A **session** is the server remembering "this browser is user 42" after sign-in. It's usually stored in a **cookie**
  — a small value the browser sends with every request. Good session cookies are `HttpOnly` (JavaScript can't read
  them), `Secure` (https only) and `SameSite` (not sent by other sites).
- **OAuth** is "Sign in with Google / GitHub / Apple": the provider confirms who the user is, so you never handle a
  password.
- A **magic link** is a one-time sign-in link sent by email. No password to forget or leak.

**Don't build auth yourself.** Use a proven library or service:

- **Supabase Auth** — if you're on Supabase, it's built in.
- **Clerk** — hosted, polished UI components, quick to add.
- **Better Auth** — open-source library you run inside your own backend; works with D1/SQLite (check its current docs
  for Cloudflare Workers).

Pick one that fits your stack; ask the agent to compare them for your project if unsure.

## Step by step

### 1. Sign-in and per-user data (60 min)

```text
Goal: add sign-in and make every record belong to a user.

Context: app in docs/SPEC.md; backend on Cloudflare Workers + D1 (or Supabase). Use <Better Auth | Clerk | Supabase Auth>
with <Google sign-in and/or email magic link>. Follow the provider's current docs for our stack.

Constraints:
- Migration: add user_id (NOT NULL) to every table with user data. Existing anonymous rows: assign them to my
  account after my first sign-in (give me a one-off script), then make user_id required.
- Every API route except auth routes requires a valid session; otherwise 401.
- The user id ALWAYS comes from the verified session on the server, NEVER from the request body, query or URL.
- Every query filters by user_id, including updates and deletes. Accessing someone else's record returns 404
  (don't reveal that it exists).
- The AI endpoints (/api/extract, /api/extract-media) require sign-in; the daily limits now count per user id.
- Session cookie: HttpOnly, Secure, SameSite=Lax. A visible "Sign out" in the UI.
- Signed-out visitors see a short landing with what the app does and a "Sign in" button.

Explain your plan first: provider choice and why, the migration SQL, which routes change, and the files you'll touch.
Wait for my OK. At the end, list every API route with "auth required: yes/no" and show me a curl call
without a cookie getting 401.
```

Set up the provider's keys as secrets (`wrangler secret put ...`), add your live URL to the provider's allowed
redirect URLs, deploy, and sign in on your phone. Commit, push, paste the commit link.

> **If you're stuck:** "redirect_uri mismatch" or a sign-in that loops back to the start almost always means the
> allowed callback URL in the provider's dashboard doesn't exactly match your app's URL (http vs https, trailing slash,
> localhost vs live). Paste the exact error and both URLs to the agent.

### 2. The two-account test (30 min)

Now try to break in. Use two separate browser profiles (or one normal and one private window) and two accounts.

1. As **A**, create a job. Open your browser's developer tools → Network, click the job, and note its id from the
   request URL (say `/api/jobs/37`).
2. As **B**, check the list: A's job must not be there.
3. As **B**, try to read, change and delete A's job directly. Copy B's cookie from developer tools (Application →
   Cookies) into a terminal variable — it's a password, so don't paste it anywhere else — and run:

```bash
curl -i https://<your-app>/api/jobs/37 -H "Cookie: $B_COOKIE"
curl -i -X PATCH https://<your-app>/api/jobs/37 -H "Cookie: $B_COOKIE" \
  -H "Content-Type: application/json" -d '{"title":"hacked"}'
curl -i -X DELETE https://<your-app>/api/jobs/37 -H "Cookie: $B_COOKIE"
```

4. Try creating a job as B with `"user_id"` of A in the body. It must be ignored.

Every call should return **404** (or 401/403), and A's job must be untouched. Report what you tried and what happened.
If anything leaked, that's a great find — give the agent the exact request and response:

```text
Security bug: user B can <read/change> user A's record. Request and response below.
Explain the root cause first, then fix it everywhere the same pattern appears, add a Vitest test that
reproduces it, and re-run my two-account test commands to prove it's fixed.
```

> **Safety:** a session cookie is as good as a password. Delete the terminal variable afterwards and never post
> cookies in screenshots or chats.

## Quiz: authentication or authorization?

1. A user types the wrong password.
2. User B opens `/api/jobs/37`, which belongs to user A.
3. Your session cookie expired overnight.
4. Only the app owner may see the page with all users' sign-up dates.

<details><summary>Answers</summary>

1. Authentication — the app can't confirm who they are.
2. Authorization — B is known, but not allowed to see this record. Answer 404.
3. Authentication — the server no longer knows who you are; sign in again.
4. Authorization — a role check ("is this user the owner?") on every request to that page.

</details>

## You're done when…

- [ ] You can explain session, cookie, OAuth and magic link, and the difference between authn and authz.
- [ ] Sign-in works live and each user sees only their own data — you pasted the commit link.
- [ ] The two-account test passed (or you found and fixed a leak) — you reported what you tried.
- [ ] You answered the quiz.

**Tomorrow:** your app reads documents and answers with citations.
