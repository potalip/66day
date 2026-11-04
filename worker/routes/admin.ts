import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { AppEnv } from "../env";
import { requireAdmin } from "../lib/user";
import { LANGS, type LibLang, lessonMaterialSchema, resourcePatchSchema } from "../lib/library/schema";
import {
  toResource, getResourceRow, getMaterials, getEvents, getTranscript, setMaterial, updateResource, logEvent,
} from "../lib/library/repo";
import { aiConfigured, uploadKey } from "../lib/library/pipeline";

// OWNER: library agent (docs/OWNERSHIP.md). Founder admin: session + review/edit/publish.
export const admin = new Hono<AppEnv>();

admin.get("/health", (c) => c.json({ ok: true, area: "admin" }));

/** GET /api/admin/session — { configured, authed } */
admin.get("/session", (c) => {
  const token = c.req.header("x-admin-token") ?? getCookie(c, "fl_admin");
  return c.json({ configured: !!c.env.ADMIN_TOKEN, authed: !!c.env.ADMIN_TOKEN && token === c.env.ADMIN_TOKEN, ai: aiConfigured(c.env) });
});

/** POST /api/admin/login { token } — stores the token in an httpOnly cookie. */
admin.post("/login", async (c) => {
  if (!c.env.ADMIN_TOKEN) return c.json({ error: "not_configured" }, 503);
  const { token } = await c.req.json<{ token?: string }>().catch(() => ({ token: "" }));
  if (!token || !timingSafeEqual(token, c.env.ADMIN_TOKEN)) return c.json({ error: "wrong_token" }, 401);
  setCookie(c, "fl_admin", token, { path: "/", httpOnly: true, sameSite: "Strict", secure: true, maxAge: 60 * 60 * 24 * 30 });
  return c.json({ ok: true });
});
admin.post("/logout", (c) => { deleteCookie(c, "fl_admin", { path: "/" }); return c.json({ ok: true }); });

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

admin.use("/resources/*", requireAdmin);
admin.use("/collections", requireAdmin);

/** GET /api/admin/collections — shelves with their resource ids (for the review screen). */
admin.get("/collections", async (c) => {
  const { results: cols } = await c.env.DB.prepare("SELECT id, title_en, title_ru, sort FROM lib_collections ORDER BY sort, id").all<{ id: string; title_en: string; title_ru: string; sort: number }>();
  const { results: items } = await c.env.DB.prepare("SELECT collection_id, resource_id FROM lib_collection_items ORDER BY position").all<{ collection_id: string; resource_id: string }>();
  return c.json(cols.map((col) => ({ ...col, resourceIds: items.filter((i) => i.collection_id === col.id).map((i) => i.resource_id) })));
});

