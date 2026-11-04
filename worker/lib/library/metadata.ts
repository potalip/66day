/**
 * Pure parsers for resource metadata: oEmbed JSON, OpenGraph/HTML, YouTube watch page, YouTube caption XML.
 * Network calls live in fetchers.ts so these stay unit-testable.
 */

export interface Metadata {
  title?: string;
  author?: string;
  authorUrl?: string;
  description?: string;
  thumbnailUrl?: string;
  durationSec?: number;
  lang?: string;
  siteName?: string;
}

export function parseOEmbed(json: unknown): Metadata {
  if (!json || typeof json !== "object") return {};
  const o = json as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" && (o[k] as string).trim() ? (o[k] as string).trim() : undefined);
  return {
    title: str("title"),
    author: str("author_name"),
    authorUrl: str("author_url"),
    thumbnailUrl: str("thumbnail_url"),
    siteName: str("provider_name"),
  };
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", nbsp: " " };
export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z0-9#]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function metaContent(html: string, key: string): string | undefined {
  // Matches <meta property="og:title" content="..."> in either attribute order, ' or " quotes.
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re1 = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k}["'][^>]*?content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*?(?:property|name|itemprop)=["']${k}["']`, "i");
  const m = html.match(re1) ?? html.match(re2);
  const v = m?.[1] ? decodeEntities(m[1]).trim() : undefined;
  return v || undefined;
}

/** OpenGraph / Twitter card / <title> fallback. `baseUrl` resolves relative image URLs. */
export function parseOpenGraph(html: string, baseUrl?: string): Metadata {
  const head = html.slice(0, 200_000);
  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  let thumb = metaContent(head, "og:image") ?? metaContent(head, "twitter:image") ?? metaContent(head, "og:image:url");
  if (thumb && baseUrl) { try { thumb = new URL(thumb, baseUrl).toString(); } catch { /* keep as is */ } }
  const htmlLang = head.match(/<html[^>]*\blang=["']?([a-zA-Z-]+)/i)?.[1];
  return {
    title: metaContent(head, "og:title") ?? metaContent(head, "twitter:title") ?? (titleTag ? decodeEntities(titleTag).replace(/\s+/g, " ").trim() : undefined),
    description: metaContent(head, "og:description") ?? metaContent(head, "description") ?? metaContent(head, "twitter:description"),
    thumbnailUrl: thumb,
    siteName: metaContent(head, "og:site_name"),
    author: metaContent(head, "author") ?? metaContent(head, "article:author"),
    lang: htmlLang?.slice(0, 2).toLowerCase(),
  };
}

/** Readable text of an article-like page (for 'link' resources). Crude but dependency-free. */
export function htmlToText(html: string, maxChars = 60_000): string {
  let s = html;
  const main = s.match(/<(main|article)[^>]*>([\s\S]*?)<\/\1>/i);
  if (main && main[2].length > 500) s = main[2];
  s = s
    .replace(/<(script|style|noscript|svg|nav|footer|header|form|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/pre)[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, " ");
  s = decodeEntities(s).replace(/[ \t\f\v ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return s.slice(0, maxChars);
}

export interface CaptionTrack { baseUrl: string; languageCode: string; kind?: string; name?: string }

/** Pull duration, description and caption tracks out of a YouTube watch page (ytInitialPlayerResponse). */
export function parseYouTubeWatchPage(html: string): Metadata & { captions: CaptionTrack[]; playable: boolean } {
  const out: Metadata & { captions: CaptionTrack[]; playable: boolean } = { captions: [], playable: !/"status":"(ERROR|LOGIN_REQUIRED|UNPLAYABLE)"/.test(html) };
  const len = html.match(/"lengthSeconds":"(\d+)"/);
  if (len) out.durationSec = parseInt(len[1], 10);
  const desc = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  if (desc) { try { out.description = JSON.parse(`"${desc[1]}"`); } catch { /* ignore */ } }
  const title = html.match(/"videoDetails":\{[^}]*?"title":"((?:[^"\\]|\\.)*)"/);
  if (title) { try { out.title = JSON.parse(`"${title[1]}"`); } catch { /* ignore */ } }
  const author = html.match(/"videoDetails":\{[\s\S]*?"author":"((?:[^"\\]|\\.)*)"/);
  if (author) { try { out.author = JSON.parse(`"${author[1]}"`); } catch { /* ignore */ } }
  const tracks = html.match(/"captionTracks":(\[[\s\S]*?\])\s*,\s*"(?:audioTracks|translationLanguages|defaultAudioTrackIndex)"/);
  if (tracks) {
    try {
      const arr = JSON.parse(tracks[1]) as { baseUrl: string; languageCode: string; kind?: string; name?: { simpleText?: string } }[];
      out.captions = arr.filter((t) => t.baseUrl).map((t) => ({ baseUrl: t.baseUrl, languageCode: t.languageCode, kind: t.kind, name: t.name?.simpleText }));
    } catch { /* ignore */ }
  }
  return out;
}

/** Choose the best caption track: manual over auto ("asr"), preferred languages first. */
export function pickCaptionTrack(tracks: CaptionTrack[], prefer: string[] = ["en", "ru"]): CaptionTrack | null {
  if (!tracks.length) return null;
  const score = (t: CaptionTrack) => {
    const i = prefer.findIndex((p) => t.languageCode.toLowerCase().startsWith(p));
    return (t.kind === "asr" ? 10 : 0) + (i < 0 ? 5 : i);
  };
  return [...tracks].sort((a, b) => score(a) - score(b))[0];
}

/** YouTube timedtext XML (<text start dur>…</text>) or srv3 (<p t d>…</p>) → plain text paragraphs. */
export function parseCaptionXml(xml: string): string {
  const parts: string[] = [];
  const re = /<(text|p)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const t = decodeEntities(decodeEntities(m[2].replace(/<[^>]+>/g, ""))).replace(/\s+/g, " ").trim();
    if (t && parts[parts.length - 1] !== t) parts.push(t);
  }
  // Join into ~paragraphs of ~12 lines for readability.
  const paras: string[] = [];
  for (let i = 0; i < parts.length; i += 12) paras.push(parts.slice(i, i + 12).join(" "));
  return paras.join("\n\n");
}

/** Plain transcript from uploaded .srt / .vtt / .txt. */
export function subtitleFileToText(raw: string): string {
  const lines = raw.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const l = line.trim();
    if (!l || l === "WEBVTT" || /^\d+$/.test(l) || /-->/.test(l) || /^(NOTE|STYLE|REGION)\b/.test(l)) continue;
    const clean = l.replace(/<[^>]+>/g, "").trim();
    if (clean && out[out.length - 1] !== clean) out.push(clean);
  }
  return out.join(" ").replace(/\s+([,.!?])/g, "$1").replace(/(.{400,}?[.!?])\s/g, "$1\n\n").trim();
}

/** "PT1H2M3S" or "1:02:03" or "62:03" → seconds. */
export function parseDuration(s: string | undefined | null): number | undefined {
  if (!s) return undefined;
  const iso = s.match(/^P(?:T)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (iso && (iso[1] || iso[2] || iso[3])) return (+(iso[1] ?? 0)) * 3600 + (+(iso[2] ?? 0)) * 60 + +(iso[3] ?? 0);
  const clock = s.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  if (clock) return (+(clock[1] ?? 0)) * 3600 + +clock[2] * 60 + +clock[3];
  return undefined;
}

/** Rough language guess: Cyrillic share. */
export function guessLang(text: string | undefined): "ru" | "en" | undefined {
  if (!text) return undefined;
  const sample = text.slice(0, 4000);
  const cyr = (sample.match(/[а-яё]/gi) ?? []).length;
  const lat = (sample.match(/[a-z]/gi) ?? []).length;
  if (cyr + lat < 20) return undefined;
  return cyr > lat * 0.6 ? "ru" : "en";
}
