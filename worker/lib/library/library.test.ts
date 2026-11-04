import { describe, it, expect } from "vitest";
import { parseResourceUrl, extractUrls } from "./url";
import {
  parseOEmbed, parseOpenGraph, parseYouTubeWatchPage, pickCaptionTrack, parseCaptionXml, subtitleFileToText, parseDuration, guessLang, htmlToText,
} from "./metadata";
import { parseMaterial, extractJson, lessonMaterialSchema, type LessonMaterial } from "./schema";
import { generateMaterial, starterMaterial } from "./generate";
import type { Resource } from "./repo";
import type { Env } from "../../env";

describe("parseResourceUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=zjkBMFhNj_g&t=42s", "zjkBMFhNj_g", "video"],
    ["https://youtu.be/zjkBMFhNj_g?si=abc", "zjkBMFhNj_g", "video"],
    ["https://m.youtube.com/watch?v=zjkBMFhNj_g", "zjkBMFhNj_g", "video"],
    ["https://youtube.com/shorts/AJpK3YTTKZ4?feature=share", "AJpK3YTTKZ4", "short"],
    ["https://www.youtube.com/embed/6eBSHbLKuN0", "6eBSHbLKuN0", "video"],
    ["https://www.youtube.com/live/LCEmiRjPEtQ", "LCEmiRjPEtQ", "live"],
    ["youtube.com/watch?v=deg8bOoziaE", "deg8bOoziaE", "video"],
  ])("youtube %s", (url, id, kind) => {
    const p = parseResourceUrl(url)!;
    expect(p.sourceType).toBe("youtube");
    expect(p.externalId).toBe(id);
    expect(p.kind).toBe(kind);
    expect(p.canonicalUrl).toBe(`https://www.youtube.com/watch?v=${id}`);
  });

  it("instagram reels/posts, with or without username and tracking", () => {
    expect(parseResourceUrl("https://www.instagram.com/reel/C9xYz_12-ab/?igsh=MWQ1")).toMatchObject({
      sourceType: "instagram", externalId: "C9xYz_12-ab", kind: "reel", canonicalUrl: "https://www.instagram.com/reel/C9xYz_12-ab/",
    });
    expect(parseResourceUrl("https://instagram.com/someone/reels/ABC123/")?.canonicalUrl).toBe("https://www.instagram.com/reel/ABC123/");
    expect(parseResourceUrl("https://www.instagram.com/p/XYZ/")?.kind).toBe("post");
    expect(parseResourceUrl("https://www.instagram.com/anthropicai/")).toMatchObject({ sourceType: "instagram", externalId: null, kind: "page" });
  });

  it("generic links are canonicalized (tracking params, www, trailing slash, hash)", () => {
    const a = parseResourceUrl("https://www.Example.com/docs/page/?utm_source=x&b=2&a=1#intro")!;
    const b = parseResourceUrl("https://example.com/docs/page?a=1&b=2&fbclid=zzz")!;
    expect(a.sourceType).toBe("link");
    expect(a.canonicalUrl).toBe("https://example.com/docs/page?a=1&b=2");
    expect(b.canonicalUrl).toBe(a.canonicalUrl);
  });

  it("rejects non-urls and bad youtube ids", () => {
    expect(parseResourceUrl("hello world")).toBeNull();
    expect(parseResourceUrl("javascript:alert(1)")).toBeNull();
    expect(parseResourceUrl("https://youtube.com/watch?v=short")?.sourceType).toBe("link");
  });

  it("extractUrls finds every URL in pasted prose and de-duplicates", () => {
    const text = `Watch this: https://youtu.be/zjkBMFhNj_g, and also https://www.youtube.com/watch?v=zjkBMFhNj_g.
      reel → instagram.com/reel/ABC123 ; docs (https://code.claude.com/docs/en/overview)`;
    const urls = extractUrls(text);
    expect(urls.map((u) => u.sourceType)).toEqual(["youtube", "instagram", "link"]);
    expect(urls[2].canonicalUrl).toBe("https://code.claude.com/docs/en/overview");
  });
});

