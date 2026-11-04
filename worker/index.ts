import { Hono } from "hono";
import type { AppEnv, Env, JobMessage } from "./env";
import { anonUser } from "./lib/user";
import { portfolioMeta } from "./lib/learn/portfolio";
import { handleQueue } from "./queue";
import { curriculum } from "./routes/curriculum";
import { progress } from "./routes/progress";
import { game } from "./routes/game";
import { library } from "./routes/library";
import { pipeline } from "./routes/pipeline";
import { admin } from "./routes/admin";
import { studio } from "./routes/studio";

const app = new Hono<AppEnv>().basePath("/api");

app.get("/health", (c) => c.json({ ok: true, env: c.env.APP_ENV }));
// Server-to-server callbacks carry their own bearer auth and must not mint anonymous users.
const NO_USER = [/^\/api\/studio\/render-callback$/, /^\/api\/studio\/s\//, /^\/api\/pipeline\/media-worker\//];
app.use("*", (c, next) => (NO_USER.some((r) => r.test(c.req.path)) ? next() : anonUser(c, next)));
app.get("/me", async (c) => {
  const u = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(c.get("userId")).first();
  return c.json(u);
});
app.patch("/me", async (c) => {
  const body = await c.req.json<{ lang?: "ru" | "en"; track?: "apps" | "video"; display_name?: string; timezone?: string }>();
  const id = c.get("userId");
  if (body.lang) await c.env.DB.prepare("UPDATE users SET lang = ? WHERE id = ?").bind(body.lang, id).run();
  if (body.track) await c.env.DB.prepare("UPDATE users SET track = ?, started_at = COALESCE(started_at, unixepoch()) WHERE id = ?").bind(body.track, id).run();
  if (body.timezone) {
    try { new Intl.DateTimeFormat("en", { timeZone: body.timezone }); await c.env.DB.prepare("UPDATE users SET timezone = ? WHERE id = ?").bind(body.timezone, id).run(); } catch { /* invalid tz: ignore */ }
  }
  if (body.display_name) await c.env.DB.prepare("UPDATE users SET display_name = ? WHERE id = ?").bind(body.display_name.slice(0, 40), id).run();
  return c.json(await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first());
});

app.route("/curriculum", curriculum);
app.route("/progress", progress);
app.route("/game", game);
app.route("/library", library);
app.route("/pipeline", pipeline);
app.route("/admin", admin);
app.route("/studio", studio);

/**
 * Public portfolio pages: serve the SPA shell but inject per-student <title>/description/OG tags server-side,
 * so links shared in Telegram/X/LinkedIn preview nicely (crawlers don't run JS).
 */
const escAttr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function portfolioPage(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const m = url.pathname.match(/^\/(ru|en)\/portfolio\/([^/]+)\/?$/);
  const shell = await env.ASSETS.fetch(new Request(new URL("/", url), req));
  if (!m) return shell;
  let meta: { title: string; description: string } | null = null;
  try { meta = await portfolioMeta(env, decodeURIComponent(m[2]), m[1] as "ru" | "en"); } catch (e) { console.error("portfolioMeta", e); }
  if (!meta) return shell;
  const { title, description } = meta;
  const setContent = (content: string) => ({ element(el: Element) { el.setAttribute("content", content); } });
  return new HTMLRewriter()
    .on("html", { element(el) { el.setAttribute("lang", m[1]); } })
    .on("title", { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', setContent(description))
    .on('meta[property="og:title"]', setContent(title))
    .on('meta[property="og:description"]', setContent(description))
    .on("head", { element(el) { el.append(`<meta property="og:url" content="${escAttr(url.origin + url.pathname)}" />`, { html: true }); } })
    .transform(shell);
}

export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext) =>
    new URL(req.url).pathname.startsWith("/api/") ? app.fetch(req, env, ctx) : portfolioPage(req, env),
  queue: (batch: MessageBatch<JobMessage>, env: Env) => handleQueue(batch, env),
} satisfies ExportedHandler<Env, JobMessage>;
