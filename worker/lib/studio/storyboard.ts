/**
 * Storyboard contract shared with the render server (render-server/API.md) and the web Studio.
 * The template catalog is generated from Python (`python -m flowleaf_render.cli catalog`) so there is exactly one
 * source of truth; this file mirrors the server's validation so we can reject bad plans before a render.
 */
import catalogJson from "./catalog.generated.json";

export type Lang = "en" | "ru";
export type Format = "9x16" | "1x1" | "16x9";
export type Music = "calm" | "uplift" | "drive" | "focus" | "none";
export type Transition = "wipe" | "fade" | "cut";
export type L10n = { en: string; ru: string };

export interface FieldDef {
  key: string;
  type: "text" | "textarea" | "list" | "code" | "number" | "select" | "lines" | "image" | "video";
  label: L10n;
  required: boolean;
  maxLen?: number;
  maxItems?: number;
  minItems?: number;
  options?: { value: string; label: L10n }[];
  min?: number | null;
  max?: number | null;
  maxLines?: number;
  help?: L10n;
  default?: unknown;
}
export interface SceneKindDef {
  kind: string;
  label: L10n;
  fields: FieldDef[];
  duration: { default: number; min: number; max: number };
  hint: string;
}
export interface Palette {
  id: string; bg: string; bg2: string; surface: string; fg: string; muted: string; accent: string; accent2: string;
  on_accent: string; line: string; dark: boolean; code_bg: string; syntax: string[];
}
export interface TemplateDef {
  id: string;
  name: L10n;
  description: L10n;
  category: string;
  styles: { id: string; name: L10n; palette: Palette }[];
  formats: Format[];
  fields: FieldDef[];
  sceneKinds: SceneKindDef[];
  minScenes: number;
  maxScenes: number;
  defaults: { style: string; music: Music; transition: Transition };
  aiNotes: string;
  examples: Record<Lang, Storyboard>;
}
export type FieldValue = string | number | string[];
export interface Scene { kind: string; duration: number; voiceover: string; fields: Record<string, FieldValue> }
export interface Storyboard {
  template: string;
  style: string;
  format: Format;
  lang: Lang;
  title: string;
  fields: Record<string, FieldValue>;
  scenes: Scene[];
  music: Music;
  voiceover: boolean;
  /** Optional ElevenLabs voice id (from /api/studio/voices); empty = the render server's default voice. */
  voice?: string;
  captions: boolean;
  transition: Transition;
}
export interface SbError { path: string; code: string; message: string; soft?: boolean }

export const catalog = catalogJson as unknown as { version: number; templates: TemplateDef[] };
export const FORMATS: Format[] = ["9x16", "1x1", "16x9"];
export const MUSIC: Music[] = ["calm", "uplift", "drive", "focus", "none"];
const TRANSITIONS: Transition[] = ["wipe", "fade", "cut"];

export function getTemplate(id: string): TemplateDef | undefined {
  return catalog.templates.find((t) => t.id === id);
}

export function parseLines(spec: unknown): number[] {
  const out = new Set<number>();
  for (const part of String(spec ?? "").trim().split(/[,\s]+/)) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) continue;
    const a = +m[1], b = +(m[2] ?? m[1]);
    const lo = Math.min(a, b), hi = Math.min(Math.max(a, b), lo + 60);
    for (let x = lo; x <= hi; x++) if (x > 0 && x < 200) out.add(x);
  }
  return [...out].sort((x, y) => x - y);
}

function normText(v: unknown, f: Pick<FieldDef, "type" | "maxLen" | "required">, path: string, errs: SbError[], multiline: boolean): string {
  if (v == null) v = "";
  if (typeof v === "number") v = String(v);
  if (typeof v !== "string") { errs.push({ path, code: "type", message: "expected text" }); return ""; }
  let s = v.replace(/\r\n/g, "\n").replace(/\t/g, f.type === "code" ? "    " : " ");
  if (!multiline) s = s.replace(/\s+/g, " ");
  s = f.type === "code" ? s.replace(/^\n+|\n+$/g, "") : s.trim();
  const max = f.maxLen ?? 120;
  if (s.length > max) { errs.push({ path, code: "too_long", message: `max ${max} characters`, soft: true }); s = s.slice(0, max).trimEnd(); }
  if (f.required && !s) errs.push({ path, code: "required", message: "required" });
  return s;
}

