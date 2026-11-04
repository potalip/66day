import { Hono, type Context } from "hono";
import type { AppEnv, Env, JobMessage } from "../env";
import {
  ACTIVE, type ProjectRow, type RenderRow, applyJob, getProject, getRender, newId, renderServerHealth, renderView,
  rendererConfigured, runPlan, startRender, submitRender, syncRender,
} from "../lib/studio/service";
import { FORMATS, type Format, type Lang, catalog, exampleStoryboard, getTemplate, validateStoryboard } from "../lib/studio/storyboard";

// OWNER: studio agent (see docs/OWNERSHIP.md). API contract for the web Studio; render server contract: render-server/API.md
export const studio = new Hono<AppEnv>();
type C = Context<AppEnv>;

studio.get("/health", (c) => c.json({ ok: true, area: "studio" }));

/** Queue a job; if the queue isn't available (e.g. some local setups), run it in the background instead. */
async function dispatch(c: C, msg: JobMessage, run: () => Promise<void>) {
  try {
    await c.env.JOBS.send(msg);
  } catch (e) {
    console.warn("queue unavailable, running inline", e);
    c.executionCtx.waitUntil(run().catch((err) => console.error(msg.kind, err)));
  }
}

const caps = (env: Env) => ({ ai: !!env.ANTHROPIC_API_KEY, renderer: rendererConfigured(env) });

studio.get("/catalog", (c) => {
  c.header("cache-control", "public, max-age=300");
  return c.json({ ...catalog, capabilities: caps(c.env) });
});

studio.get("/status", async (c) => c.json({ ...caps(c.env), rendererHealth: await renderServerHealth(c.env) }));

async function ownProject(c: C): Promise<ProjectRow | null> {
  const p = await getProject(c.env, c.req.param("id")!);
  return p && p.user_id === c.get("userId") ? p : null;
}

function projectView(p: ProjectRow) {
  return {
    id: p.id, title: p.title, template: p.template, style: p.style, format: p.format, lang: p.lang, brief: p.brief,
    status: p.status, planSource: p.plan_source, planError: p.plan_error, createdAt: p.created_at, updatedAt: p.updated_at,
    storyboard: JSON.parse(p.storyboard),
  };
}

