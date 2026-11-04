import { Hono } from "hono";
import type { AppEnv, Env, JobMessage } from "./env";
import { anonUser } from "./lib/user";
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
const NO_USER = new Set(["/api/studio/render-callback", "/api/pipeline/media-worker/callback"]);
app.use("*", (c, next) => (NO_USER.has(c.req.path) ? next() : anonUser(c, next)));
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

export default {
  fetch: app.fetch,
  queue: (batch: MessageBatch<JobMessage>, env: Env) => handleQueue(batch, env),
} satisfies ExportedHandler<Env, JobMessage>;