describe("metadata parsers", () => {
  it("parseOEmbed (YouTube shape)", () => {
    expect(parseOEmbed({ title: "Intro to LLMs", author_name: "Andrej Karpathy", author_url: "https://www.youtube.com/@AndrejKarpathy", thumbnail_url: "https://i.ytimg.com/vi/x/hqdefault.jpg", provider_name: "YouTube", type: "video" }))
      .toEqual({ title: "Intro to LLMs", author: "Andrej Karpathy", authorUrl: "https://www.youtube.com/@AndrejKarpathy", thumbnailUrl: "https://i.ytimg.com/vi/x/hqdefault.jpg", siteName: "YouTube" });
    expect(parseOEmbed(null)).toEqual({});
    expect(parseOEmbed({ title: "  " }).title).toBeUndefined();
  });

  it("parseOpenGraph handles attribute order, entities, relative images and <title> fallback", () => {
    const html = `<html lang="ru-RU"><head><title>Fallback &amp; title</title>
      <meta content="Кодинг &quot;с агентом&quot;" property="og:title">
      <meta name="description" content="Desc &#39;here&#39;">
      <meta property="og:image" content="/img/cover.png"></head></html>`;
    expect(parseOpenGraph(html, "https://site.dev/a/b")).toMatchObject({
      title: 'Кодинг "с агентом"', description: "Desc 'here'", thumbnailUrl: "https://site.dev/img/cover.png", lang: "ru",
    });
    expect(parseOpenGraph("<title>Only &amp; title</title>").title).toBe("Only & title");
  });

  it("parseYouTubeWatchPage extracts duration, description and caption tracks", () => {
    const html = `var ytInitialPlayerResponse = {"playabilityStatus":{"status":"OK"},"captions":{"playerCaptionsTracklistRenderer":{"captionTracks":[{"baseUrl":"https://www.youtube.com/api/timedtext?v=x\\u0026lang=en","name":{"simpleText":"English (auto-generated)"},"languageCode":"en","kind":"asr"},{"baseUrl":"https://www.youtube.com/api/timedtext?v=x\\u0026lang=ru","name":{"simpleText":"Russian"},"languageCode":"ru"}],"audioTracks":[]}},"videoDetails":{"videoId":"x","title":"A \\"quoted\\" title","lengthSeconds":"3588","shortDescription":"Line one\\nLine two","author":"Andrej Karpathy"}};`;
    const p = parseYouTubeWatchPage(html);
    expect(p.durationSec).toBe(3588);
    expect(p.description).toBe("Line one\nLine two");
    expect(p.title).toBe('A "quoted" title');
    expect(p.author).toBe("Andrej Karpathy");
    expect(p.captions).toHaveLength(2);
    expect(p.captions[0].baseUrl).toContain("&lang=en");
    // manual RU beats auto EN
    expect(pickCaptionTrack(p.captions, ["en", "ru"])?.languageCode).toBe("ru");
    expect(pickCaptionTrack([], ["en"])).toBeNull();
  });

  it("parseCaptionXml decodes (double-)entities and de-duplicates lines", () => {
    const xml = `<transcript><text start="0" dur="1">Hello &amp;amp; welcome</text><text start="1" dur="1">Hello &amp;amp; welcome</text><text start="2">it&amp;#39;s <font>fine</font></text></transcript>`;
    expect(parseCaptionXml(xml)).toBe("Hello & welcome it's fine");
  });

  it("subtitleFileToText strips SRT/VTT timing and cue numbers", () => {
    const srt = "1\n00:00:01,000 --> 00:00:02,000\nПривет, это <i>Claude Code</i>.\n\n2\n00:00:02,000 --> 00:00:03,000\nПоехали!\n";
    expect(subtitleFileToText(srt)).toBe("Привет, это Claude Code. Поехали!");
    expect(subtitleFileToText("WEBVTT\n\n00:01.000 --> 00:02.000\nHi\n")).toBe("Hi");
  });

  it("parseDuration / guessLang / htmlToText", () => {
    expect(parseDuration("PT1H2M3S")).toBe(3723);
    expect(parseDuration("PT45S")).toBe(45);
    expect(parseDuration("1:02:03")).toBe(3723);
    expect(parseDuration("8:41")).toBe(521);
    expect(parseDuration("soon")).toBeUndefined();
    expect(guessLang("Изучение Git для новичков — установка и настройка")).toBe("ru");
    expect(guessLang("Mastering Claude Code in thirty minutes")).toBe("en");
    expect(guessLang("ok")).toBeUndefined();
    const text = htmlToText(`<nav>menu</nav><main><h1>Title</h1><p>${"Real paragraph text. ".repeat(40)}</p><script>x()</script></main>`);
    expect(text.startsWith("Title")).toBe(true);
    expect(text).not.toContain("menu");
    expect(text).not.toContain("x()");
  });
});

