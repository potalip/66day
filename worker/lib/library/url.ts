import type { SourceType } from "./schema";

export interface ParsedUrl {
  sourceType: Exclude<SourceType, "upload">;
  url: string;          // as given (trimmed, with scheme)
  canonicalUrl: string; // used for de-duplication
  externalId: string | null;
  kind?: "video" | "short" | "live" | "reel" | "post" | "tv" | "page";
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** Normalize and classify a single URL. Returns null for anything that is not an http(s) URL. */
export function parseResourceUrl(input: string): ParsedUrl | null {
  let s = input.trim().replace(/[)\].,;!?»"']+$/, "");
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) {
    if (/^(www\.|m\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(s)) s = `https://${s}`;
    else return null;
  }
  let u: URL;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.|music\.)/, "");

  // --- YouTube ---
  if (host === "youtu.be") {
    const id = u.pathname.split("/")[1] ?? "";
    if (YT_ID.test(id)) return yt(s, id, "video");
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (u.pathname === "/watch" && v && YT_ID.test(v)) return yt(s, v, "video");
    const m = u.pathname.match(/^\/(shorts|embed|live|v|e)\/([A-Za-z0-9_-]{11})/);
    if (m) return yt(s, m[2], m[1] === "shorts" ? "short" : m[1] === "live" ? "live" : "video");
  }

  // --- Instagram ---
  if (host === "instagram.com" || host === "instagr.am") {
    const m = u.pathname.match(/^\/(?:[A-Za-z0-9_.]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
    if (m) {
      const kind = m[1] === "p" ? "post" : m[1] === "tv" ? "tv" : "reel";
      const path = kind === "post" ? "p" : kind === "tv" ? "tv" : "reel";
      return { sourceType: "instagram", url: s, canonicalUrl: `https://www.instagram.com/${path}/${m[2]}/`, externalId: m[2], kind };
    }
    return { sourceType: "instagram", url: s, canonicalUrl: canonicalLink(u), externalId: null, kind: "page" };
  }

  return { sourceType: "link", url: s, canonicalUrl: canonicalLink(u), externalId: null, kind: "page" };
}

function yt(url: string, id: string, kind: ParsedUrl["kind"]): ParsedUrl {
  return { sourceType: "youtube", url, canonicalUrl: `https://www.youtube.com/watch?v=${id}`, externalId: id, kind };
}

const TRACKING = /^(utm_|fbclid$|gclid$|igsh$|igshid$|si$|ref$|ref_src$|mc_|yclid$|_hs)/i;

function canonicalLink(u: URL): string {
  const c = new URL(u.toString());
  c.protocol = "https:";
  c.hostname = c.hostname.toLowerCase().replace(/^www\./, "");
  c.hash = "";
  for (const k of [...c.searchParams.keys()]) if (TRACKING.test(k)) c.searchParams.delete(k);
  c.searchParams.sort();
  if (c.pathname.length > 1 && c.pathname.endsWith("/")) c.pathname = c.pathname.replace(/\/+$/, "");
  const out = c.toString();
  return c.pathname === "/" && !c.search ? out.replace(/\/$/, "") : out;
}

/** Extract every URL from pasted text (one per line, comma/space separated, or mixed with prose). De-duplicated. */
export function extractUrls(text: string): ParsedUrl[] {
  const tokens = text.match(/(?:https?:\/\/|www\.)[^\s<>"'`,]+|(?:youtu\.be|youtube\.com|instagram\.com)\/[^\s<>"'`,]+/gi) ?? [];
  const seen = new Set<string>();
  const out: ParsedUrl[] = [];
  for (const t of tokens) {
    const p = parseResourceUrl(t);
    if (p && !seen.has(p.canonicalUrl)) { seen.add(p.canonicalUrl); out.push(p); }
  }
  return out;
}

export function youtubeEmbedUrl(id: string, start?: number) {
  return `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}`;
}
export function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
export function instagramEmbedUrl(canonicalUrl: string) {
  return `${canonicalUrl.replace(/\/$/, "")}/embed/`;
}
