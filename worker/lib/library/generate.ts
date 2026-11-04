import type { Env } from "../../env";
import { claude } from "../claude";
import { type LessonMaterial, type LibLang, parseMaterial, TOPICS } from "./schema";
import type { Resource } from "./repo";

/** Program skeleton shared with the curriculum (docs/SPEC.md). Used so Claude can suggest a sensible day. */
const PROGRAM_OUTLINE = `66-day program, 1–2 hours/day, complete beginners, building WITH AI coding agents (Claude Code and similar) — no no-code tools.
Phase 1 Foundation, days 1–14 (track "common"): what LLMs are, prompting, terminal basics, installing and driving a coding agent, git/GitHub, first tiny web page, first deploy.
Phase 2 Build, days 15–35 (track "apps" or "video"):
  apps — web apps and tools with a coding agent, calling AI model APIs, data, bots, auth basics.
  video — programmatic video with code: motion graphics (Remotion / Python + ffmpeg), kinetic typography, animated explainers, AI-generated clips, captions.
Phase 3 Ship, days 36–56: real users, deploy, polish, a public project per week, shorts/reels for distribution.
Phase 4 Portfolio & earn, days 57–66: capstone shipped publicly, portfolio page, first paid work.
Every 7th day (7, 14, 21…) is a light rest/reflect day; boss (milestone) days around 14, 28, 42, 56, 66.`;

const AUDIENCE: Record<LibLang, string> = {
  en: `Audience: English-speaking beginners worldwide. Write natural, plain modern English — warm, direct, no hype.
Examples and platforms that fit them: X, YouTube, TikTok, Product Hunt, Stripe, Vercel/Cloudflare, GitHub.`,
  ru: `Аудитория: русскоязычные новички (Россия, СНГ, диаспора). Пиши сразу по-русски, живым языком, обращайся на «ты».
Это адаптация, а не перевод: свои примеры и реалии — Telegram, VK, YouTube, Хабр, оплата и хостинг, доступные из РФ/СНГ, где это важно.
Технические термины (prompt, commit, deploy) можно оставлять как в индустрии, коротко поясняя при первом упоминании.
Если оригинал на английском — честно скажи, что видео/статья на английском, и подскажи, как смотреть (субтитры, автоперевод).`,
};

export function buildPrompt(r: Resource, lang: LibLang, sourceText: string | null): { system: string; prompt: string } {
  const system = `You are the lesson designer for FlowLeaf 66, a 66-day program that turns complete beginners into people who ship real apps and videos with AI coding agents.
You turn one external resource (a video, reel or article) into a short, practical lesson for ONE audience.
${AUDIENCE[lang]}
Rules:
- Be faithful to the source. Never invent facts, quotes, timestamps or features that are not in the provided material. If the material is thin, keep claims general and say what to look for.
- Concrete beats abstract: steps a beginner can actually follow today with a coding agent.
- The exercise must produce a visible artifact (a link, a screenshot, a short text) in 15–90 minutes.
- Quiz: 3–5 multiple-choice questions that check understanding, not trivia; exactly one correct option each; "answer" is the 0-based index.
- Output ONLY one JSON object, no markdown fences, no commentary.`;

  const schema = `{
  "title": string,            // title for this audience (may differ from the original), <= 100 chars
  "hook": string,             // one sentence: why this is worth 20 minutes of a beginner's day
  "summary": string,          // 2–4 short paragraphs separated by blank lines
  "takeaways": string[],      // 3–6 key takeaways
  "steps": [{"title": string, "detail": string}],   // 3–7 step-by-step actions to apply it
  "exercise": {"title": string, "goal": string, "instructions": string[], "proof": "link"|"text"|"file"|"none", "estMinutes": number},
  "quiz": [{"q": string, "options": string[], "answer": number, "explain": string}],
  "suggestedDays": [{"day": number, "track": "common"|"apps"|"video", "reason": string}],  // 1–3 best-fitting days
  "tracks": ("common"|"apps"|"video")[],
  "topics": string[],         // choose from: ${TOPICS.join(", ")}
  "tags": string[],           // 3–8 short lowercase tags in the audience language
  "level": "beginner"|"intermediate"|"advanced",
  "estMinutes": number        // watch/read time + exercise
}`;

  const facts = [
    `Type: ${r.sourceType}`,
    r.url ? `URL: ${r.url}` : null,
    `Original title: ${r.title || "(unknown)"}`,
    r.author ? `Author: ${r.author}` : null,
    r.durationSec ? `Duration: ${Math.round(r.durationSec / 60)} min` : null,
    `Original language: ${r.origLang}`,
    r.tracks.length ? `Founder's track hint: ${r.tracks.join(", ")}` : null,
    r.topics.length ? `Founder's topic hint: ${r.topics.join(", ")}` : null,
    r.adminNotes ? `Founder's notes (follow them): ${r.adminNotes}` : null,
    r.description ? `Description:\n${r.description.slice(0, 3000)}` : null,
  ].filter(Boolean).join("\n");

  const text = sourceText ? clip(sourceText, 60_000) : null;
  const prompt = `Program outline (for suggestedDays):
${PROGRAM_OUTLINE}

Resource:
${facts}

${text ? `Transcript / page text:\n<<<\n${text}\n>>>` : "No transcript is available — work only from the title, description and founder notes; keep the summary modest and honest about that."}

Write the lesson for the ${lang === "ru" ? "RUSSIAN-speaking" : "ENGLISH-speaking"} audience, entirely in ${lang === "ru" ? "Russian" : "English"}.
Return JSON exactly in this shape:
${schema}`;
  return { system, prompt };
}

