import type { ParsedUrl } from "./url";
import { youtubeThumb } from "./url";
import {
  type Metadata, parseOEmbed, parseOpenGraph, parseYouTubeWatchPage, pickCaptionTrack, parseCaptionXml, htmlToText, guessLang,
} from "./metadata";

const UA = "Mozilla/5.0 (compatible; FlowLeafLibraryBot/1.0; +https://flowleaf66.app)";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

async function get(url: string, opts: { timeoutMs?: number; browser?: boolean; lang?: string } = {}): Promise<Response> {
  return fetch(url, {
    headers: {
      "user-agent": opts.browser ? BROWSER_UA : UA,
      "accept-language": opts.lang ?? "en-US,en;q=0.9,ru;q=0.8",
      accept: "text/html,application/json;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(opts.timeoutMs ?? 12_000),
  });
}

export interface IngestResult {
  meta: Metadata;
  transcript?: { text: string; source: "youtube_captions" | "page_text"; lang?: string };
  notes: string[];        // human-readable notes for the pipeline log
}

/** Fetch everything we can about a URL. Never throws for "blocked" — returns notes instead. */
export async function fetchResource(p: ParsedUrl): Promise<IngestResult> {
  if (p.sourceType === "youtube") return fetchYouTube(p);
  if (p.sourceType === "instagram") return fetchInstagram(p);
  return fetchLink(p);
}

async function fetchYouTube(p: ParsedUrl): Promise<IngestResult> {
  const notes: string[] = [];
  const meta: Metadata = { thumbnailUrl: youtubeThumb(p.externalId!) };
  try {
    const r = await get(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(p.canonicalUrl)}`);
    if (r.ok) Object.assign(meta, stripEmpty(parseOEmbed(await r.json())));
    else notes.push(`oEmbed HTTP ${r.status}${r.status === 401 || r.status === 403 ? " (embedding disabled or private)" : r.status === 404 ? " (video not found)" : ""}`);
  } catch (e) { notes.push(`oEmbed unreachable: ${(e as Error).message}`); }
  if (meta.thumbnailUrl?.includes("hqdefault")) meta.thumbnailUrl = youtubeThumb(p.externalId!);

  let transcript: IngestResult["transcript"];
  try {
    const r = await get(`${p.canonicalUrl}&hl=en`, { browser: true, timeoutMs: 15_000 });
    if (r.ok) {
      const page = parseYouTubeWatchPage(await r.text());
      if (page.durationSec) meta.durationSec = page.durationSec;
      if (page.description) meta.description = page.description;
      meta.title ??= page.title;
      meta.author ??= page.author;
      const track = pickCaptionTrack(page.captions, ["en", "ru"]);
      if (!track) notes.push("no caption tracks exposed on the watch page");
      else {
        const cr = await get(track.baseUrl, { browser: true });
        const xml = cr.ok ? await cr.text() : "";
        const text = parseCaptionXml(xml);
        if (text.length > 200) {
          transcript = { text, source: "youtube_captions", lang: track.languageCode.slice(0, 2) };
          notes.push(`captions: ${track.languageCode}${track.kind === "asr" ? " (auto)" : ""}, ${text.length} chars`);
        } else notes.push(`caption track ${track.languageCode} returned no text (YouTube may require a session token)`);
      }
    } else notes.push(`watch page HTTP ${r.status}`);
  } catch (e) { notes.push(`watch page unreachable: ${(e as Error).message}`); }
  meta.lang = guessLang(`${meta.title ?? ""} ${meta.description ?? ""}`) ?? meta.lang;
  return { meta, transcript, notes };
}

async function fetchInstagram(p: ParsedUrl): Promise<IngestResult> {
  const notes: string[] = [];
  const meta: Metadata = {};
  // Public oEmbed needs a Meta app token; the page itself is often login-walled. Try OpenGraph, accept failure.
  try {
    const r = await get(p.canonicalUrl, { browser: true });
    if (r.ok) {
      const og = parseOpenGraph(await r.text(), p.canonicalUrl);
      if (og.title && !/^Instagram$/i.test(og.title)) Object.assign(meta, stripEmpty(og));
      else notes.push("Instagram returned a login wall — no metadata");
    } else notes.push(`Instagram HTTP ${r.status}`);
  } catch (e) { notes.push(`Instagram unreachable: ${(e as Error).message}`); }
  // og:title on reels looks like: "Name on Instagram: "caption…"" — split author out.
  const m = meta.title?.match(/^(.+?) on Instagram: ["“]?([\s\S]*?)["”]?$/);
  if (m) { meta.author ??= m[1]; meta.description ??= m[2]; meta.title = m[2].split("\n")[0].slice(0, 120) || meta.title; }
  meta.lang = guessLang(`${meta.title ?? ""} ${meta.description ?? ""}`);
  return { meta, notes };
}

async function fetchLink(p: ParsedUrl): Promise<IngestResult> {
  const notes: string[] = [];
  let meta: Metadata = {};
  let transcript: IngestResult["transcript"];
  try {
    const r = await get(p.url, { browser: true });
    const type = r.headers.get("content-type") ?? "";
    if (r.ok && type.includes("html")) {
      const html = await r.text();
      meta = stripEmpty(parseOpenGraph(html, r.url || p.url));
      const text = htmlToText(html);
      if (text.length > 400) {
        transcript = { text, source: "page_text", lang: meta.lang ?? guessLang(text) };
        notes.push(`page text: ${text.length} chars`);
      } else notes.push("page has little readable text (probably rendered by JavaScript)");
    } else if (r.ok) notes.push(`not an HTML page (${type || "unknown type"})`);
    else notes.push(`HTTP ${r.status}`);
  } catch (e) { notes.push(`unreachable: ${(e as Error).message}`); }
  meta.lang = meta.lang ?? guessLang(`${meta.title ?? ""} ${meta.description ?? ""}`);
  return { meta, transcript, notes };
}

function stripEmpty<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "")) as Partial<T>;
}
