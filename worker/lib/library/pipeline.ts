import type { Env, JobMessage } from "../../env";
import { type LibLang, LANGS } from "./schema";
import { type ParsedUrl, parseResourceUrl } from "./url";
import { fetchResource } from "./fetchers";
import { generateMaterial, starterMaterial } from "./generate";
import {
  type Resource, getResourceRow, toResource, updateResource, logEvent, getTranscript, saveTranscript,
  setMaterial, getMaterials, newId,
} from "./repo";

/** Optional bindings for the external media worker (AWS: download + Whisper). Not yet in worker/env.ts — see docs/agents/library-REPORT.md. */
export type LibEnv = Env & { MEDIA_WORKER_URL?: string; MEDIA_WORKER_TOKEN?: string; PUBLIC_BASE_URL?: string };

/** R2 key of an uploaded source video/audio. */
export const uploadKey = (id: string) => `lib/uploads/${id}/source`;

export function aiConfigured(env: Env) { return !!env.ANTHROPIC_API_KEY; }

/**
 * Enqueue a pipeline job. Falls back to running inline (via waitUntil when available) if the queue
 * binding is missing or send fails, so local dev and tests never get stuck in "queued".
 */
export async function enqueue(env: Env, msg: JobMessage, waitUntil?: (p: Promise<unknown>) => void) {
  try {
    if (!env.JOBS) throw new Error("no JOBS binding");
    await env.JOBS.send(msg);
  } catch (e) {
    console.warn("queue send failed, running inline:", (e as Error).message);
    const p = runJob(env, msg).catch((err) => console.error("inline job failed", err));
    if (waitUntil) waitUntil(p); else await p;
  }
}

export async function runJob(env: Env, msg: JobMessage) {
  if (msg.kind === "resource.ingest") return ingest(env, msg.resourceId);
  if (msg.kind === "resource.build_lesson") return buildLesson(env, msg.resourceId, msg.lang);
}

/** Queue handlers, registered in worker/queue.ts. */
export const libraryJobHandlers = {
  "resource.ingest": (env: Env, m: JobMessage) => (m.kind === "resource.ingest" ? ingest(env, m.resourceId) : Promise.resolve()),
  "resource.build_lesson": (env: Env, m: JobMessage) => (m.kind === "resource.build_lesson" ? buildLesson(env, m.resourceId, m.lang) : Promise.resolve()),
};

export interface CreateOptions {
  tracks?: string[]; topics?: string[]; level?: string; audience?: LibLang[]; adminNotes?: string | null; createdBy?: string | null;
}

/** Create a resource from a parsed URL. Returns existing id when the URL is already in the library. */
export async function createFromUrl(env: Env, p: ParsedUrl, o: CreateOptions = {}): Promise<{ id: string; duplicate: boolean }> {
  const existing = await env.DB.prepare("SELECT id FROM lib_resources WHERE canonical_url = ?").bind(p.canonicalUrl).first<{ id: string }>();
  if (existing) return { id: existing.id, duplicate: true };
  const id = newId();
  await env.DB.prepare(
    `INSERT INTO lib_resources (id, source_type, url, canonical_url, external_id, title, tracks, topics, level, audience, status, admin_notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?)`,
  ).bind(
    id, p.sourceType, p.url, p.canonicalUrl, p.externalId, "", JSON.stringify(o.tracks ?? []), JSON.stringify(o.topics ?? []),
    o.level ?? "beginner", JSON.stringify(o.audience?.length ? o.audience : ["ru", "en"]), o.adminNotes ?? null, o.createdBy ?? null,
  ).run();
  await logEvent(env, id, "created", "info", `${p.sourceType}${p.kind ? ` (${p.kind})` : ""}: ${p.url}`);
  return { id, duplicate: false };
}