function clip(s: string, max: number) {
  if (s.length <= max) return s;
  const head = Math.floor(max * 0.7);
  return `${s.slice(0, head)}\n[…middle omitted…]\n${s.slice(s.length - (max - head))}`;
}

export type GenerateResult =
  | { ok: true; data: LessonMaterial; model: string; attempts: number }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "invalid" | "error"; error: string; attempts: number };

/** Generate one language's material. Validates with zod; one retry with the validation errors fed back. */
export async function generateMaterial(env: Env, r: Resource, lang: LibLang, sourceText: string | null, call = claude): Promise<GenerateResult> {
  if (!env.ANTHROPIC_API_KEY) return { ok: false, reason: "not_configured" };
  const { system, prompt } = buildPrompt(r, lang, sourceText);
  let lastError = "";
  let reply: string | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const p = attempt === 1 ? prompt
      : `${prompt}\n\nYour previous reply was rejected by the validator:\n${lastError}\nPrevious reply (fix it, keep the content):\n${(reply ?? "").slice(0, 12_000)}\n\nReturn ONLY the corrected JSON object.`;
    try {
      reply = await call(env, { system, prompt: p, maxTokens: 6000 });
    } catch (e) {
      return { ok: false, reason: "error", error: (e as Error).message.slice(0, 500), attempts: attempt };
    }
    if (reply === null) return { ok: false, reason: "not_configured" };
    const parsed = parseMaterial(reply);
    if (parsed.ok) return { ok: true, data: normalize(parsed.data), model: env.CLAUDE_MODEL, attempts: attempt };
    lastError = parsed.error;
  }
  return { ok: false, reason: "invalid", error: lastError, attempts: 2 };
}

function normalize(m: LessonMaterial): LessonMaterial {
  const known = new Set<string>(TOPICS);
  return {
    ...m,
    topics: [...new Set(m.topics.map((t) => t.toLowerCase().replace(/\s+/g, "-")))].filter((t) => known.has(t)),
    tags: [...new Set(m.tags.map((t) => t.toLowerCase()))],
    suggestedDays: m.suggestedDays.filter((d, i, a) => a.findIndex((x) => x.day === d.day && x.track === d.track) === i),
  };
}

/**
 * Deterministic starter draft used when AI is not configured: gives the founder a pre-filled editor
 * (title/summary from metadata) instead of an empty form. Never published automatically.
 */
export function starterMaterial(r: Resource, lang: LibLang, sourceText: string | null): LessonMaterial {
  const ru = lang === "ru";
  const basis = (r.description || sourceText || "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const sentences = basis.match(/[^.!?]+[.!?]/g)?.slice(0, 3).join(" ").trim() || basis.slice(0, 400);
  const tracks = r.tracks.length ? r.tracks : ["common" as const];
  return {
    title: r.title || (ru ? "Новый материал" : "New resource"),
    hook: ru ? "Коротко: чем этот материал поможет на твоём пути." : "In one line: how this helps on your path.",
    summary: sentences || (ru ? "Опиши здесь главное из материала своими словами." : "Describe the core idea of the resource in your own words."),
    takeaways: ru ? ["Главная мысль №1", "Главная мысль №2"] : ["Key idea #1", "Key idea #2"],
    steps: [{ title: ru ? "Посмотри или прочитай материал целиком" : "Watch or read the whole thing", detail: "" }],
    exercise: {
      title: ru ? "Примени на практике" : "Put it into practice",
      goal: ru ? "Сделай маленький результат по мотивам материала." : "Make one small, visible result based on this resource.",
      instructions: [ru ? "Опиши шаги задания." : "Describe the exercise steps."],
      proof: "text", estMinutes: 30,
    },
    quiz: [
      { q: ru ? "Вопрос 1" : "Question 1", options: ru ? ["Вариант A", "Вариант B"] : ["Option A", "Option B"], answer: 0, explain: "" },
      { q: ru ? "Вопрос 2" : "Question 2", options: ru ? ["Вариант A", "Вариант B"] : ["Option A", "Option B"], answer: 0, explain: "" },
    ],
    suggestedDays: r.suggestedDays,
    tracks,
    topics: r.topics,
    tags: [],
    level: r.level,
    estMinutes: Math.max(10, Math.round((r.durationSec ?? 600) / 60) + 30),
  };
}
