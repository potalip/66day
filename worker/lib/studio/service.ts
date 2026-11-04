/**
 * Studio domain logic shared by the routes and the queue handlers: projects, planning, render submission,
 * status sync (callback or polling), and copying finished videos into R2.
 */
import type { Env } from "../../env";
import { onGameEvent } from "../game";
import { planStoryboard } from "./plan";
import { type Storyboard, getTemplate, validateStoryboard } from "./storyboard";

export interface ProjectRow {
  id: string; user_id: string; title: string; template: string; style: string; format: string; lang: "en" | "ru";
  brief: string; storyboard: string; status: string; plan_source: string; plan_error: string | null;
  current_render_id: string | null; created_at: number; updated_at: number;
}
export interface RenderRow {
  id: string; project_id: string; user_id: string; job_id: string | null; quality: "final" | "draft"; status: string;
  progress: number; stage: string | null; error: string | null; storyboard: string; callback_origin: string | null;
  duration: number | null; width: number | null; height: number | null; video_key: string | null; thumb_key: string | null;
  contact_key: string | null; remote_video_url: string | null; remote_thumb_url: string | null; share_slug: string | null;
  created_at: number; updated_at: number; finished_at: number | null;
}

export const ACTIVE = ["queued", "submitted", "rendering", "ingesting"];
export const newId = (p: string) => `${p}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;

export function rendererConfigured(env: Env) { return !!(env.RENDER_SERVER_URL && env.RENDER_SERVER_TOKEN); }

export async function getProject(env: Env, id: string) {
  return env.DB.prepare("SELECT * FROM studio_projects WHERE id = ?").bind(id).first<ProjectRow>();
}
export async function getRender(env: Env, id: string) {
  return env.DB.prepare("SELECT * FROM studio_renders WHERE id = ?").bind(id).first<RenderRow>();
}

// ------------------------------------------------------------------------------------------------ planning
export async function runPlan(env: Env, projectId: string) {
  const p = await getProject(env, projectId);
  if (!p || p.status !== "planning") return;
  const T = getTemplate(p.template);
  if (!T) return;
  const current = JSON.parse(p.storyboard) as Storyboard;
  let res: Awaited<ReturnType<typeof planStoryboard>>;
  try {
    res = await planStoryboard(env, {
      template: T, lang: p.lang, style: p.style, format: p.format, brief: p.brief,
      handle: (current.fields?.handle as string) || undefined,
      current: p.plan_source === "manual" ? current : undefined,
    });
  } catch (e) {
    res = { ok: false, reason: "api_error", message: String(e).slice(0, 300) };
  }
  // only land the result if the project is still planning (edits are locked meanwhile)
  if (res.ok) {
    const title = res.storyboard.title || p.title;
    await env.DB.prepare(
      "UPDATE studio_projects SET storyboard = ?, title = ?, status = 'draft', plan_source = 'ai', plan_error = NULL, updated_at = unixepoch() WHERE id = ? AND status = 'planning'",
    ).bind(JSON.stringify(res.storyboard), title, p.id).run();
  } else {
    await failPlan(env, p.id, `${res.reason}: ${res.message}`);
  }
}

export async function failPlan(env: Env, projectId: string, msg: string) {
  await env.DB.prepare("UPDATE studio_projects SET status = 'draft', plan_error = ?, updated_at = unixepoch() WHERE id = ? AND status = 'planning'")
    .bind(msg.slice(0, 500), projectId).run();
}

/** A plan that never came back (killed background task, dropped queue message) unlocks the project. */
export const PLAN_STALE_S = 300;
export async function unstickPlan(env: Env, p: ProjectRow): Promise<boolean> {
  if (p.status !== "planning" || Date.now() / 1000 - p.updated_at < PLAN_STALE_S) return false;
  await failPlan(env, p.id, "timeout: planning took too long");
  return true;
}

// ------------------------------------------------------------------------------------------------ rendering
async function rs(env: Env, path: string, init?: RequestInit) {
  const res = await fetch(`${env.RENDER_SERVER_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${env.RENDER_SERVER_TOKEN}`, "content-type": "application/json", ...init?.headers },
  });
  const body = await res.text();
  let json: any = null;
  try { json = JSON.parse(body); } catch { /* not json */ }
  return { ok: res.ok, status: res.status, json, body };
}

export async function renderServerHealth(env: Env): Promise<{ ok: boolean; elevenlabs?: boolean; error?: string }> {
  if (!rendererConfigured(env)) return { ok: false, error: "not_configured" };
  try {
    const r = await fetch(`${env.RENDER_SERVER_URL.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return { ok: false, error: `http_${r.status}` };
    const j = (await r.json()) as { elevenlabs?: boolean };
    return { ok: true, elevenlabs: !!j.elevenlabs };
  } catch (e) {
    return { ok: false, error: "unreachable" };
  }
}

