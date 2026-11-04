---
day: 39
track: apps
phase: 3
title: "MCP: plug your agent into anything"
summary: "Connect an existing MCP server to your agent, then build a tiny one with 2 tools so any AI assistant can work with your app."
estMinutes: 120
resources:
  - "https://modelcontextprotocol.io/"
  - "https://github.com/modelcontextprotocol/typescript-sdk"
  - "https://github.com/modelcontextprotocol/python-sdk"
  - "https://docs.anthropic.com/en/docs/build-with-claude/tool-use"
tasks:
  - id: d39-apps-t1
    type: read
    title: "See what MCP is, in one picture"
    xp: 10
    proof: none
  - id: d39-apps-t2
    type: build
    title: "Connect an existing MCP server and put it to work"
    xp: 30
    proof: text
  - id: d39-apps-t3
    type: build
    title: "Build a tiny MCP server with 2 tools for your app"
    xp: 60
    proof: link
  - id: d39-apps-t4
    type: quiz
    title: "Tell tools, resources and prompts apart"
    xp: 15
    proof: none
---

On day 26 you gave the AI *inside* your app two tools. Today you flip it around: you give AI assistants *outside* your
app (Claude Code, Claude Desktop, other MCP-capable tools) a way to use it. Ask your agent "what did I add this
week?" and it simply checks. That's MCP, and once you've built one server, you'll see plugs everywhere.

## MCP in one picture

```
 [ AI app / agent ]  ── host, e.g. Claude Code
        │  MCP client (built in)
        │  speaks MCP (JSON-RPC messages)
        ▼
 [ MCP server ]      ── small program YOU or others write
        │  normal code: HTTP calls, SQL, files
        ▼
 [ your app's API / database / any service ]
```

**MCP (Model Context Protocol)** is an open standard for connecting AI applications to tools and data. Think USB-C:
before it, every AI app needed a custom cable for every service; now a service ships one MCP server and any MCP-capable
app can plug in.

A server can offer three things:

- **Tools**: actions the model can call, with a name, a description and an input schema. "create_item", "search_orders".
  Same idea as day 26's tool use.
- **Resources**: read-only data the app can load as context, addressed by a URI. "the README", "today's report".
- **Prompts**: reusable prompt templates the user can pick, like a slash command. "/weekly-summary".

Servers run either **locally** (the host starts them as a process and talks over stdin/stdout, called "stdio") or
**remotely** over HTTP. Today: local, the simplest.

## Step by step

### 1. Use an existing server (25 min)

Start with one that's immediately useful: **Playwright MCP**, which lets your agent drive a real browser. In Claude Code:

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
claude mcp list
```

(Other agents have a similar config, usually a JSON file listing servers. Check your agent's docs for "MCP".)
Restart the agent and give it a real job:

```text
Use the Playwright MCP tools to open my landing page at <URL> at 390px wide. Click the main call-to-action, go through sign-up with a test account, and report anything broken or confusing. Take a screenshot of each step.
```

Watch it ask permission for each tool call; that's the host protecting you. Paste for task 2: which server you
connected, what you asked, and what it found.

> **Security:** an MCP server runs with your permissions. Install only servers from sources you trust (official
> repos, well-known companies), read what tools they expose, and never paste tokens into a config you'll commit.

### 2. Build your own: 2 tools (60 min)

Put your server in an `mcp/` folder of your repo (`main-app/mcp/`, next to `bot/`). It talks to **your app's API** with a
personal token, so it respects the same auth and limits as the app does.

Choose two tools: one **read** and one **write**. For example `list_recent_items` and `add_item`.

```text
Goal: a tiny MCP server for my app, in TypeScript, using the official MCP TypeScript SDK (@modelcontextprotocol/sdk) and zod for input schemas. Use stdio transport. Check the SDK README for current package names, import paths and
APIs (they change between major versions).
Context: my app's API is at APP_URL with endpoints <list them>; auth with an API token in env APP_TOKEN.
Add a POST /api/tokens endpoint to the app that lets a signed-in user create a personal token (store only a hash), and let the API accept "Authorization: Bearer <token>" as an alternative to the session cookie, mapped to that user.
Tools:
1. list_recent_items: input { limit: integer 1–50, default 10 }; returns a short readable list.
2. add_item: input { title: string 1–200 chars, note?: string }; creates an item via the API; returns its id and link.
Constraints:
- Clear tool descriptions written for a model: when to use it, what it returns.
- Validate inputs; turn API errors into readable tool errors (isError), never crash.
- Never write logs to stdout (it carries the protocol); use stderr.
- README: how to build, how to add it to Claude Code, which env vars it needs.
Done when: it works in the MCP Inspector and in Claude Code.
```

Prefer Python? Ask for the same thing with the official Python SDK's `FastMCP` and `@mcp.tool()` decorators.

Test it in the **MCP Inspector**, a small web UI for poking servers:

```bash
npm run build
npx @modelcontextprotocol/inspector node build/index.js
```

Call each tool by hand. Then connect it to your agent:

```bash
claude mcp add myapp -e APP_URL=https://your-app.example -e APP_TOKEN=your-token -- node /full/path/to/build/index.js
```

The token lands in your local Claude Code config, not in the repo. Don't add `--scope project` here: that writes
a `.mcp.json` meant to be committed. Now ask, in plain words: *"Add an item called 'Try MCP' and then show me my five latest items."* Watch the agent pick
your tools by their descriptions. Push the server and paste the repo link for task 3.

> **If you're stuck:** the agent doesn't see your tools? Run `claude mcp list` and check the status. Most failures are
> a relative path (use the absolute one), missing build step, or something printing to stdout. "Invalid JSON" errors
> mean exactly that last one. Find the stray `console.log` and switch it to `console.error`.

> **Tip:** treat `add_item` like any write tool: the token belongs to one user, the API checks ownership, and the host
> asks before calling it. Everything from day 33 still applies.

## Quiz

1. "Search my orders by customer name": tool, resource or prompt?
2. "The app's changelog, available as context": tool, resource or prompt?
3. "A reusable /weekly-review template the user picks from a menu": which one?
4. Why should your MCP server call your app's API instead of the database directly?

> **Answers:**
>
> 1. Tool: an action with input that the model decides to call.
> 2. Resource: read-only data loaded as context.
> 3. Prompt: a user-chosen template.
> 4. The API already enforces auth, ownership, validation and rate limits. Going around it skips all your security.

## You're done when…

- [ ] You can draw host → client → server → service and name tools, resources and prompts.
- [ ] An existing MCP server did a real job for you. Described.
- [ ] Your own MCP server with 2 tools works in the Inspector and your agent. Repo link pasted.
- [ ] Quiz done.

Tomorrow: the slow stuff. Moving long AI tasks into background jobs, so nobody stares at a spinner.
