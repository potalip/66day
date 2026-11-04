---
day: 45
track: apps
phase: 3
title: "Ask your data, get real answers"
summary: "Write your first SQL on real usage data, build a 3-chart dashboard and a safe \"ask a question\" box powered by AI."
estMinutes: 90
resources:
  - "https://www.sqlite.org/docs.html"
  - "https://developers.cloudflare.com/d1/"
  - "https://owasp.org/www-project-top-10-for-large-language-model-applications/"
tasks:
  - id: d45-apps-t1
    type: read
    title: "Learn enough SQL in 15 minutes to read any dashboard query"
    xp: 10
    proof: none
  - id: d45-apps-t2
    type: build
    title: "Run 5 SQL queries on your app's usage and paste the best one with its result"
    xp: 40
    proof: text
  - id: d45-apps-t3
    type: build
    title: "Build a dashboard with 3 charts and a guarded \"ask a question\" box"
    xp: 50
    proof: file
  - id: d45-apps-t4
    type: quiz
    title: "Quiz: read this query"
    xp: 15
    proof: none
---

"How many people used it this week?" If your honest answer is "uh, some?", today fixes that. Your app has been
quietly writing rows since day 34: sign-ups, the `events` table, AI calls, payments. Today you learn to ask those rows questions —
first by hand in SQL, then with charts, then in plain English with an AI that is **not allowed to break anything**.

## SQL in 15 minutes

SQL reads almost like a sentence. Five words cover 90% of dashboards:

```sql
SELECT date(created_at) AS day, COUNT(DISTINCT user_id) AS active_users  -- what columns you want
FROM events                                                             -- which table
WHERE created_at >= date('now', '-14 days')                            -- which rows
GROUP BY day                                                            -- one row per day
ORDER BY day;                                                           -- sorted
```

- `COUNT(*)` counts rows; `COUNT(DISTINCT user_id)` counts people. A user with 30 clicks is still one person.
- `JOIN` glues two tables on a shared column: `FROM users u JOIN events e ON e.user_id = u.id`.
  A plain `JOIN` drops users with no events; `LEFT JOIN` keeps them (with empty event columns).
- `LIMIT 20` stops after 20 rows. Always use it while exploring.

## Step by step

### 1. Five questions, five queries (30 min)

Ask your agent to show you the schema first, then write queries **with** you, not for you:

```text
Show me the tables and columns of our database (from the migrations), in a short table.
Then help me write 5 SQL queries against our real data, one at a time, explaining each line in one sentence:
1. Sign-ups per day, last 14 days.
2. Daily active users (distinct user_id or anon_id in the events table from day 34), last 14 days.
3. The top 5 features or actions by usage.
4. Activation: what % of users with signup_completed also have core_action_done within 24 hours?
5. AI usage: calls and tokens per user this week (or the closest thing we log).
Run each read-only against the remote database and show me the result. Never run INSERT, UPDATE or DELETE.
```

On Cloudflare D1 the agent will run something like:

```bash
npx wrangler d1 execute <your-db> --remote --command "SELECT COUNT(*) FROM users;"
```

(On Supabase, use the SQL editor; on SQLite, `sqlite3 app.db`.) Pick the query whose answer surprised you most and
paste it with its result. One student building a tutoring-notes app discovered 60% of sign-ups never created a
single note — that one number rewrote her onboarding.

### 2. The dashboard (25 min)

```text
Goal: an admin-only page /admin/stats with 3 charts from our real data.
Charts: (1) daily active users, line, 30 days; (2) sign-ups per week, bars; (3) the activation % as a big number
with last week's value for comparison.
Constraints: only users with the admin role can open it or call its API (check on the server).
Use a small chart library (Chart.js or Recharts); colours from our design tokens; works in light and dark,
readable at 390px. Queries live in one file, server-side, each with a LIMIT.
Done when: the page renders with real numbers and a non-admin gets 403 from the API.
```

### 3. The "ask a question" box — with guard rails (25 min)

Natural-language-to-SQL is magic and dangerous: the model writes the query, your database runs it. Without
guards, one confused (or manipulated) answer is `DELETE FROM users`. So you stack defences, and each one alone
would stop the disaster:

1. **Read-only access.** On Postgres/Supabase, create a database role with `SELECT` only on a few analytics views.
   On a SQLite file, open the connection in read-only mode. D1 has no database users, so give the AI a **separate
   analytics database** with copies of the allowed tables, without emails or other personal data, refreshed by
   your background job from day 40. Worst case, it ruins a copy.
2. **One statement, SELECT only.** Parse the SQL with a real parser (e.g. `node-sql-parser`), not a regex. Reject
   anything that isn't a single `SELECT`/`WITH`, plus `PRAGMA` and `ATTACH`.
3. **Allow-listed tables.** The parser tells you which tables the query touches; reject any not on your list.
4. **Forced `LIMIT`** (say 200) and a timeout.
5. **Show the SQL** next to the answer so a human can sanity-check it.

```text
Goal: an "Ask a question" box on /admin/stats that turns a plain-English question into SQL and shows a table.
Flow: send the model ONLY the schema of allow-listed tables (no rows, no personal data) and the question;
ask for a single SQLite SELECT as structured output. Then on the server: parse with node-sql-parser,
reject anything that is not exactly one SELECT/WITH, reject tables outside ALLOWED_TABLES, reject PRAGMA/ATTACH,
append or cap LIMIT 200, run it against the read-only analytics database with a 5-second timeout.
Show the generated SQL above the result table. Log every question and query.
If ANTHROPIC_API_KEY is missing: show "AI not configured" and offer 5 preset questions with hand-written queries.
Tests: "how many users signed up last week" passes; "delete all users", "show me emails", and a two-statement
query are all rejected with a clear reason.
Done when: tests pass and a real question returns a real table.
```

Take one screenshot showing the 3 charts and one answered question with its SQL. That's your proof.

> **If you're stuck:** wrong dates are usually time zones or formats — SQLite stores dates as text, so make sure
> everything is ISO (`2026-11-04T10:15:00Z`) and compare with `date(...)`. If the AI's SQL keeps failing, give it
> 3 example question → query pairs in the prompt; few-shot examples beat long instructions.

## Quiz

```sql
SELECT u.plan, COUNT(DISTINCT e.user_id) AS active
FROM users u
JOIN events e ON e.user_id = u.id
WHERE e.created_at >= date('now', '-7 days')
GROUP BY u.plan
ORDER BY active DESC;
```

1. In one sentence, what does this return?
2. A user on the free plan clicked 40 times this week. How much do they add to `active`?
3. Would a plan with zero active users this week appear in the result?
4. The AI box generates `SELECT * FROM events; DROP TABLE events`. Which of your guards stop it?

<details><summary>Answers</summary>

1. For each plan, how many different users did anything in the last 7 days, biggest first.
2. Exactly 1 — `DISTINCT` counts people, not clicks.
3. No. The inner `JOIN` plus the `WHERE` on events removes users with no recent events; that plan simply vanishes.
   Showing zeros needs a `LEFT JOIN` with the date condition moved into `ON`.
4. Several: the single-statement check rejects it, and even if it slipped through, the read-only connection (or the
   analytics copy) can't drop the real table.

</details>

## You're done when…

- [ ] You can read `SELECT … FROM … WHERE … GROUP BY … ORDER BY` out loud as a sentence.
- [ ] You ran 5 queries on real data and pasted your favourite with its result.
- [ ] `/admin/stats` shows 3 charts, the AI box answers a question, dangerous queries are rejected; you uploaded a screenshot.
- [ ] You answered the quiz.

**Tomorrow:** your app learns to listen and talk back.