const valid: LessonMaterial = {
  title: "Claude Code in 30 minutes", hook: "See the whole loop once.", summary: "Para one.\n\nPara two.",
  takeaways: ["Plan first", "Small steps"], steps: [{ title: "Install", detail: "npm i -g" }],
  exercise: { title: "Ship a page", goal: "A live page", instructions: ["Ask the agent"], proof: "link", estMinutes: 30 },
  quiz: [{ q: "Q1?", options: ["a", "b"], answer: 1, explain: "" }, { q: "Q2?", options: ["a", "b", "c"], answer: 0, explain: "" }],
  suggestedDays: [{ day: 3, track: "common", reason: "" }], tracks: ["common"], topics: ["claude-code"], tags: ["agents"],
  level: "beginner", estMinutes: 45,
};

describe("lesson material schema", () => {
  it("accepts valid material, also wrapped in fences and chatter", () => {
    expect(lessonMaterialSchema.safeParse(valid).success).toBe(true);
    const r = parseMaterial("Sure! Here it is:\n```json\n" + JSON.stringify(valid) + "\n```\nHope it helps");
    expect(r.ok).toBe(true);
  });
  it("rejects out-of-range quiz answers, bad tracks, day > 66", () => {
    const bad = { ...valid, quiz: [{ q: "Q", options: ["a", "b"], answer: 2 }, valid.quiz[1]], tracks: ["music"], suggestedDays: [{ day: 70, track: "common" }] };
    const r = parseMaterial(JSON.stringify(bad));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("quiz.0.answer");
      expect(r.error).toContain("tracks.0");
      expect(r.error).toContain("suggestedDays.0.day");
    }
  });
  it("extractJson throws on prose without JSON", () => {
    expect(() => extractJson("no json here")).toThrow();
    expect(parseMaterial("{ broken").ok).toBe(false);
  });
});

const resource: Resource = {
  id: "r_test", sourceType: "youtube", url: "https://youtu.be/6eBSHbLKuN0", canonicalUrl: null, externalId: "6eBSHbLKuN0",
  title: "Mastering Claude Code in 30 minutes", author: "Anthropic", authorUrl: null, description: "Boris shows how he uses Claude Code. Lots of tips.",
  durationSec: 1680, thumbnailUrl: null, tracks: [], topics: [], level: "beginner", origLang: "en", audience: ["ru", "en"], suggestedDays: [],
  status: "processing", transcriptState: "ready", aiState: "queued", lastError: null, adminNotes: null, featured: false,
  createdAt: 0, updatedAt: 0, publishedAt: null,
};
const env = (key?: string) => ({ ANTHROPIC_API_KEY: key, CLAUDE_MODEL: "claude-sonnet-5-5" }) as unknown as Env;

