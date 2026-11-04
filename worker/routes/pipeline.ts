import { Hono } from "hono";
import type { AppEnv } from "../env";
import { requireAdmin } from "../lib/user";
import { LANGS, type LibLang, LEVELS, TRACKS, safeJson } from "../lib/library/schema";
import { extractUrls } from "../lib/library/url";
import { subtitleFileToText, guessLang } from "../lib/library/metadata";
import {
  type LibEnv, aiConfigured, createFromUrl, enqueue, startBuild, uploadKey, requestMediaWorker,
} from "../lib/library/pipeline";
import { type ResourceRow, toResource, getResourceRow, logEvent, saveTranscript, updateResource, newId } from "../lib/library/repo";

// OWNER: library agent (docs/OWNERSHIP.md). Intake + job control for the smart resource pipeline.
export const pipeline = new Hono<AppEnv>();

pipeline.get("/health", (c) => c.json({ ok: true, area: "pipeline" }));

// Everything except the media-worker callbacks (own bearer token) is admin-only.
pipeline.use("*", async (c, next) => {
  if (c.req.path.includes("/pipeline/media-worker/") || c.req.path.endsWith("/pipeline/health")) return next();
  return requireAdmin(c, next);
});

const wait = (c: { executionCtx: { waitUntil(p: Promise<unknown>): void } }) => {
  try { const ctx = c.executionCtx; return (p: Promise<unknown>) => ctx.waitUntil(p); } catch { return undefined; }
};

const pickTracks = (v: unknown) => (Array.isArray(v) ? v.filter((t) => (TRACKS as readonly string[]).includes(t)) : []);
const pickAudience = (v: unknown): LibLang[] => (Array.isArray(v) ? v.filter((t): t is LibLang => (LANGS as readonly string[]).includes(t)) : []);

/** GET /api/pipeline/status — what is configured. */
pipeline.get("/status", (c) => {
  const env = c.env as LibEnv;
  return c.json({ ai: aiConfigured(env), model: env.CLAUDE_MODEL, queue: !!env.JOBS, mediaWorker: !!env.MEDIA_WORKER_URL });
});

/** POST /api/pipeline/resources { text: "urls…", tracks?, topics?, level?, audience?, notes? } — bulk paste. */
pipeline.post("/resources", async (c) => {
  const body = await c.req.json<{ text?: string; urls?: string[]; tracks?: string[]; topics?: string[]; level?: string; audience?: string[]; notes?: string }>().catch(() => null);
  if (!body) return c.json({ error: "invalid JSON" }, 400);
  const text = [body.text ?? "", ...(body.urls ?? [])].join("\n");
  const parsed = extractUrls(text).slice(0, 50);
  if (!parsed.length) return c.json({ error: "no URLs found" }, 400);
  const opts = {
    tracks: pickTracks(body.tracks), topics: (body.topics ?? []).slice(0, 8),
    level: (LEVELS as readonly string[]).includes(body.level ?? "") ? body.level : undefined,
    audience: pickAudience(body.audience), adminNotes: body.notes?.slice(0, 4000) || null, createdBy: c.get("userId"),
  };
  const created: { id: string; url: string; sourceType: string }[] = [];
  const duplicates: { id: string; url: string }[] = [];
  for (const p of parsed) {
    const res = await createFromUrl(c.env, p, opts);
    if (res.duplicate) duplicates.push({ id: res.id, url: p.url });
    else {
      created.push({ id: res.id, url: p.url, sourceType: p.sourceType });
      await enqueue(c.env, { kind: "resource.ingest", resourceId: res.id }, wait(c));
    }
  }
  return c.json({ created, duplicates }, created.length ? 201 : 200);
});

/**
 * POST /api/pipeline/upload (multipart): file (video/audio) and/or transcript (file) and/or transcriptText,
 * plus title, author?, tracks? (comma list), level?, audience? (comma list), notes?
 */
