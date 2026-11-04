import { z } from "zod";

/**
 * Library contracts (worker + web). OWNER: library agent.
 * Lesson material is generated separately per language (RU and EN are adaptations, not translations).
 */
export const LANGS = ["ru", "en"] as const;
export type LibLang = (typeof LANGS)[number];
export const SOURCE_TYPES = ["youtube", "instagram", "link", "upload"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];
export const TRACKS = ["common", "apps", "video"] as const;
export type LibTrack = (typeof TRACKS)[number];
export const STATUSES = ["draft", "processing", "review", "published", "failed"] as const;
export type ResourceStatus = (typeof STATUSES)[number];

/** Topic vocabulary. Labels live in web/src/features/library/strings.ts. Unknown topics are allowed but discouraged. */
export const TOPICS = [
  "claude-code", "prompting", "llm-basics", "agents", "apis", "web-basics", "git", "deploy",
  "python", "motion-graphics", "remotion", "ffmpeg", "ai-video", "workflow", "career",
] as const;
export type Topic = (typeof TOPICS)[number];

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const quizItemSchema = z
  .object({
    q: trimmed(300),
    options: z.array(trimmed(200)).min(2).max(5),
    answer: z.number().int().min(0),
    explain: z.string().trim().max(500).default(""),
  })
  .refine((v) => v.answer < v.options.length, { message: "answer index out of range", path: ["answer"] });

export const suggestedDaySchema = z.object({
  day: z.number().int().min(1).max(66),
  track: z.enum(TRACKS),
  reason: z.string().trim().max(240).default(""),
});

export const lessonMaterialSchema = z.object({
  /** Title adapted for this audience (may differ from the original). */
  title: trimmed(160),
  /** One line: why this is worth the student's time. */
  hook: trimmed(240),
  /** 1–4 short paragraphs, plain text separated by blank lines. */
  summary: trimmed(2400),
  takeaways: z.array(trimmed(300)).min(2).max(8),
  steps: z.array(z.object({ title: trimmed(140), detail: z.string().trim().max(700).default("") })).min(1).max(10),
  exercise: z.object({
    title: trimmed(140),
    goal: trimmed(400),
    instructions: z.array(trimmed(400)).min(1).max(8),
    proof: z.enum(["none", "link", "text", "file"]).default("text"),
    estMinutes: z.number().int().min(5).max(240).default(30),
  }),
  quiz: z.array(quizItemSchema).min(2).max(6),
  suggestedDays: z.array(suggestedDaySchema).max(4).default([]),
  tracks: z.array(z.enum(TRACKS)).min(1).max(3),
  topics: z.array(z.string().trim().min(1).max(40)).max(6).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  level: z.enum(LEVELS),
  /** Minutes to watch/read + do the exercise. */
  estMinutes: z.number().int().min(1).max(600),
});
export type LessonMaterial = z.infer<typeof lessonMaterialSchema>;
export type QuizItem = z.infer<typeof quizItemSchema>;
export type SuggestedDay = z.infer<typeof suggestedDaySchema>;

/** Fields the founder can edit on a resource. */
export const resourcePatchSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  author: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  thumbnailUrl: z.string().trim().url().max(1000).nullable().optional().or(z.literal("").transform(() => null)),
  durationSec: z.number().int().min(0).max(60 * 60 * 24).nullable().optional(),
  tracks: z.array(z.enum(TRACKS)).max(3).optional(),
  topics: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  level: z.enum(LEVELS).optional(),
  origLang: z.enum(["ru", "en", "other"]).optional(),
  audience: z.array(z.enum(LANGS)).min(1).max(2).optional(),
  suggestedDays: z.array(suggestedDaySchema).max(6).optional(),
  featured: z.boolean().optional(),
  adminNotes: z.string().max(4000).nullable().optional(),
});
export type ResourcePatch = z.infer<typeof resourcePatchSchema>;

/** Pull a JSON object out of an LLM reply (handles ```json fences and chatter around it). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object found in reply");
  return JSON.parse(body.slice(start, end + 1));
}

/** Parse + validate an LLM reply into LessonMaterial. Returns a readable error list on failure. */
export function parseMaterial(text: string): { ok: true; data: LessonMaterial } | { ok: false; error: string } {
  let raw: unknown;
  try { raw = extractJson(text); } catch (e) { return { ok: false, error: `invalid JSON: ${(e as Error).message}` }; }
  const res = lessonMaterialSchema.safeParse(raw);
  if (res.success) return { ok: true, data: res.data };
  return { ok: false, error: res.error.issues.slice(0, 12).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ") };
}

export function safeJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