/** PUT /api/admin/resources/:id/collections { ids: string[] } — set which shelves a resource is on (appended at the end). */
admin.put("/resources/:id/collections", async (c) => {
  const id = c.req.param("id");
  if (!(await getResourceRow(c.env, id))) return c.json({ error: "not found" }, 404);
  const { ids = [] } = await c.req.json<{ ids?: string[] }>().catch(() => ({ ids: [] as string[] }));
  const keep = ids.filter((x) => typeof x === "string").slice(0, 20);
  await c.env.DB.prepare(`DELETE FROM lib_collection_items WHERE resource_id = ?${keep.length ? ` AND collection_id NOT IN (${keep.map(() => "?").join(",")})` : ""}`).bind(id, ...keep).run();
  for (const col of keep) {
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO lib_collection_items (collection_id, resource_id, position)
       SELECT ?1, ?2, COALESCE((SELECT MAX(position) + 1 FROM lib_collection_items WHERE collection_id = ?1), 0) WHERE EXISTS (SELECT 1 FROM lib_collections WHERE id = ?1)`,
    ).bind(col, id).run();
  }
  return c.json({ ok: true });
});

/** GET /api/admin/resources/:id — everything for the review screen. */
admin.get("/resources/:id", async (c) => {
  const row = await getResourceRow(c.env, c.req.param("id"));
  if (!row) return c.json({ error: "not found" }, 404);
  const t = await getTranscript(c.env, row.id);
  return c.json({
    resource: toResource(row),
    materials: await getMaterials(c.env, row.id),
    transcript: t ? { source: t.source, lang: t.lang, chars: t.chars, text: t.text.slice(0, 20_000), truncated: t.chars > 20_000, createdAt: t.created_at } : null,
    events: await getEvents(c.env, row.id),
    ai: aiConfigured(c.env),
  });
});

/** PATCH /api/admin/resources/:id — edit metadata/classification. */
admin.patch("/resources/:id", async (c) => {
  const id = c.req.param("id");
  if (!(await getResourceRow(c.env, id))) return c.json({ error: "not found" }, 404);
  const parsed = resourcePatchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid", issues: parsed.error.issues }, 400);
  const p = parsed.data;
  await updateResource(c.env, id, {
    title: p.title, author: p.author, description: p.description, thumbnail_url: p.thumbnailUrl, duration_sec: p.durationSec,
    tracks: p.tracks && JSON.stringify(p.tracks), topics: p.topics && JSON.stringify(p.topics), level: p.level,
    orig_lang: p.origLang, audience: p.audience && JSON.stringify(p.audience), suggested_days: p.suggestedDays && JSON.stringify(p.suggestedDays),
    featured: p.featured === undefined ? undefined : p.featured ? 1 : 0, admin_notes: p.adminNotes,
  });
  return c.json({ resource: toResource((await getResourceRow(c.env, id))!) });
});

/** PUT /api/admin/resources/:id/materials/:lang — save the founder's edited lesson (validated). */
admin.put("/resources/:id/materials/:lang", async (c) => {
  const id = c.req.param("id");
  const lang = c.req.param("lang") as LibLang;
  if (!(LANGS as readonly string[]).includes(lang)) return c.json({ error: "bad lang" }, 400);
  if (!(await getResourceRow(c.env, id))) return c.json({ error: "not found" }, 404);
  const parsed = lessonMaterialSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, 400);
  const cur = (await getMaterials(c.env, id))[lang];
  await setMaterial(c.env, id, lang, { state: "ready", data: parsed.data, origin: cur?.origin === "ai" ? "ai" : cur?.origin ?? "manual", edited: true, error: null });
  await logEvent(c.env, id, `edit:${lang}`, "ok", "lesson edited by founder");
  return c.json({ ok: true, material: (await getMaterials(c.env, id))[lang] });
});

/** DELETE /api/admin/resources/:id/materials/:lang — hide a language's lesson (resource stays as plain link). */
admin.delete("/resources/:id/materials/:lang", async (c) => {
  await c.env.DB.prepare("DELETE FROM lib_materials WHERE resource_id = ? AND lang = ?").bind(c.req.param("id"), c.req.param("lang")).run();
  return c.json({ ok: true });
});

/** POST /api/admin/resources/:id/publish — usable as a plain link even without generated material. */
admin.post("/resources/:id/publish", async (c) => {
  const row = await getResourceRow(c.env, c.req.param("id"));
  if (!row) return c.json({ error: "not found" }, 404);
  if (!row.title.trim()) return c.json({ error: "title required" }, 400);
  await updateResource(c.env, row.id, { status: "published", published_at: row.published_at ?? Math.floor(Date.now() / 1000), last_error: null });
  const mats = await getMaterials(c.env, row.id);
  const missing = toResource(row).audience.filter((l) => mats[l]?.state !== "ready");
  await logEvent(c.env, row.id, "publish", missing.length ? "warn" : "ok", missing.length ? `published; no approved lesson for: ${missing.join(", ")} (students see a plain link)` : "published");
  return c.json({ ok: true, missingLessons: missing });
});
admin.post("/resources/:id/unpublish", async (c) => {
  const row = await getResourceRow(c.env, c.req.param("id"));
  if (!row) return c.json({ error: "not found" }, 404);
  await updateResource(c.env, row.id, { status: "review" });
  await logEvent(c.env, row.id, "unpublish", "info", "moved back to review");
  return c.json({ ok: true });
});

admin.delete("/resources/:id", async (c) => {
  const row = await getResourceRow(c.env, c.req.param("id"));
  if (!row) return c.json({ error: "not found" }, 404);
  if (row.source_type === "upload") await c.env.MEDIA.delete(uploadKey(row.id)).catch(() => {});
  for (const t of ["lib_events", "lib_materials", "lib_transcripts", "lib_collection_items", "lib_user_items"]) {
    await c.env.DB.prepare(`DELETE FROM ${t} WHERE resource_id = ?`).bind(row.id).run();
  }
  await c.env.DB.prepare("DELETE FROM lib_resources WHERE id = ?").bind(row.id).run();
  return c.json({ ok: true });
});