pipeline.post("/upload", async (c) => {
  const form = await c.req.formData().catch(() => null);
  if (!form) return c.json({ error: "expected multipart form" }, 400);
  const title = String(form.get("title") ?? "").trim().slice(0, 300);
  const file = form.get("file");
  const tFile = form.get("transcript");
  const tText = String(form.get("transcriptText") ?? "").trim();
  if (!title) return c.json({ error: "title is required" }, 400);
  if (!(file instanceof File) && !(tFile instanceof File) && !tText) return c.json({ error: "add a video/audio file or a transcript" }, 400);
  if (file instanceof File && file.size > 500 * 1024 * 1024) return c.json({ error: "file too large (max 500 MB here; use the media worker for bigger files)" }, 413);

  const id = newId();
  const list = (k: string) => String(form.get(k) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  await c.env.DB.prepare(
    `INSERT INTO lib_resources (id, source_type, url, canonical_url, title, author, tracks, level, audience, status, admin_notes, created_by, transcript_state)
     VALUES (?, 'upload', NULL, NULL, ?, ?, ?, ?, ?, 'processing', ?, ?, 'none')`,
  ).bind(
    id, title, String(form.get("author") ?? "").trim() || null, JSON.stringify(pickTracks(list("tracks"))),
    (LEVELS as readonly string[]).includes(String(form.get("level"))) ? String(form.get("level")) : "beginner",
    JSON.stringify(pickAudience(list("audience")).length ? pickAudience(list("audience")) : ["ru", "en"]),
    String(form.get("notes") ?? "").trim() || null, c.get("userId"),
  ).run();
  await logEvent(c.env, id, "created", "info", `upload: ${file instanceof File ? `${file.name} (${Math.round(file.size / 1024)} KB)` : "transcript only"}`);

  if (file instanceof File) {
    await c.env.MEDIA.put(uploadKey(id), file.stream(), { httpMetadata: { contentType: file.type || "application/octet-stream" }, customMetadata: { filename: file.name } });
    await logEvent(c.env, id, "upload", "ok", `stored in R2 as ${uploadKey(id)}`);
  }
  const text = tFile instanceof File ? await readTranscriptFile(tFile) : tText ? tText : null;
  if (text) {
    await saveTranscript(c.env, id, { source: tFile instanceof File ? "upload" : "manual", lang: guessLang(text) ?? null, text });
    await logEvent(c.env, id, "transcript", "ok", `${tFile instanceof File ? "uploaded file" : "pasted"}: ${text.length} chars`);
  } else {
    await updateResource(c.env, id, { transcript_state: "needed" });
    const sent = await requestMediaWorker(c.env as LibEnv, id).catch(() => false);
    if (!sent) await logEvent(c.env, id, "transcript", "warn", "needs transcript — paste text or upload .srt/.vtt/.txt (media worker not configured)");
  }
  await startBuild(c.env, id, undefined, wait(c));
  return c.json({ id }, 201);
});

async function readTranscriptFile(f: File) {
  const raw = (await f.text()).slice(0, 2_000_000);
  return /\.(srt|vtt)$/i.test(f.name) || /-->/.test(raw.slice(0, 2000)) ? subtitleFileToText(raw) : raw.trim();
}

/** POST /api/pipeline/resources/:id/transcript — JSON { text, rebuild? } or multipart { file, rebuild? }. */
pipeline.post("/resources/:id/transcript", async (c) => {
  const id = c.req.param("id");
  const row = await getResourceRow(c.env, id);
  if (!row) return c.json({ error: "not found" }, 404);
  let text = "", source: "manual" | "upload" = "manual", rebuild = true, r2Key: string | null = null;
  if ((c.req.header("content-type") ?? "").includes("multipart")) {
    const form = await c.req.formData();
    const f = form.get("file");
    if (!(f instanceof File)) return c.json({ error: "file missing" }, 400);
    text = await readTranscriptFile(f);
    source = "upload";
    rebuild = form.get("rebuild") !== "false";
    r2Key = `lib/transcripts/${id}/${f.name.replace(/[^\w.-]+/g, "_").slice(0, 80)}`;
    await c.env.MEDIA.put(r2Key, text, { httpMetadata: { contentType: "text/plain; charset=utf-8" } });
  } else {
    const b = await c.req.json<{ text?: string; rebuild?: boolean }>().catch(() => ({} as { text?: string; rebuild?: boolean }));
    text = (b.text ?? "").trim();
    rebuild = b.rebuild !== false;
  }
  if (text.length < 40) return c.json({ error: "transcript is too short" }, 400);
  await saveTranscript(c.env, id, { source, lang: guessLang(text) ?? null, text, r2Key });
  await logEvent(c.env, id, "transcript", "ok", `${source === "upload" ? "uploaded" : "pasted"} by founder: ${text.length} chars`);
  if (rebuild) await startBuild(c.env, id, undefined, wait(c));
  return c.json({ ok: true, chars: text.length, rebuilding: rebuild });
});

/** POST /api/pipeline/resources/:id/ingest — re-run metadata + transcript (+ build). */
pipeline.post("/resources/:id/ingest", async (c) => {
  const id = c.req.param("id");
  if (!(await getResourceRow(c.env, id))) return c.json({ error: "not found" }, 404);
  await updateResource(c.env, id, { status: "processing" });
  await logEvent(c.env, id, "ingest", "info", "re-run requested");
  await enqueue(c.env, { kind: "resource.ingest", resourceId: id }, wait(c));
  return c.json({ ok: true });
});

/** POST /api/pipeline/resources/:id/build { langs?: ["ru","en"] } — (re)generate lesson material. */
pipeline.post("/resources/:id/build", async (c) => {
  const id = c.req.param("id");
  if (!(await getResourceRow(c.env, id))) return c.json({ error: "not found" }, 404);
  const b = await c.req.json<{ langs?: string[] }>().catch(() => ({} as { langs?: string[] }));
  const langs = pickAudience(b.langs);
  await logEvent(c.env, id, "build_lesson", "info", `rebuild requested (${(langs.length ? langs : ["all"]).join(", ")})`);
  await startBuild(c.env, id, langs.length ? langs : undefined, wait(c));
  return c.json({ ok: true, ai: aiConfigured(c.env) });
});

/** GET /api/pipeline/board?status=&q= — queue status board. */
pipeline.get("/board", async (c) => {
  const status = c.req.query("status");
  const q = (c.req.query("q") ?? "").trim().toLowerCase();
  const { results } = await c.env.DB.prepare(
    `SELECT r.*,
       (SELECT json_group_object(m.lang, m.state) FROM lib_materials m WHERE m.resource_id = r.id) AS m_states,
       (SELECT e.message FROM lib_events e WHERE e.resource_id = r.id ORDER BY e.id DESC LIMIT 1) AS last_event,
       (SELECT e.status FROM lib_events e WHERE e.resource_id = r.id ORDER BY e.id DESC LIMIT 1) AS last_event_status
     FROM lib_resources r ORDER BY r.updated_at DESC, r.created_at DESC LIMIT 500`,
  ).all<ResourceRow & { m_states: string | null; last_event: string | null; last_event_status: string | null }>();
  const counts: Record<string, number> = { draft: 0, processing: 0, review: 0, published: 0, failed: 0 };
  for (const r of results) counts[r.status] = (counts[r.status] ?? 0) + 1;
  const items = results
    .filter((r) => !status || r.status === status)
    .filter((r) => !q || `${r.title} ${r.author ?? ""} ${r.url ?? ""}`.toLowerCase().includes(q))
    .map((r) => ({
      ...toResource(r),
      materials: safeJson<Record<string, string>>(r.m_states, {}),
      lastEvent: r.last_event ? { message: r.last_event, status: r.last_event_status } : null,
    }));
  return c.json({ counts, total: results.length, items });
});

// ---------------- Media worker seam (worker/lib/library/MEDIA-WORKER.md) ----------------

const mediaAuth = (c: { env: LibEnv; req: { header: (k: string) => string | undefined } }) => {
  const tok = c.env.MEDIA_WORKER_TOKEN;
  return !!tok && c.req.header("authorization") === `Bearer ${tok}`;
};

/** GET /api/pipeline/media-worker/source/:id — the worker downloads an uploaded file. */
pipeline.get("/media-worker/source/:id", async (c) => {
  if (!mediaAuth(c as never)) return c.json({ error: "unauthorized" }, 401);
  const obj = await c.env.MEDIA.get(uploadKey(c.req.param("id")));
  if (!obj) return c.json({ error: "not found" }, 404);
  const h = new Headers(); obj.writeHttpMetadata(h);
  return new Response(obj.body, { headers: h });
});

/** POST /api/pipeline/media-worker/callback — { resourceId, ok, transcript?, lang?, durationSec?, error? } */
pipeline.post("/media-worker/callback", async (c) => {
  if (!mediaAuth(c as never)) return c.json({ error: "unauthorized" }, 401);
  const b = await c.req.json<{ resourceId?: string; ok?: boolean; transcript?: string; lang?: string; durationSec?: number; error?: string }>().catch(() => null);
  if (!b?.resourceId) return c.json({ error: "resourceId required" }, 400);
  const row = await getResourceRow(c.env, b.resourceId);
  if (!row) return c.json({ error: "not found" }, 404);
  if (!b.ok || !b.transcript || b.transcript.trim().length < 40) {
    await logEvent(c.env, row.id, "media_worker", "error", b.error ?? "no transcript returned");
    await updateResource(c.env, row.id, { transcript_state: "needed" });
    return c.json({ ok: true });
  }
  await saveTranscript(c.env, row.id, { source: "media_worker", lang: b.lang ?? guessLang(b.transcript) ?? null, text: b.transcript });
  if (b.durationSec && !row.duration_sec) await updateResource(c.env, row.id, { duration_sec: Math.round(b.durationSec) });
  await logEvent(c.env, row.id, "media_worker", "ok", `transcript received: ${b.transcript.length} chars`);
  await startBuild(c.env, row.id, undefined, wait(c));
  return c.json({ ok: true });
});
