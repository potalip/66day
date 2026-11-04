import type { MiddlewareHandler } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "../env";

/**
 * TEMPORARY identity until Cloudflare-based auth (Google/Telegram/Apple/email) lands.
 * Each browser gets an anonymous user id cookie; a row is created in `users`.
 * Everything else must only use c.get("userId") so swapping auth later is one file.
 */
export const anonUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  let id = getCookie(c, "fl_uid");
  if (!id) {
    id = crypto.randomUUID();
    setCookie(c, "fl_uid", id, { path: "/", httpOnly: true, sameSite: "Lax", secure: true, maxAge: 60 * 60 * 24 * 365 });
  }
  await c.env.DB.prepare("INSERT OR IGNORE INTO users (id) VALUES (?)").bind(id).run();
  c.set("userId", id);
  await next();
};

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = c.req.header("x-admin-token") ?? getCookie(c, "fl_admin");
  if (!c.env.ADMIN_TOKEN || token !== c.env.ADMIN_TOKEN) return c.json({ error: "forbidden" }, 403);
  await next();
};
