import type { Env } from "../../env";
import {
  type LessonMaterial, type LibLang, type ResourceStatus, type SourceType, type Level, type LibTrack, type SuggestedDay, safeJson,
} from "./schema";

export interface ResourceRow {
  id: string; source_type: SourceType; url: string | null; canonical_url: string | null; external_id: string | null;
  title: string; author: string | null; author_url: string | null; description: string | null; duration_sec: number | null;
  thumbnail_url: string | null; tracks: string; topics: string; level: Level; orig_lang: string; audience: string;
  suggested_days: string; status: ResourceStatus; transcript_state: string; ai_state: string; last_error: string | null;
  admin_notes: string | null; featured: number; sort_weight: number; created_by: string | null;
  created_at: number; updated_at: number; published_at: number | null;
}

export interface Resource {
  id: string; sourceType: SourceType; url: string | null; canonicalUrl: string | null; externalId: string | null;
  title: string; author: string | null; authorUrl: string | null; description: string | null; durationSec: number | null;
  thumbnailUrl: string | null; tracks: LibTrack[]; topics: string[]; level: Level; origLang: string; audience: LibLang[];
  suggestedDays: SuggestedDay[]; status: ResourceStatus;
  transcriptState: "none" | "fetching" | "ready" | "needed" | "not_applicable";
  aiState: "idle" | "queued" | "generating" | "ready" | "partial" | "failed" | "not_configured";
  lastError: string | null; adminNotes: string | null; featured: boolean;
  createdAt: number; updatedAt: number; publishedAt: number | null;
}

export type MaterialState = "empty" | "queued" | "generating" | "ready" | "failed" | "not_configured";
export interface MaterialRecord {
  lang: LibLang; state: MaterialState; data: LessonMaterial | null; origin: "ai" | "fixture" | "manual" | null;
  model: string | null; edited: boolean; error: string | null; updatedAt: number;
}

export interface PipelineEvent { id: number; step: string; status: "info" | "ok" | "warn" | "error"; message: string | null; createdAt: number }

export function toResource(r: ResourceRow): Resource {
  return {
    id: r.id, sourceType: r.source_type, url: r.url, canonicalUrl: r.canonical_url, externalId: r.external_id,
    title: r.title, author: r.author, authorUrl: r.author_url, description: r.description, durationSec: r.duration_sec,
    thumbnailUrl: r.thumbnail_url, tracks: safeJson(r.tracks, []), topics: safeJson(r.topics, []), level: r.level,
    origLang: r.orig_lang, audience: safeJson(r.audience, ["ru", "en"]), suggestedDays: safeJson(r.suggested_days, []),
    status: r.status, transcriptState: r.transcript_state as Resource["transcriptState"], aiState: r.ai_state as Resource["aiState"],
    lastError: r.last_error, adminNotes: r.admin_notes, featured: !!r.featured,
    createdAt: r.created_at, updatedAt: r.updated_at, publishedAt: r.published_at,
  };
}

export function newId(prefix = "r"): string {
  const a = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `${prefix}_${[...bytes].map((b) => a[b % a.length]).join("")}`;
}

export async function getResourceRow(env: Env, id: string) {
  return env.DB.prepare("SELECT * FROM lib_resources WHERE id = ?").bind(id).first<ResourceRow>();
}

export async function updateResource(env: Env, id: string, fields: Partial<Record<keyof ResourceRow, unknown>>) {
  const keys = Object.keys(fields).filter((k) => (fields as Record<string, unknown>)[k] !== undefined);
  if (!keys.length) return;
  const sql = `UPDATE lib_resources SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = unixepoch() WHERE id = ?`;
  await env.DB.prepare(sql).bind(...keys.map((k) => (fields as Record<string, unknown>)[k] ?? null), id).run();
}

export async function logEvent(env: Env, resourceId: string, step: string, status: PipelineEvent["status"], message?: string) {
  await env.DB.prepare("INSERT INTO lib_events (resource_id, step, status, message) VALUES (?, ?, ?, ?)")
    .bind(resourceId, step, status, message?.slice(0, 2000) ?? null).run();
}