export function normalizeField(f: FieldDef, v: unknown, path: string, errs: SbError[]): FieldValue {
  switch (f.type) {
    case "text": case "textarea":
      return normText(v, f, path, errs, f.type === "textarea");
    case "code": {
      let s = normText(v, f, path, errs, true);
      const lines = s.split("\n"), ml = f.maxLines ?? 16;
      if (lines.length > ml) { errs.push({ path, code: "too_long", message: `max ${ml} lines`, soft: true }); s = lines.slice(0, ml).join("\n"); }
      return s;
    }
    case "image": case "video": {
      // absolute http(s) URL, or one of our own uploaded assets (/api/studio/assets/...), made absolute at render time
      const u = typeof v === "string" ? v.trim() : "";
      if (u && !/^(https?:\/\/|\/api\/studio\/assets\/)/.test(u)) { errs.push({ path, code: "url", message: "image must be an uploaded file or an http(s) URL", soft: true }); return ""; }
      if (u.length > 1900) { errs.push({ path, code: "too_long", message: "image URL too long", soft: true }); return ""; }
      if (f.required && !u) errs.push({ path, code: "required", message: "required" });
      return u;
    }
    case "lines":
      return parseLines(Array.isArray(v) ? v.join(",") : v).join(", ");
    case "number": {
      if (v == null || v === "") {
        if (f.required) { errs.push({ path, code: "required", message: "required" }); return (f.default as number) ?? 0; }
        return (f.default as number) ?? 0;
      }
      const x = Number(String(v).replace(",", ".").replace(/[\s ]/g, ""));
      if (!Number.isFinite(x)) { errs.push({ path, code: "type", message: "expected a number" }); return (f.default as number) ?? 0; }
      let y = x;
      if (f.min != null && y < f.min) y = f.min;
      if (f.max != null && y > f.max) y = f.max;
      return y;
    }
    case "select": {
      const vals = (f.options ?? []).map((o) => o.value);
      if (typeof v === "string" && vals.includes(v)) return v;
      if (v != null && v !== "") errs.push({ path, code: "option", message: `one of ${vals.join(", ")}`, soft: true });
      return (f.default as string) ?? vals[0] ?? "";
    }
    case "list": {
      let arr = v;
      if (typeof arr === "string") arr = arr.split("\n");
      if (arr == null) arr = [];
      if (!Array.isArray(arr)) { errs.push({ path, code: "type", message: "expected a list" }); return []; }
      let out = arr.map((x, i) => normText(x, { type: "text", maxLen: f.maxLen, required: false }, `${path}[${i}]`, errs, false)).filter(Boolean);
      const mx = f.maxItems ?? 6;
      if (out.length > mx) { errs.push({ path, code: "too_many", message: `max ${mx} items`, soft: true }); out = out.slice(0, mx); }
      if (out.length < (f.minItems ?? 0)) errs.push({ path, code: "too_few", message: `at least ${f.minItems} items` });
      return out;
    }
  }
}

const round2 = (x: number) => Math.round(x * 100) / 100;