/** Step 1: metadata + transcript. Then hands over to build_lesson for both languages. */
export async function ingest(env: Env, id: string) {
  const row = await getResourceRow(env, id);
  if (!row) return;
  const r = toResource(row);
  await updateResource(env, id, { status: "processing", last_error: null });

  if (r.sourceType === "upload") {
    await logEvent(env, id, "metadata", "ok", "uploaded file — metadata entered by the founder");
  } else {
    const p = parseResourceUrl(r.url ?? "");
    if (!p) {
      await updateResource(env, id, { status: "failed", last_error: "invalid URL" });
      await logEvent(env, id, "metadata", "error", "invalid URL");
      return;
    }
    await updateResource(env, id, { transcript_state: "fetching" });
    const res = await fetchResource(p);
    const m = res.meta;
    await updateResource(env, id, {
      title: r.title || m.title || fallbackTitle(p),
      author: r.author ?? m.author ?? null,
      author_url: r.authorUrl ?? m.authorUrl ?? null,
      description: r.description ?? m.description ?? null,
      thumbnail_url: r.thumbnailUrl ?? m.thumbnailUrl ?? null,
      duration_sec: r.durationSec ?? m.durationSec ?? null,
      orig_lang: m.lang === "ru" || m.lang === "en" ? m.lang : r.origLang,
    });
    await logEvent(env, id, "metadata", m.title ? "ok" : "warn",
      [m.title ? `“${m.title}”${m.author ? ` — ${m.author}` : ""}` : "no title found; using the URL", ...res.notes].join(" · "));

    const existing = await getTranscript(env, id);
    if (existing && existing.source !== "page_text" && existing.source !== "youtube_captions") {
      await updateResource(env, id, { transcript_state: "ready" });
      await logEvent(env, id, "transcript", "ok", `keeping ${existing.source} transcript (${existing.chars} chars)`);
    } else if (res.transcript) {
      await saveTranscript(env, id, { source: res.transcript.source, lang: res.transcript.lang, text: res.transcript.text });
      await logEvent(env, id, "transcript", "ok", `${res.transcript.source}: ${res.transcript.text.length} chars`);
    } else {
      await updateResource(env, id, { transcript_state: "needed" });
      const why = p.sourceType === "instagram"
        ? "Instagram blocks automated access — paste the transcript/caption or upload the video file"
        : p.sourceType === "youtube" ? "captions not reachable — paste the transcript or upload a .srt/.vtt/.txt file"
        : "no readable page text — paste the key text";
      await logEvent(env, id, "transcript", "warn", why);
      await requestMediaWorker(env as LibEnv, id).catch(() => {});
    }
  }
  await startBuild(env, id);
}

function fallbackTitle(p: ParsedUrl) {
  if (p.sourceType === "youtube") return `YouTube video ${p.externalId}`;
  if (p.sourceType === "instagram") return `Instagram ${p.kind ?? "post"} ${p.externalId ?? ""}`.trim();
  try { const u = new URL(p.url); return `${u.hostname.replace(/^www\./, "")}${u.pathname !== "/" ? u.pathname : ""}`; } catch { return p.url; }
}

/** Queue build_lesson for each audience language (or mark "AI not configured" with a starter draft). */
export async function startBuild(env: Env, id: string, langs?: LibLang[], waitUntil?: (p: Promise<unknown>) => void) {
  const row = await getResourceRow(env, id);
  if (!row) return;
  const r = toResource(row);
  const targets = (langs ?? r.audience).filter((l) => (LANGS as readonly string[]).includes(l));
  if (!aiConfigured(env)) {
    const t = await getTranscript(env, id);
    const mats = await getMaterials(env, id);
    for (const lang of targets) {
      const cur = mats[lang];
      if (cur?.data && (cur.state === "ready" || cur.edited)) continue; // never clobber founder edits or fixtures
      await setMaterial(env, id, lang, { state: "not_configured", data: starterMaterial(r, lang, t?.text ?? null), origin: "manual", error: "ANTHROPIC_API_KEY not set" });
    }
    await updateResource(env, id, { ai_state: "not_configured", status: row.status === "published" ? "published" : "review" });
    await logEvent(env, id, "build_lesson", "warn", "AI not configured — starter drafts created; edit them by hand or add ANTHROPIC_API_KEY and rebuild");
    return;
  }
  await updateResource(env, id, { ai_state: "queued", status: row.status === "published" ? "published" : "processing" });
  for (const lang of targets) {
    await setMaterial(env, id, lang, { state: "queued" });
    await enqueue(env, { kind: "resource.build_lesson", resourceId: id, lang }, waitUntil);
  }
}