export async function getEvents(env: Env, resourceId: string, limit = 50): Promise<PipelineEvent[]> {
  const { results } = await env.DB.prepare("SELECT id, step, status, message, created_at FROM lib_events WHERE resource_id = ? ORDER BY id DESC LIMIT ?")
    .bind(resourceId, limit).all<{ id: number; step: string; status: PipelineEvent["status"]; message: string | null; created_at: number }>();
  return results.map((e) => ({ id: e.id, step: e.step, status: e.status, message: e.message, createdAt: e.created_at }));
}

interface MaterialRow { resource_id: string; lang: LibLang; state: MaterialState; data: string | null; origin: MaterialRecord["origin"]; model: string | null; edited: number; error: string | null; updated_at: number }
const toMaterial = (m: MaterialRow): MaterialRecord => ({
  lang: m.lang, state: m.state, data: safeJson<LessonMaterial | null>(m.data, null), origin: m.origin, model: m.model,
  edited: !!m.edited, error: m.error, updatedAt: m.updated_at,
});

export async function getMaterials(env: Env, resourceId: string): Promise<Partial<Record<LibLang, MaterialRecord>>> {
  const { results } = await env.DB.prepare("SELECT * FROM lib_materials WHERE resource_id = ?").bind(resourceId).all<MaterialRow>();
  return Object.fromEntries(results.map((m) => [m.lang, toMaterial(m)]));
}

export async function setMaterial(
  env: Env, resourceId: string, lang: LibLang,
  f: { state: MaterialState; data?: LessonMaterial | null; origin?: MaterialRecord["origin"]; model?: string | null; edited?: boolean; error?: string | null },
) {
  await env.DB.prepare(
    `INSERT INTO lib_materials (resource_id, lang, state, data, origin, model, edited, error, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, unixepoch())
     ON CONFLICT (resource_id, lang) DO UPDATE SET state = ?3,
       data = CASE WHEN ?9 THEN ?4 ELSE data END,
       origin = COALESCE(?5, origin), model = COALESCE(?6, model), edited = COALESCE(?10, edited), error = ?8, updated_at = unixepoch()`,
  ).bind(
    resourceId, lang, f.state, f.data === undefined ? null : f.data === null ? null : JSON.stringify(f.data),
    f.origin ?? null, f.model ?? null, f.edited ? 1 : 0, f.error ?? null, f.data !== undefined ? 1 : 0,
    f.edited === undefined ? null : f.edited ? 1 : 0,
  ).run();
}

export async function getTranscript(env: Env, resourceId: string) {
  return env.DB.prepare("SELECT source, lang, text, r2_key, chars, created_at FROM lib_transcripts WHERE resource_id = ?")
    .bind(resourceId).first<{ source: string; lang: string | null; text: string; r2_key: string | null; chars: number; created_at: number }>();
}

export async function saveTranscript(env: Env, resourceId: string, t: { source: string; lang?: string | null; text: string; r2Key?: string | null }) {
  const text = t.text.slice(0, 400_000);
  await env.DB.prepare(
    `INSERT INTO lib_transcripts (resource_id, source, lang, text, r2_key, chars) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (resource_id) DO UPDATE SET source = excluded.source, lang = excluded.lang, text = excluded.text,
       r2_key = COALESCE(excluded.r2_key, r2_key), chars = excluded.chars, created_at = unixepoch()`,
  ).bind(resourceId, t.source, t.lang ?? null, text, t.r2Key ?? null, text.length).run();
  await updateResource(env, resourceId, { transcript_state: "ready" });
}

/**
 * SQL predicate (alias m) for "students may see this lesson": approved content that is not a starter draft.
 * A lesson being regenerated (queued/generating) or whose regeneration failed keeps showing its last good version.
 */
export const STUDENT_VISIBLE_MATERIAL = `m.data IS NOT NULL AND m.state IN ('ready','queued','generating','failed') AND NOT (m.origin = 'manual' AND m.edited = 0)`;
