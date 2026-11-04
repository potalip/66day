import { Hono } from "hono";
import type { AppEnv } from "../env";
import type { LibLang } from "../lib/library/schema";
import { loadPublished, applyFilters, facets, related, forDay } from "../lib/library/catalog";
import { getResourceRow, toResource, getMaterials } from "../lib/library/repo";
import { youtubeEmbedUrl, instagramEmbedUrl } from "../lib/library/url";
import { uploadKey } from "../lib/library/pipeline";

// OWNER: library agent (docs/OWNERSHIP.md). Public student-facing library API.
export const library = new Hono<AppEnv>();

const langOf = (v: string | undefined): LibLang => (v === "ru" ? "ru" : "en");
const today = () => new Date().toISOString().slice(0, 10);

library.get("/health", (c) => c.json({ ok: true, area: "library" }));

/** GET /api/library?lang=&q=&track=&topic=&level=&type=&limit=&offset= */
library.get("/", async (c) => {
  const lang = langOf(c.req.query("lang"));
  const all = await loadPublished(c.env, lang);
  const f = { q: c.req.query("q")?.slice(0, 120), track: c.req.query("track"), topic: c.req.query("topic"), level: c.req.query("level"), type: c.req.query("type") };
  const filtered = applyFilters(all, f);
  const limit = Math.min(Math.max(parseInt(c.req.query("limit") ?? "60", 10) || 60, 1), 200);
  const offset = Math.max(parseInt(c.req.query("offset") ?? "0", 10) || 0, 0);
  return c.json({
    items: filtered.slice(offset, offset + limit).map((x) => x.card),
    total: filtered.length,
    facets: facets(all),
  });
});

/** GET /api/library/collections?lang= — curated shelves with their published items. */
library.get("/collections", async (c) => {
  const lang = langOf(c.req.query("lang"));
  const all = await loadPublished(c.env, lang);
  const byId = new Map(all.map((x) => [x.card.id, x.card]));
  const { results: cols } = await c.env.DB.prepare("SELECT * FROM lib_collections ORDER BY sort, id").all<Record<string, string>>();
  const { results: items } = await c.env.DB.prepare("SELECT collection_id, resource_id FROM lib_collection_items ORDER BY position").all<{ collection_id: string; resource_id: string }>();
  return c.json(cols.map((col) => ({
    id: col.id,
    title: lang === "ru" ? col.title_ru : col.title_en,
    description: lang === "ru" ? col.description_ru : col.description_en,
    items: items.filter((i) => i.collection_id === col.id).map((i) => byId.get(i.resource_id)).filter(Boolean),
  })).filter((col) => col.items.length > 0));
});

/** GET /api/library/by-day/:day?track=apps|video&lang= — for the learn area's day pages. */
library.get("/by-day/:day", async (c) => {
  const day = parseInt(c.req.param("day"), 10);
  if (!(day >= 1 && day <= 66)) return c.json({ error: "day must be 1..66" }, 400);
  const lang = langOf(c.req.query("lang") ?? (await userLang(c)));
  const all = await loadPublished(c.env, lang);
  return c.json({ day, track: c.req.query("track") ?? null, items: forDay(all, day, c.req.query("track")) });
});

/** GET /api/library/me — the student's saved list ("add to today"). */
library.get("/me", async (c) => {
  const lang = langOf(c.req.query("lang"));
  const all = await loadPublished(c.env, lang);
  const byId = new Map(all.map((x) => [x.card.id, x.card]));
  const { results } = await c.env.DB.prepare("SELECT resource_id, for_date, done_at FROM lib_user_items WHERE user_id = ? ORDER BY created_at DESC")
    .bind(c.get("userId")).all<{ resource_id: string; for_date: string | null; done_at: number | null }>();
  const items = results.filter((r) => byId.has(r.resource_id)).map((r) => ({ ...byId.get(r.resource_id)!, forDate: r.for_date, doneAt: r.done_at }));
  return c.json({ today: today(), items });
});

