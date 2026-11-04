import { api } from "@web/api";
import type { Format, Lang, SbError, Storyboard, TemplateDef } from "../../../../worker/lib/studio/storyboard";

export type { Format, Lang, SbError, Storyboard, TemplateDef };
export type { FieldDef, Scene, SceneKindDef, FieldValue, Palette } from "../../../../worker/lib/studio/storyboard";

export interface Capabilities { ai: boolean; renderer: boolean }
export interface Catalog { version: number; templates: TemplateDef[]; capabilities: Capabilities }
export interface StatusInfo extends Capabilities { rendererHealth: { ok: boolean; elevenlabs?: boolean; error?: string } }

export interface ProjectSummary {
  id: string; title: string; template: string; style: string; format: Format; lang: Lang; status: string;
  updatedAt: number; scenes: number; seconds: number;
  render: { status: string; progress: number; duration: number | null; thumbUrl: string | null } | null;
}
export interface Project {
  id: string; title: string; template: string; style: string; format: Format; lang: Lang; brief: string;
  status: "draft" | "planning" | "rendering" | "rendered" | "failed"; planSource: "example" | "ai" | "manual";
  planError: string | null; createdAt: number; updatedAt: number; storyboard: Storyboard;
}
export interface Render {
  id: string; status: string; progress: number; stage: string | null; error: string | null; quality: "final" | "draft";
  duration: number | null; width: number | null; height: number | null; createdAt: number; finishedAt: number | null;
  videoUrl: string | null; thumbUrl: string | null; contactUrl: string | null; shareUrl: string | null;
}
export interface ProjectDetail { project: Project; render: Render | null; renders: Render[]; capabilities: Capabilities }

let catalogPromise: Promise<Catalog> | null = null;
export function loadCatalog() {
  catalogPromise ??= api<Catalog>("/studio/catalog").catch((e) => { catalogPromise = null; throw e; });
  return catalogPromise;
}

export const studioApi = {
  status: () => api<StatusInfo>("/studio/status"),
  projects: () => api<{ projects: ProjectSummary[] }>("/studio/projects"),
  create: (body: { template: string; style: string; format: Format; lang: Lang; brief: string }) =>
    api<Project>("/studio/projects", { method: "POST", json: body }),
  get: (id: string) => api<ProjectDetail>(`/studio/projects/${id}`),
  patch: (id: string, body: Partial<{ title: string; brief: string; storyboard: Storyboard }>) =>
    api<{ project: Project; errors: SbError[] }>(`/studio/projects/${id}`, { method: "PATCH", json: body }),
  remove: (id: string) => api<{ ok: true }>(`/studio/projects/${id}`, { method: "DELETE" }),
  plan: (id: string, brief: string) => api<{ ok: true }>(`/studio/projects/${id}/plan`, { method: "POST", json: { brief } }),
  share: (id: string, renderId: string) => api<{ render: Render }>(`/studio/projects/${id}/share`, { method: "POST", json: { renderId } }),
  unshare: (id: string, renderId: string) => api<{ render: Render }>(`/studio/projects/${id}/share?renderId=${encodeURIComponent(renderId)}`, { method: "DELETE" }),
  render: (id: string, quality: "final" | "draft") =>
    api<{ ok: true; render: Render }>(`/studio/projects/${id}/render`, { method: "POST", json: { quality } }),
};

/** Error code from our api() helper's "409 {json}" messages. */
export function errorCode(e: unknown): string | null {
  const m = /^\d{3} (.*)$/s.exec(String((e as Error)?.message ?? ""));
  try { return m ? (JSON.parse(m[1]).error as string) : null; } catch { return null; }
}
