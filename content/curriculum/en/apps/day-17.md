---
day: 17
track: apps
phase: 2
title: "Data that survives a refresh"
summary: "Give your app a real database and a small API, deploy it, and watch your data survive a reload on any device."
estMinutes: 120
resources:
  - "https://developers.cloudflare.com/d1/"
  - "https://supabase.com/docs"
  - "https://www.sqlite.org/docs.html"
  - "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"
tasks:
  - id: d17-apps-t1
    type: read
    title: "Learn where data lives: memory, browser, database"
    xp: 10
    proof: none
  - id: d17-apps-t2
    type: build
    title: "Add a database and CRUD endpoints; paste the commit link"
    xp: 50
    proof: link
  - id: d17-apps-t3
    type: ship
    title: "Deploy with the database and prove data survives a reload"
    xp: 50
    proof: link
  - id: d17-apps-t4
    type: quiz
    title: "Pick the right storage for each job"
    xp: 15
    proof: none
---

Right now your app forgets everything the moment you hit refresh. That's fine for a mock-up and fatal for a product:
nobody tracks job applications in a tool with amnesia. Today the sample data file goes away and a real database takes
its place — locally first, then live.

## Where data lives

- **Memory** (React state): instant, gone on refresh. Good for "what's typed in this box right now".
- **Browser storage** (`localStorage`): survives refresh, but lives in *one* browser on *one* device. Open the app on
  your phone and it's empty. Good for preferences like the theme.
- **Database on a server**: survives everything, the same from any device, can be shared and backed up. That's where
  your app's real records belong.

Your frontend never talks to the database directly. It talks to your **API** — the backend you already know from day
11 — and the API talks to the database. The four basic operations have a name, **CRUD**: Create, Read, Update, Delete.
In HTTP they usually map to `POST`, `GET`, `PATCH`, `DELETE` on paths like `/api/jobs` and `/api/jobs/42`.

A **migration** is a small SQL file that changes the database structure ("create table jobs"). Migrations live in
git, so your laptop and the live database always have the same shape.

**Two good paths** (pick one and stay on it until day 27):

- **Cloudflare D1** — SQLite in the cloud, sits next to the Worker you used on day 11. Free tier is generous; local
  dev uses a real local SQLite file. Recommended.
- **Supabase** — hosted Postgres with a dashboard, pairs well with Vercel, and gives you auth later (day 24).

## Step by step

### 1. Database + CRUD API (50 min)

```text
Goal: replace src/sampleData.ts with a real database and a CRUD API.

Context: our app is described in docs/SPEC.md (see the Data section). Frontend is Vite + React + TS.
Use Cloudflare Workers + D1 (one Worker serves the built frontend and the API under /api; use the current
Cloudflare Vite plugin setup from the docs). Hono for routing is fine.

Constraints:
- Schema as a migration in migrations/0001_init.sql. Every table gets id, created_at, updated_at.
- Endpoints: GET /api/<items>, POST /api/<items>, PATCH /api/<items>/:id, DELETE /api/<items>/:id.
- Validate input on the server (required fields, max lengths) and return clear 400 errors as JSON.
- Use parameterised queries only (never build SQL by gluing strings).
- Frontend shows loading and error states, and the empty state from yesterday when there are no rows.
- Add an "npm run db:migrate:local" script.

First explain the plan: the schema (show the SQL), the endpoints, and which files you'll touch. Wait for my OK.
When done: apply the migration locally, start the app, and prove it with curl — create one item, list, update it, delete it — and show me each response. Then tell me what I should click in the browser to test it myself.
```

Do the browser test: add two items, refresh, they're still there. Commit and push, then paste the link to the commit
on GitHub (click the commit message on the repo page to get it).

> **Tip (Supabase path):** same prompt, but replace the second paragraph with "Use Supabase Postgres via the official
> JS client; create the table with an SQL migration file; keep the service key on the server only." Check the current
> Supabase docs for the recommended setup.

### 2. Deploy with the database (40 min)

The live database is a separate, empty copy. You create it, apply the same migration to it, and deploy:

```bash
npx wrangler d1 create jobs-db              # once; prints the binding config to add
npx wrangler d1 migrations apply jobs-db --remote
npm run build && npx wrangler deploy   # with the Vite plugin, build first
```

Ask the agent to do it with you:

```text
Goal: deploy the app with a remote D1 database.
Before running anything, list the exact commands and config changes, and wait for my OK.
After deploying: run curl against the live URL to create and list one item, and show me the output.
Then tell me how to delete that test item.
```

Now the real proof: add an item on your laptop, then open the live link on your phone. It's there. Refresh. Still
there. That's a product.

> **If you're stuck:** "no such table" on the live site means the migration was applied locally but not with
> `--remote`. A 500 error with no detail? Run `npx wrangler tail` in a second terminal, reproduce the error, and paste
> the log to the agent with "explain the cause before fixing".

> **Safety:** your API is now public. Anyone with the URL can add items. That's acceptable for today; on day 24 each
> user will only see their own data. Don't store anything sensitive until then.

## Quiz

Which storage fits each job: memory, `localStorage`, database, or none of these?

1. The text someone is typing into the "notes" field before they press Save.
2. Whether the user prefers dark mode.
3. The list of job applications the user wants on both phone and laptop.
4. Your AI provider's API key.

> **Answers:**
>
> 1. Memory (component state). It's temporary until Save.
> 2. `localStorage` is fine — it's a per-device preference. (Later you could store it per user in the database.)
> 3. Database. It must survive refresh and be the same on every device.
> 4. None of these: it's a **secret** on the server (`wrangler secret put` / your host's environment variables). Never in
>    the browser, never in the database, never in git.

## You're done when…

- [ ] You can explain memory vs browser vs database in one sentence each.
- [ ] Your CRUD endpoints work with curl and from the UI — you pasted the commit link.
- [ ] The live app keeps data across reloads and devices — you pasted the live link.
- [ ] You answered the storage quiz.

**Tomorrow:** AI stops being a chat box and becomes a feature: messy text in, clean fields out.