library.post("/:id/today", async (c) => {
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT id FROM lib_resources WHERE id = ? AND status = 'published'").bind(id).first();
  if (!row) return c.json({ error: "not found" }, 404);
  await c.env.DB.prepare(
    `INSERT INTO lib_user_items (user_id, resource_id, for_date) VALUES (?, ?, ?)
     ON CONFLICT (user_id, resource_id) DO UPDATE SET for_date = excluded.for_date`,
  ).bind(c.get("userId"), id, today()).run();
  return c.json({ ok: true, forDate: today() });
});
library.delete("/:id/today", async (c) => {
  await c.env.DB.prepare("DELETE FROM lib_user_items WHERE user_id = ? AND resource_id = ?").bind(c.get("userId"), c.req.param("id")).run();
  return c.json({ ok: true });
});
library.post("/:id/done", async (c) => {
  const { done = true } = await c.req.json<{ done?: boolean }>().catch(() => ({ done: true }));
  const id = c.req.param("id");
  await c.env.DB.prepare(
    `INSERT INTO lib_user_items (user_id, resource_id, done_at) VALUES (?1, ?2, CASE WHEN ?3 THEN unixepoch() END)
     ON CONFLICT (user_id, resource_id) DO UPDATE SET done_at = CASE WHEN ?3 THEN unixepoch() END`,
  ).bind(c.get("userId"), id, done ? 1 : 0).run();
  return c.json({ ok: true, done });
});

/** GET /api/library/media/:id — stream an uploaded video from R2 (published uploads only). */
library.get("/media/:id", async (c) => {
  const row = await getResourceRow(c.env, c.req.param("id"));
  if (!row || row.source_type !== "upload" || row.status !== "published") return c.json({ error: "not found" }, 404);
  const key = uploadKey(row.id);
  const range = c.req.header("range");
  const obj = await c.env.MEDIA.get(key, range ? { range: c.req.raw.headers } : undefined);
  if (!obj) return c.json({ error: "media missing" }, 404);
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("accept-ranges", "bytes");
  if (range && obj.range && "offset" in obj.range) {
    const off = obj.range.offset ?? 0, len = obj.range.length ?? obj.size - off;
    headers.set("content-range", `bytes ${off}-${off + len - 1}/${obj.size}`);
    return new Response(obj.body, { status: 206, headers });
  }
  return new Response(obj.body, { headers });
});

/** GET /api/library/:id?lang= — resource + lesson in the student's language + related. */
library.get("/:id", async (c) => {
  const lang = langOf(c.req.query("lang"));
  const row = await getResourceRow(c.env, c.req.param("id"));
  if (!row || row.status !== "published") return c.json({ error: "not found" }, 404);
  const r = toResource(row);
  const mats = await getMaterials(c.env, r.id);
  const mine = mats[lang]?.state === "ready" ? mats[lang]!.data : null;
  const other: LibLang = lang === "ru" ? "en" : "ru";
  const all = await loadPublished(c.env, lang);
  const self = all.find((x) => x.card.id === r.id)?.card;
  const saved = await c.env.DB.prepare("SELECT for_date, done_at FROM lib_user_items WHERE user_id = ? AND resource_id = ?")
    .bind(c.get("userId"), r.id).first<{ for_date: string | null; done_at: number | null }>();
  return c.json({
    resource: {
      id: r.id, sourceType: r.sourceType, url: r.sourceType === "upload" ? null : r.url, externalId: r.externalId,
      title: r.title, author: r.author, authorUrl: r.authorUrl, durationSec: r.durationSec, thumbnailUrl: r.thumbnailUrl,
      tracks: self?.tracks ?? r.tracks, topics: self?.topics ?? r.topics, level: r.level, origLang: r.origLang,
      suggestedDays: self?.suggestedDays ?? r.suggestedDays, publishedAt: r.publishedAt,
      embedUrl: r.sourceType === "youtube" && r.externalId ? youtubeEmbedUrl(r.externalId)
        : r.sourceType === "instagram" && r.externalId && r.canonicalUrl ? instagramEmbedUrl(r.canonicalUrl)
        : r.sourceType === "upload" ? `/api/library/media/${r.id}` : null,
    },
    lang,
    material: mine,
    otherLangAvailable: !mine && mats[other]?.state === "ready",
    saved: saved ? { forDate: saved.for_date, doneAt: saved.done_at, isToday: saved.for_date === today() } : null,
    related: self ? related(all, self) : [],
  });
});

async function userLang(c: { env: AppEnv["Bindings"]; get: (k: "userId") => string }) {
  const u = await c.env.DB.prepare("SELECT lang FROM users WHERE id = ?").bind(c.get("userId")).first<{ lang: string }>();
  return u?.lang;
}