/** Step 2: generate lesson material for one language. */
export async function buildLesson(env: Env, id: string, lang: LibLang) {
  const row = await getResourceRow(env, id);
  if (!row) return;
  const r = toResource(row);
  await setMaterial(env, id, lang, { state: "generating" });
  await updateResource(env, id, { ai_state: "generating" });
  const t = await getTranscript(env, id);
  const res = await generateMaterial(env, r, lang, t?.text ?? null);
  if (res.ok) {
    await setMaterial(env, id, lang, { state: "ready", data: res.data, origin: "ai", model: res.model, edited: false, error: null });
    await logEvent(env, id, `build_lesson:${lang}`, "ok", `generated${res.attempts > 1 ? " after 1 retry" : ""}${t ? "" : " without transcript (metadata only)"}`);
    // Adopt AI classification where the founder left fields empty.
    const fresh = toResource((await getResourceRow(env, id))!);
    await updateResource(env, id, {
      tracks: fresh.tracks.length ? undefined : JSON.stringify(res.data.tracks),
      topics: fresh.topics.length ? undefined : JSON.stringify(res.data.topics),
      suggested_days: fresh.suggestedDays.length ? undefined : JSON.stringify(res.data.suggestedDays),
      level: fresh.tracks.length ? undefined : res.data.level,
    });
  } else if (res.reason === "not_configured") {
    await setMaterial(env, id, lang, { state: "not_configured", data: starterMaterial(r, lang, t?.text ?? null), origin: "manual" });
    await logEvent(env, id, `build_lesson:${lang}`, "warn", "AI not configured");
  } else {
    await setMaterial(env, id, lang, { state: "failed", error: res.error });
    await logEvent(env, id, `build_lesson:${lang}`, "error", `${res.reason}: ${res.error}`);
  }
  await settle(env, id);
}

/** After a language finishes: roll material states up into the resource's ai_state/status. */
async function settle(env: Env, id: string) {
  const row = await getResourceRow(env, id);
  if (!row) return;
  const r: Resource = toResource(row);
  const mats = await getMaterials(env, id);
  const states = r.audience.map((l) => mats[l]?.state ?? "empty");
  if (states.some((s) => s === "queued" || s === "generating")) return;
  const ready = states.filter((s) => s === "ready").length;
  const ai_state = ready === states.length ? "ready" : states.every((s) => s === "not_configured") ? "not_configured" : ready > 0 ? "partial" : "failed";
  await updateResource(env, id, { ai_state, status: r.status === "published" ? "published" : "review", last_error: ai_state === "failed" ? "lesson generation failed — see log" : null });
  await logEvent(env, id, "review", ai_state === "ready" ? "ok" : "warn", ai_state === "ready" ? "ready for review" : `ready for review (AI: ${ai_state})`);
}

/**
 * Seam for the external media worker (AWS: yt-dlp/download + Whisper). Contract in worker/lib/library/MEDIA-WORKER.md.
 * No-op unless MEDIA_WORKER_URL is configured.
 */
export async function requestMediaWorker(env: LibEnv, id: string) {
  if (!env.MEDIA_WORKER_URL) return false;
  const row = await getResourceRow(env, id);
  if (!row) return false;
  const base = env.PUBLIC_BASE_URL ?? "";
  const res = await fetch(`${env.MEDIA_WORKER_URL.replace(/\/$/, "")}/v1/transcribe`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.MEDIA_WORKER_TOKEN ?? ""}` },
    body: JSON.stringify({
      resourceId: id,
      sourceType: row.source_type,
      sourceUrl: row.source_type === "upload" ? null : row.url,
      mediaUrl: row.source_type === "upload" ? `${base}/api/pipeline/media-worker/source/${id}` : null,
      langHint: row.orig_lang,
      callbackUrl: `${base}/api/pipeline/media-worker/callback`,
    }),
  });
  await logEvent(env, id, "media_worker", res.ok ? "info" : "warn", res.ok ? "transcription requested" : `media worker HTTP ${res.status}`);
  return res.ok;
}