/** Normalise a storyboard against its template. Soft errors are fixed in the result; hard errors mean "can't render". */
export function validateStoryboard(input: unknown): { storyboard: Storyboard | null; errors: SbError[]; ok: boolean } {
  const errs: SbError[] = [];
  const sb = (input && typeof input === "object" ? input : {}) as Record<string, any>;
  const T = getTemplate(sb.template);
  if (!T) return { storyboard: null, errors: [{ path: "template", code: "unknown", message: `unknown template ${JSON.stringify(sb.template)}` }], ok: false };
  const styles = T.styles.map((s) => s.id);
  const style = styles.includes(sb.style) ? sb.style : T.defaults.style;
  if (sb.style != null && sb.style !== style) errs.push({ path: "style", code: "option", message: `one of ${styles.join(", ")}`, soft: true });
  const format: Format = FORMATS.includes(sb.format) ? sb.format : "9x16";
  if (sb.format != null && sb.format !== format) errs.push({ path: "format", code: "option", message: `one of ${FORMATS.join(", ")}`, soft: true });
  const gf = sb.fields && typeof sb.fields === "object" && !Array.isArray(sb.fields) ? sb.fields : {};
  const out: Storyboard = {
    template: T.id, style, format,
    lang: sb.lang === "ru" ? "ru" : "en",
    title: normText(sb.title ?? "", { type: "text", maxLen: 120, required: false }, "title", errs, false),
    music: MUSIC.includes(sb.music) ? sb.music : T.defaults.music,
    transition: TRANSITIONS.includes(sb.transition) ? sb.transition : T.defaults.transition,
    voiceover: sb.voiceover === undefined ? true : !!sb.voiceover,
    voice: typeof sb.voice === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(sb.voice) ? sb.voice : "",
    captions: sb.captions === undefined ? true : !!sb.captions,
    fields: Object.fromEntries(T.fields.map((f) => [f.key, normalizeField(f, gf[f.key] ?? f.default, `fields.${f.key}`, errs)])),
    scenes: [],
  };
  let scenes: unknown[] = Array.isArray(sb.scenes) ? sb.scenes : [];
  if (!scenes.length) errs.push({ path: "scenes", code: "required", message: "at least one scene" });
  if (scenes.length > T.maxScenes) { errs.push({ path: "scenes", code: "too_many", message: `max ${T.maxScenes} scenes`, soft: true }); scenes = scenes.slice(0, T.maxScenes); }
  if (scenes.length && scenes.length < T.minScenes) errs.push({ path: "scenes", code: "too_few", message: `at least ${T.minScenes} scenes` });
  scenes.forEach((raw, i) => {
    const p = `scenes[${i}]`;
    if (!raw || typeof raw !== "object") { errs.push({ path: p, code: "type", message: "scene must be an object" }); return; }
    const sc = raw as Record<string, any>;
    const K = T.sceneKinds.find((k) => k.kind === sc.kind);
    if (!K) { errs.push({ path: `${p}.kind`, code: "unknown", message: `unknown scene kind ${JSON.stringify(sc.kind)}; one of ${T.sceneKinds.map((k) => k.kind).join(", ")}` }); return; }
    let dur = Number(sc.duration ?? K.duration.default);
    if (!Number.isFinite(dur)) dur = K.duration.default;
    dur = round2(Math.min(K.duration.max, Math.max(K.duration.min, dur)));
    const sf = sc.fields && typeof sc.fields === "object" ? sc.fields : {};
    out.scenes.push({
      kind: K.kind, duration: dur,
      voiceover: normText(sc.voiceover ?? "", { type: "textarea", maxLen: 260, required: false }, `${p}.voiceover`, errs, true),
      fields: Object.fromEntries(K.fields.map((f) => [f.key, normalizeField(f, sf[f.key] ?? f.default, `${p}.fields.${f.key}`, errs)])),
    });
  });
  const ok = !errs.some((e) => !e.soft);
  return { storyboard: out, errors: errs, ok };
}

export function totalDuration(sb: Pick<Storyboard, "scenes">): number {
  return round2(sb.scenes.reduce((a, s) => a + s.duration, 0));
}

/** A fresh storyboard for a new project: the template's example in that language, with the chosen style/format. */
export function exampleStoryboard(T: TemplateDef, lang: Lang, style?: string, format?: Format): Storyboard {
  const ex = structuredClone(T.examples[lang] ?? T.examples.en);
  const { storyboard } = validateStoryboard({ ...ex, style: style ?? ex.style, format: format ?? ex.format, lang });
  return storyboard!;
}

/** An empty scene of a kind, with defaults. */
export function blankScene(T: TemplateDef, kind: string): Scene {
  const K = T.sceneKinds.find((k) => k.kind === kind) ?? T.sceneKinds[0];
  const errs: SbError[] = [];
  return {
    kind: K.kind, duration: K.duration.default, voiceover: "",
    fields: Object.fromEntries(K.fields.map((f) => [f.key, normalizeField({ ...f, required: false }, f.default, "", errs)])),
  };
}