studio.get("/projects", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, r.status AS r_status, r.progress AS r_progress, r.thumb_key AS r_thumb_key, r.remote_thumb_url AS r_thumb_url, r.id AS r_id, r.duration AS r_duration
     FROM studio_projects p LEFT JOIN studio_renders r ON r.id = p.current_render_id
     WHERE p.user_id = ? ORDER BY p.updated_at DESC LIMIT 100`,
  ).bind(c.get("userId")).all<ProjectRow & { r_status: string | null; r_progress: number | null; r_thumb_key: string | null; r_thumb_url: string | null; r_id: string | null; r_duration: number | null }>();
  return c.json({
    projects: results.map((p) => {
      const sb = JSON.parse(p.storyboard);
      return {
        id: p.id, title: p.title, template: p.template, style: p.style, format: p.format, lang: p.lang, status: p.status,
        updatedAt: p.updated_at, scenes: sb.scenes?.length ?? 0,
        seconds: Math.round((sb.scenes ?? []).reduce((a: number, s: { duration: number }) => a + s.duration, 0)),
        render: p.r_id ? {
          status: p.r_status, progress: p.r_progress, duration: p.r_duration,
          thumbUrl: p.r_status === "done" ? (p.r_thumb_key ? `/api/studio/media/${p.r_id}/thumbnail.jpg` : p.r_thumb_url) : null,
        } : null,
      };
    }),
  });
});

studio.post("/projects", async (c) => {
  const body = await c.req.json<{ template?: string; style?: string; format?: Format; lang?: Lang; brief?: string; title?: string }>().catch(() => ({} as never));
  const T = getTemplate(body.template ?? "");
  if (!T) return c.json({ error: "unknown_template" }, 400);
  const lang: Lang = body.lang === "ru" ? "ru" : "en";
  const style = T.styles.some((s) => s.id === body.style) ? body.style! : T.defaults.style;
  const format: Format = FORMATS.includes(body.format as Format) ? body.format! : "9x16";
  const sb = exampleStoryboard(T, lang, style, format);
  const id = newId("prj");
  const brief = (body.brief ?? "").slice(0, 2000);
  const title = (body.title ?? "").trim().slice(0, 120) || (brief ? brief.split(/[.!?\n]/)[0].slice(0, 80) : sb.title);
  sb.title = title;
  await c.env.DB.prepare(
    "INSERT INTO studio_projects (id, user_id, title, template, style, format, lang, brief, storyboard) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(id, c.get("userId"), title, T.id, style, format, lang, brief, JSON.stringify(sb)).run();
  return c.json(projectView((await getProject(c.env, id))!), 201);
});

studio.get("/projects/:id", async (c) => {
  const p = await ownProject(c);
  if (!p) return c.json({ error: "not_found" }, 404);
  let current: RenderRow | null = p.current_render_id ? await getRender(c.env, p.current_render_id) : null;
  if (current && ["queued", "submitted", "rendering"].includes(current.status)) current = await syncRender(c.env, current);
  const fresh = (await getProject(c.env, p.id))!;
  const { results } = await c.env.DB.prepare("SELECT * FROM studio_renders WHERE project_id = ? ORDER BY created_at DESC LIMIT 10")
    .bind(p.id).all<RenderRow>();
  return c.json({
    project: projectView(fresh), render: renderView(current), renders: results.map(renderView), capabilities: caps(c.env),
  });
});

studio.patch("/projects/:id", async (c) => {
  const p = await ownProject(c);
  if (!p) return c.json({ error: "not_found" }, 404);
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
  const sets: string[] = [], vals: unknown[] = [];
  const T = getTemplate(p.template)!;
  let sb = JSON.parse(p.storyboard);
  let sbChanged = false;
  if (body.storyboard && typeof body.storyboard === "object") { sb = body.storyboard; sbChanged = true; }
  if (typeof body.title === "string") { sets.push("title = ?"); vals.push(body.title.trim().slice(0, 120)); sb.title = body.title.trim().slice(0, 120); sbChanged = true; }
  if (typeof body.brief === "string") { sets.push("brief = ?"); vals.push(body.brief.slice(0, 2000)); }
  for (const k of ["style", "format", "lang"] as const) {
    if (typeof body[k] === "string") { sb[k] = body[k]; sbChanged = true; }
  }
  let warnings: unknown[] = [];
  if (sbChanged) {
    sb.template = T.id;
    const v = validateStoryboard(sb);
    if (!v.storyboard) return c.json({ error: "invalid_storyboard", errors: v.errors }, 422);
    warnings = v.errors;
    sets.push("storyboard = ?", "style = ?", "format = ?", "lang = ?");
    vals.push(JSON.stringify(v.storyboard), v.storyboard.style, v.storyboard.format, v.storyboard.lang);
    if (body.storyboard) sets.push("plan_source = 'manual'");
  }
  if (!sets.length) return c.json({ project: projectView(p), errors: [] });
  if (p.status === "failed" || p.status === "rendered") sets.push("status = 'draft'");
  await c.env.DB.prepare(`UPDATE studio_projects SET ${sets.join(", ")}, updated_at = unixepoch() WHERE id = ?`).bind(...vals, p.id).run();
  return c.json({ project: projectView((await getProject(c.env, p.id))!), errors: warnings });
});

studio.delete("/projects/:id", async (c) => {
  const p = await ownProject(c);
  if (!p) return c.json({ error: "not_found" }, 404);
  const { results } = await c.env.DB.prepare("SELECT video_key, thumb_key, contact_key FROM studio_renders WHERE project_id = ?").bind(p.id).all<RenderRow>();
  const keys = results.flatMap((r) => [r.video_key, r.thumb_key, r.contact_key]).filter(Boolean) as string[];
  const assets = await c.env.MEDIA.list({ prefix: `studio/assets/${p.id}/` }).catch(() => null);
  keys.push(...(assets?.objects.map((o) => o.key) ?? []));
  if (keys.length) c.executionCtx.waitUntil(c.env.MEDIA.delete(keys).catch(() => undefined));
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM studio_renders WHERE project_id = ?").bind(p.id),
    c.env.DB.prepare("DELETE FROM studio_projects WHERE id = ?").bind(p.id),
  ]);
  return c.json({ ok: true });
});

studio.post("/projects/:id/plan", async (c) => {
  const p = await ownProject(c);
  if (!p) return c.json({ error: "not_found" }, 404);
  if (!c.env.ANTHROPIC_API_KEY) return c.json({ error: "ai_not_configured" }, 409);
  if (p.status === "planning") return c.json({ ok: true, status: "planning" }, 202);
  const body = await c.req.json<{ brief?: string }>().catch(() => ({} as { brief?: string }));
  if (typeof body.brief === "string") {
    await c.env.DB.prepare("UPDATE studio_projects SET brief = ? WHERE id = ?").bind(body.brief.slice(0, 2000), p.id).run();
  }
  await c.env.DB.prepare("UPDATE studio_projects SET status = 'planning', plan_error = NULL, updated_at = unixepoch() WHERE id = ?").bind(p.id).run();
  await dispatch(c, { kind: "studio.plan", projectId: p.id }, () => runPlan(c.env, p.id));
  return c.json({ ok: true, status: "planning" }, 202);
});

studio.post("/projects/:id/render", async (c) => {
  const p = await ownProject(c);
  if (!p) return c.json({ error: "not_found" }, 404);
  if (!rendererConfigured(c.env)) return c.json({ error: "renderer_not_configured" }, 409);
  if (p.status === "planning") return c.json({ error: "busy_planning" }, 409);
  if (p.current_render_id) {
    const r = await getRender(c.env, p.current_render_id);
    if (r && ACTIVE.includes(r.status)) return c.json({ error: "already_rendering", render: renderView(r) }, 409);
  }
  const body = await c.req.json<{ quality?: string }>().catch(() => ({} as { quality?: string }));
  const quality = body.quality === "draft" ? "draft" : "final";
  const origin = new URL(c.req.url).origin;
  const res = await startRender(c.env, p, quality, origin);
  if (!res.ok) return c.json({ error: "invalid_storyboard", errors: res.errors }, 422);
  await dispatch(c, { kind: "studio.render", projectId: p.id }, () => submitRender(c.env, p.id));
  return c.json({ ok: true, render: renderView(await getRender(c.env, res.renderId)) }, 202);
});

/** Render server → Worker. Authenticated with the shared RENDER_SERVER_TOKEN. */
studio.post("/render-callback", async (c) => {
  const token = (c.req.header("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!c.env.RENDER_SERVER_TOKEN || token !== c.env.RENDER_SERVER_TOKEN) return c.json({ error: "forbidden" }, 403);
  const body = await c.req.json<{ job?: { id: string; external_id?: string } & Record<string, unknown> }>().catch(() => null);
  const job = body?.job;
  if (!job?.id) return c.json({ error: "bad_request" }, 400);
  let r = job.external_id ? await getRender(c.env, job.external_id) : null;
  if (!r) r = await c.env.DB.prepare("SELECT * FROM studio_renders WHERE job_id = ?").bind(job.id).first<RenderRow>();
  if (!r) return c.json({ error: "unknown_job" }, 404);
  if (!r.job_id) await c.env.DB.prepare("UPDATE studio_renders SET job_id = ? WHERE id = ?").bind(job.id, r.id).run();
  await applyJob(c.env, r, job as never);
  return c.json({ ok: true });
});

const IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Upload an image (screenshot) for a project's scenes. Stored in R2; served publicly by unguessable key so the
 *  render server can fetch it. */
studio.post("/projects/:id/assets", async (c) => {
  const p = await ownProject(c);
  if (!p) return c.json({ error: "not_found" }, 404);
  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return c.json({ error: "no_file" }, 400);
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return c.json({ error: "unsupported_type" }, 415);
  if (file.size > 8 * 1024 * 1024) return c.json({ error: "too_large" }, 413);
  const name = `${crypto.randomUUID().replace(/-/g, "")}.${ext}`;
  await c.env.MEDIA.put(`studio/assets/${p.id}/${name}`, file.stream(), { httpMetadata: { contentType: file.type } });
  return c.json({ url: `/api/studio/assets/${p.id}/${name}` }, 201);
});

studio.get("/assets/:pid/:name", async (c) => {
  const name = c.req.param("name");
  if (!/^[a-f0-9]{32}\.(png|jpg|webp)$/.test(name)) return c.json({ error: "not_found" }, 404);
  const obj = await c.env.MEDIA.get(`studio/assets/${c.req.param("pid")}/${name}`);
  if (!obj) return c.json({ error: "not_found" }, 404);
  return new Response(obj.body, { headers: { "content-type": obj.httpMetadata?.contentType ?? "image/png", "cache-control": "public, max-age=31536000, immutable" } });
});

const MEDIA_FILES: Record<string, keyof RenderRow> = { "video.mp4": "video_key", "thumbnail.jpg": "thumb_key", "contact.png": "contact_key" };

/** Finished media from R2, with Range support so <video> can seek. Owner-only. */
studio.get("/media/:renderId/:file", async (c) => {
  const col = MEDIA_FILES[c.req.param("file")];
  const r = col ? await getRender(c.env, c.req.param("renderId")) : null;
  if (!r || r.user_id !== c.get("userId") || !r[col]) return c.json({ error: "not_found" }, 404);
  const key = r[col] as string;
  const range = c.req.header("range");
  const m = range ? /bytes=(\d*)-(\d*)/.exec(range) : null;
  if (m) {
    const head = await c.env.MEDIA.head(key);
    if (!head) return c.json({ error: "not_found" }, 404);
    const size = head.size;
    const start = m[1] ? +m[1] : Math.max(0, size - +m[2]);
    const end = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    const obj = await c.env.MEDIA.get(key, { range: { offset: start, length: end - start + 1 } });
    if (!obj) return c.json({ error: "not_found" }, 404);
    return new Response(obj.body, {
      status: 206,
      headers: {
        "content-type": head.httpMetadata?.contentType ?? "application/octet-stream", "accept-ranges": "bytes",
        "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1), "cache-control": "private, max-age=86400",
      },
    });
  }
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.json({ error: "not_found" }, 404);
  const headers: Record<string, string> = {
    "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream", "accept-ranges": "bytes",
    "content-length": String(obj.size), "cache-control": "private, max-age=86400",
  };
  if (c.req.query("download")) headers["content-disposition"] = `attachment; filename="flowleaf-${r.project_id}-${c.req.param("file")}"`;
  return new Response(obj.body, { headers });
});

// Queue handlers (registered in worker/queue.ts)
export const studioJobs = {
  plan: (env: Env, msg: JobMessage) => (msg.kind === "studio.plan" ? runPlan(env, msg.projectId) : Promise.resolve()),
  render: (env: Env, msg: JobMessage) => (msg.kind === "studio.render" ? submitRender(env, msg.projectId) : Promise.resolve()),
};