/** Queue handler: send the render to the render server. */
export async function submitRender(env: Env, projectId: string) {
  const p = await getProject(env, projectId);
  if (!p?.current_render_id) return;
  const r = await getRender(env, p.current_render_id);
  if (!r || r.status !== "queued") return;
  if (!rendererConfigured(env)) return failRender(env, r, "Render server is not configured");
  // claim the submission so the queue consumer, its retries and the polling fallback can't double-submit
  const claim = await env.DB.prepare(
    "UPDATE studio_renders SET stage = 'submitting', updated_at = unixepoch() WHERE id = ? AND status = 'queued' AND (stage IS NULL OR stage <> 'submitting' OR updated_at < unixepoch() - 60)",
  ).bind(r.id).run();
  if (!claim.meta.changes) return;
  // A local Worker can't be called back by a remote render server; polling (syncRender) covers that case.
  const local = (u: string) => /\/\/(localhost|127\.0\.0\.1)/.test(u);
  const callback = r.callback_origin && (!local(r.callback_origin) || local(env.RENDER_SERVER_URL))
    ? `${r.callback_origin}/api/studio/render-callback` : undefined;
  const res = await rs(env, "/v1/jobs", {
    method: "POST",
    body: JSON.stringify({
      storyboard: absolutizeAssets(JSON.parse(r.storyboard), r.callback_origin ?? ""), quality: r.quality, external_id: r.id,
      callback_url: callback, callback_token: env.RENDER_SERVER_TOKEN, metadata: { project_id: p.id },
    }),
  });
  if (!res.ok) {
    if (res.status >= 500) {
      await env.DB.prepare("UPDATE studio_renders SET stage = NULL WHERE id = ? AND status = 'queued'").bind(r.id).run();
      throw new Error(`render server ${res.status}`); // queue retries
    }
    return failRender(env, r, res.json?.message ?? `render server said ${res.status}`);
  }
  await env.DB.prepare("UPDATE studio_renders SET job_id = ?, status = 'submitted', stage = 'queued', updated_at = unixepoch() WHERE id = ? AND status = 'queued'")
    .bind(res.json.id, r.id).run();
}

/** Our uploaded images are stored as "/api/studio/assets/…" paths; the render server needs absolute URLs. */
export function absolutizeAssets<T>(sb: T, origin: string): T {
  const fix = (v: unknown): unknown =>
    typeof v === "string" && v.startsWith("/api/studio/assets/") ? `${origin}${v}` :
    Array.isArray(v) ? v.map(fix) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)])) : v;
  return fix(sb) as T;
}

async function failRender(env: Env, r: RenderRow, error: string) {
  await env.DB.batch([
    env.DB.prepare("UPDATE studio_renders SET status = 'failed', error = ?, finished_at = unixepoch(), updated_at = unixepoch() WHERE id = ?").bind(error.slice(0, 500), r.id),
    env.DB.prepare("UPDATE studio_projects SET status = 'failed', updated_at = unixepoch() WHERE id = ? AND current_render_id = ?").bind(r.project_id, r.id),
  ]);
}

interface Job {
  id: string; status: string; progress: number; stage: string; error: string | null; external_id?: string;
  result?: { duration: number; width: number; height: number } | null;
  outputs?: { video_url: string; thumbnail_url: string; contact_url: string } | null;
}