describe("generateMaterial", () => {
  it("degrades without an API key", async () => {
    expect(await generateMaterial(env(), resource, "en", null)).toEqual({ ok: false, reason: "not_configured" });
  });
  it("retries once with validator feedback, then succeeds", async () => {
    const prompts: string[] = [];
    const replies = ['{"title": "x"}', JSON.stringify({ ...valid, topics: ["Claude Code", "unknown-topic"] })];
    const r = await generateMaterial(env("k"), resource, "ru", "transcript text", async (_e, o) => { prompts.push(o.prompt); return replies.shift()!; });
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.attempts).toBe(2); expect(r.data.topics).toEqual(["claude-code"]); }
    expect(prompts[0]).toContain("RUSSIAN-speaking");
    expect(prompts[0]).toContain("transcript text");
    expect(prompts[1]).toContain("rejected by the validator");
  });
  it("gives up after two invalid replies", async () => {
    const r = await generateMaterial(env("k"), resource, "en", null, async () => "not json");
    expect(r).toMatchObject({ ok: false, reason: "invalid", attempts: 2 });
  });
  it("starter material is itself schema-valid in both languages", () => {
    for (const lang of ["ru", "en"] as const) expect(lessonMaterialSchema.safeParse(starterMaterial(resource, lang, null)).success).toBe(true);
  });
});

import { pipelineSteps, attentionReason } from "./progress";
describe("pipelineSteps / attentionReason", () => {
  const base = { status: "processing" as const, sourceType: "youtube" as const, transcriptState: "none" as const, aiState: "idle" as const, audience: ["ru", "en"] as ("ru" | "en")[] };
  const st = (steps: ReturnType<typeof pipelineSteps>) => Object.fromEntries(steps.map((s) => [s.key, s.state]));
  it("fresh link: fetching", () => {
    const s = pipelineSteps(base, {}, new Set(["created"]));
    expect(st(s)).toMatchObject({ fetch: "active", transcript: "todo", lesson_ru: "todo", publish: "todo" });
    expect(attentionReason(s)).toBeNull();
  });
  it("needs transcript + starter drafts → founder must add a transcript", () => {
    const s = pipelineSteps({ ...base, status: "review", transcriptState: "needed" }, { ru: "not_configured", en: "not_configured" }, new Set(["metadata"]));
    expect(st(s)).toMatchObject({ fetch: "done", transcript: "warn", lesson_ru: "warn", publish: "ready" });
    expect(attentionReason(s)).toBe("transcript");
  });
  it("generating blocks attention; a failed lesson surfaces", () => {
    expect(attentionReason(pipelineSteps({ ...base, transcriptState: "ready" }, { ru: "generating", en: "ready" }, new Set(["metadata"])))).toBeNull();
    expect(attentionReason(pipelineSteps({ ...base, status: "review", transcriptState: "ready" }, { ru: "failed", en: "ready" }, new Set(["metadata"])))).toBe("lesson_failed");
  });
  it("both lessons ready → review; published → nothing to do; audience skips the other language", () => {
    expect(attentionReason(pipelineSteps({ ...base, status: "review", transcriptState: "ready" }, { ru: "ready", en: "ready" }, new Set(["metadata"])))).toBe("review");
    const pub = pipelineSteps({ ...base, status: "published", transcriptState: "ready", audience: ["en"] }, { en: "ready" }, new Set(["metadata"]));
    expect(st(pub)).toMatchObject({ lesson_ru: "skip", lesson_en: "done", publish: "done" });
    expect(attentionReason(pub)).toBeNull();
  });
  it("upload without metadata step counts as fetched; ingest failure is an error", () => {
    expect(st(pipelineSteps({ ...base, sourceType: "upload" }, {}, new Set()))).toMatchObject({ fetch: "done" });
    const f = pipelineSteps({ ...base, status: "failed" }, {}, new Set(["created"]));
    expect(attentionReason(f)).toBe("failed");
  });
  it("seeded published resources (no ingest events) count as fetched, not spinning", () => {
    const seeded = pipelineSteps({ ...base, status: "published", transcriptState: "not_applicable" }, { ru: "ready", en: "ready" }, new Set(["seed"]));
    expect(st(seeded)).toMatchObject({ fetch: "done", transcript: "skip", publish: "done" });
  });
});
