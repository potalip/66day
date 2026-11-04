/**
 * "Plan with AI": Claude turns a brief into a storyboard for one template. Output is validated with the same rules
 * the render server uses; one repair round-trip on hard errors; never throws for bad model output.
 */
import type { Env } from "../../env";
import { claude } from "../claude";
import { type Lang, type SbError, type Storyboard, type TemplateDef, validateStoryboard } from "./storyboard";

export interface PlanInput {
  template: TemplateDef;
  lang: Lang;
  style: string;
  format: string;
  brief: string;
  handle?: string;
  current?: Storyboard;          // the project's current storyboard (to keep the student's manual edits as context)
}

export type PlanResult =
  | { ok: true; storyboard: Storyboard; warnings: SbError[] }
  | { ok: false; reason: "ai_not_configured" | "bad_output" | "api_error"; message: string };

function describeFields(fields: TemplateDef["fields"]): string {
  return fields.map((f) => {
    const bits = [`"${f.key}": ${f.type}`];
    if (f.required) bits.push("REQUIRED");
    if (f.maxLen && f.type !== "number" && f.type !== "select") bits.push(`max ${f.maxLen} chars`);
    if (f.type === "list") bits.push(`array of strings, ${f.minItems ?? 0}-${f.maxItems} items`);
    if (f.type === "code") bits.push(`max ${f.maxLines} lines`);
    if (f.type === "number") bits.push(`number ${f.min ?? ""}..${f.max ?? ""}`);
    if (f.type === "select") bits.push(`one of ${(f.options ?? []).map((o) => o.value).join("|")}`);
    if (f.type === "lines") bits.push(`line numbers like "2, 4-5"`);
    return `    - ${bits.join(", ")} — ${f.label.en}`;
  }).join("\n");
}

export function buildPrompt(p: PlanInput): { system: string; prompt: string } {
  const T = p.template;
  const ru = p.lang === "ru";
  const kinds = T.sceneKinds.map((k) =>
    `  * kind "${k.kind}" (${k.label.en}; ${k.duration.min}-${k.duration.max}s, default ${k.duration.default}s). ${k.hint}\n${describeFields(k.fields)}`,
  ).join("\n");
  const system = [
    "You are the scriptwriter and motion designer of FlowLeaf 66 Studio, where beginners make short videos with code and AI.",
    "You turn a creator's brief into a storyboard for ONE fixed animated template. Every scene is rendered as motion graphics",
    "(text, icons, charts, code) — there is no stock footage, so all meaning must live in the on-screen text and the voiceover.",
    "Rules:",
    "- Output ONLY one JSON object, no markdown fences, no commentary.",
    "- Respect every max length — on-screen text must be short; phones are small. Prefer 3-8 words per on-screen line.",
    "- `voiceover` is the spoken line for the scene (also shown as captions). Natural speech, ~2.4 words per second in English,",
    "  ~2 words per second in Russian; it must fit the scene duration. It may add detail the screen text leaves out.",
    "- Total length 15-45 seconds unless the brief asks otherwise. Start strong: the first 2 seconds must hook.",
    "- Never invent statistics, quotes or facts. Use numbers only from the brief or clearly label them as examples.",
    ru
      ? "- Language: Russian, written natively (not translated), informal «ты», lively and concrete. Code identifiers stay in English."
      : "- Language: English, plain and concrete, friendly, no hype words.",
  ].join("\n");
  const example = JSON.stringify(T.examples[p.lang] ?? T.examples.en);
  const prompt = [
    `TEMPLATE "${T.id}" — ${T.name.en}: ${T.description.en}`,
    `Notes: ${T.aiNotes}`,
    `Scenes: ${T.minScenes}-${T.maxScenes}. Allowed scene kinds:`,
    kinds,
    T.fields.length ? `Template-level "fields":\n${describeFields(T.fields)}` : "",
    "",
    "STORYBOARD JSON SHAPE:",
    `{"template":"${T.id}","style":"${p.style}","format":"${p.format}","lang":"${p.lang}","title":"short project title",` +
      `"fields":{...},"scenes":[{"kind":"...","duration":3.5,"voiceover":"...","fields":{...}}],` +
      `"music":"calm|uplift|drive|focus|none","voiceover":true,"captions":true,"transition":"wipe|fade|cut"}`,
    "",
    "A GOOD EXAMPLE for this template (different topic — do not copy its content):",
    example,
    "",
    p.current ? `The creator's current draft (keep what still fits the brief, improve the rest):\n${JSON.stringify(p.current)}\n` : "",
    p.handle ? `Creator handle: ${p.handle}` : "",
    `Video language: ${ru ? "Russian" : "English"}. Style: ${p.style}. Format: ${p.format}.`,
    "",
    "BRIEF FROM THE CREATOR:",
    p.brief.trim() || "(empty — make a strong video about building a daily habit of creating with AI)",
  ].filter((x) => x !== "").join("\n");
  return { system, prompt };
}

/** Pull the first balanced JSON object out of model text (tolerates ```json fences and chatter). */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) {
      try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; }
    }
  }
  return null;
}

/** Validate model output and pin the choices the student made in the UI. */
export function acceptPlan(raw: unknown, p: Pick<PlanInput, "template" | "lang" | "style" | "format" | "handle">) {
  if (!raw || typeof raw !== "object") return { ok: false as const, errors: [{ path: "", code: "json", message: "not a JSON object" }] };
  const sb: Record<string, unknown> = { ...(raw as Record<string, unknown>), template: p.template.id, lang: p.lang, style: p.style, format: p.format };
  const fields = { ...((sb.fields as Record<string, unknown>) ?? {}) };
  if (p.handle && !fields.handle) fields.handle = p.handle;
  sb.fields = fields;
  const v = validateStoryboard(sb);
  return v.ok ? { ok: true as const, storyboard: v.storyboard!, warnings: v.errors } : { ok: false as const, errors: v.errors };
}

export async function planStoryboard(env: Env, p: PlanInput): Promise<PlanResult> {
  if (!env.ANTHROPIC_API_KEY) return { ok: false, reason: "ai_not_configured", message: "ANTHROPIC_API_KEY is not set" };
  const { system, prompt } = buildPrompt(p);
  let text: string | null;
  try {
    text = await claude(env, { system, prompt, maxTokens: 4000 });
  } catch (e) {
    return { ok: false, reason: "api_error", message: String(e).slice(0, 300) };
  }
  let res = acceptPlan(extractJson(text ?? ""), p);
  if (res.ok) return res;
  // one repair round-trip with the validator's complaints
  try {
    const fix = await claude(env, {
      system,
      prompt: `${prompt}\n\nYour previous answer:\n${text}\n\nIt failed validation:\n${res.errors.filter((e) => !e.soft).map((e) => `- ${e.path}: ${e.message}`).join("\n")}\nReturn the corrected JSON only.`,
      maxTokens: 4000,
    });
    res = acceptPlan(extractJson(fix ?? ""), p);
    if (res.ok) return res;
  } catch (e) {
    return { ok: false, reason: "api_error", message: String(e).slice(0, 300) };
  }
  return { ok: false, reason: "bad_output", message: res.errors.slice(0, 4).map((e) => `${e.path}: ${e.message}`).join("; ") };
}