/** Apply a render-server job snapshot (from the callback or from polling). Idempotent. */
export async function applyJob(env: Env, r: RenderRow, job: Job): Promise<void> {
  if (["done", "failed", "canceled"].includes(r.status)) return;
  if (job.status === "failed" || job.status === "canceled") return failRender(env, r, job.error || job.status);
  if (job.status === "done" && !job.outputs?.video_url) return failRender(env, r, "Render finished without output files");
  if (job.status !== "done") {
    await env.DB.prepare("UPDATE studio_renders SET status = 'rendering', progress = ?, stage = ?, updated_at = unixepoch() WHERE id = ? AND status IN ('submitted','rendering','queued')")
      .bind(Math.min(.99, job.progress ?? 0), job.stage ?? job.status, r.id).run();
    return;
  }
  // done: claim ingestion (only one request does it)
  const claim = await env.DB.prepare("UPDATE studio_renders SET status = 'ingesting', stage = 'saving', progress = .97, updated_at = unixepoch() WHERE id = ? AND status IN ('queued','submitted','rendering')")
    .bind(r.id).run();
  if (!claim.meta.changes) return;
  const o = job.outputs!;  // checked above
  const keys: Record<string, string | null> = { video: null, thumb: null, contact: null };
  const copy = async (url: string, name: string, type: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok || !res.body) return null;
      const key = `studio/${r.project_id}/${r.id}/${name}`;
      await env.MEDIA.put(key, res.body, { httpMetadata: { contentType: type } });
      return key;
    } catch { return null; }
  };
  [keys.video, keys.thumb, keys.contact] = await Promise.all([
    copy(o.video_url, "video.mp4", "video/mp4"), copy(o.thumbnail_url, "thumbnail.jpg", "image/jpeg"),
    copy(o.contact_url, "contact.png", "image/png"),
  ]);
  await env.DB.batch([
    env.DB.prepare(`UPDATE studio_renders SET status = 'done', progress = 1, stage = 'done', duration = ?, width = ?, height = ?,
      video_key = ?, thumb_key = ?, contact_key = ?, remote_video_url = ?, remote_thumb_url = ?, finished_at = unixepoch(), updated_at = unixepoch() WHERE id = ?`)
      .bind(job.result?.duration ?? null, job.result?.width ?? null, job.result?.height ?? null, keys.video, keys.thumb, keys.contact,
        o.video_url, o.thumbnail_url, r.id),
    env.DB.prepare("UPDATE studio_projects SET status = 'rendered', updated_at = unixepoch() WHERE id = ? AND current_render_id = ?").bind(r.project_id, r.id),
  ]);
  if (r.quality === "final") {
    try { await onGameEvent(env, r.user_id, { type: "studio.rendered", projectId: r.project_id }); } catch (e) { console.error("onGameEvent", e); }
  }
}

/** Polling fallback (local dev has no reachable callback URL; production uses it if a callback was missed). */
export async function syncRender(env: Env, r: RenderRow): Promise<RenderRow> {
  const now = Date.now() / 1000;
  if (ACTIVE.includes(r.status) && now - r.created_at > 45 * 60) {
    await failRender(env, r, "Render timed out. Please try again.");
    return (await getRender(env, r.id))!;
  }
  // ingest interrupted (request killed mid-copy): release the claim so it runs again
  if (r.status === "ingesting" && now - r.updated_at > 120) {
    await env.DB.prepare("UPDATE studio_renders SET status = 'rendering', updated_at = 0 WHERE id = ? AND status = 'ingesting'").bind(r.id).run();
    r = (await getRender(env, r.id))!;
  }
  // queue message never processed (e.g. a local setup without a consumer): submit directly
  if (r.status === "queued" && !r.job_id && now - r.created_at > 20) {
    await submitRender(env, r.project_id).catch((e) => console.error("submitRender", e));
    return (await getRender(env, r.id))!;
  }
  if (!r.job_id || !["submitted", "rendering"].includes(r.status) || !rendererConfigured(env)) return r;
  if (now - r.updated_at < 2) return r;
  const res = await rs(env, `/v1/jobs/${r.job_id}`).catch(() => null);
  if (!res?.ok) {
    if (res?.status === 404) await failRender(env, r, "The render server lost this job (it may have been restarted). Try again.");
    return (await getRender(env, r.id))!;
  }
  await applyJob(env, r, res.json as Job);
  return (await getRender(env, r.id))!;
}

export async function startRender(env: Env, p: ProjectRow, quality: "final" | "draft", origin: string) {
  const v = validateStoryboard(JSON.parse(p.storyboard));
  if (!v.ok) return { ok: false as const, errors: v.errors };
  const id = newId("rnd");
  await env.DB.batch([
    env.DB.prepare("INSERT INTO studio_renders (id, project_id, user_id, quality, storyboard, callback_origin) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, p.id, p.user_id, quality, JSON.stringify(v.storyboard), origin),
    env.DB.prepare("UPDATE studio_projects SET status = 'rendering', current_render_id = ?, updated_at = unixepoch() WHERE id = ?").bind(id, p.id),
  ]);
  return { ok: true as const, renderId: id };
}

/** Public JSON for a render (media served through the Worker from R2, falling back to the render server URL). */
export function renderView(r: RenderRow | null) {
  if (!r) return null;
  const media = (key: string | null, file: string, remote: string | null) => key ? `/api/studio/media/${r.id}/${file}` : remote;
  return {
    id: r.id, status: r.status, progress: r.progress, stage: r.stage, error: r.error, quality: r.quality,
    duration: r.duration, width: r.width, height: r.height, createdAt: r.created_at, finishedAt: r.finished_at,
    videoUrl: r.status === "done" ? media(r.video_key, "video.mp4", r.remote_video_url) : null,
    thumbUrl: r.status === "done" ? media(r.thumb_key, "thumbnail.jpg", r.remote_thumb_url) : null,
    contactUrl: r.status === "done" && r.contact_key ? `/api/studio/media/${r.id}/contact.png` : null,
    shareUrl: r.share_slug ? `/api/studio/s/${r.share_slug}.mp4` : null,
  };
}
