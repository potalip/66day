/**
 * Tiny, safe Markdown → AST parser (no HTML passthrough, no dangerouslySetInnerHTML).
 * Supports: # headings, paragraphs, - / * / 1. lists (with one nested level by 2+ space indent),
 * ``` fenced code (with lang), > blockquote, --- hr, ![alt](src) images on their own line,
 * inline `code`, **bold**, *italic* / _italic_, [links](url), ~~strike~~, hard line breaks (two spaces / backslash).
 * Callouts: "> [!TIP] text" / [!NOTE] / [!WARNING] → { type: "callout" }.
 * URLs are restricted to http(s), mailto and relative paths.
 */
export type Inline =
  | { t: "text"; v: string }
  | { t: "code"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "del"; c: Inline[] }
  | { t: "link"; href: string; c: Inline[] }
  | { t: "br" };

export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4; c: Inline[] }
  | { type: "p"; c: Inline[] }
  | { type: "list"; ordered: boolean; start?: number; items: { c: Inline[]; children?: Block }[] }
  | { type: "code"; lang?: string; v: string }
  | { type: "quote"; c: Block[] }
  | { type: "callout"; kind: "tip" | "note" | "warning"; c: Block[] }
  | { type: "hr" }
  | { type: "img"; src: string; alt: string };

export function safeUrl(u: string): string | null {
  const s = u.trim();
  if (/^(https?:|mailto:)/i.test(s)) return s;
  if (/^[/#.?]/.test(s) || /^[\w-]+(\/|$|\.[a-z]+)/i.test(s) && !/^[\w-]+:/.test(s)) return s;
  return null;
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => { if (buf) { out.push({ t: "text", v: buf }); buf = ""; } };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    const rest = src.slice(i);
    if (ch === "\\" && src[i + 1] === "\n") { flush(); out.push({ t: "br" }); i += 2; continue; }
    if (ch === "\\" && i + 1 < src.length && /[\\`*_[\]()~#>!-]/.test(src[i + 1])) { buf += src[i + 1]; i += 2; continue; }
    if (rest.startsWith("  \n")) { flush(); out.push({ t: "br" }); i += 3; continue; }
    if (ch === "\n") { buf += " "; i++; continue; }
    if (ch === "`") {
      const end = src.indexOf("`", i + 1);
      if (end > i) { flush(); out.push({ t: "code", v: src.slice(i + 1, end) }); i = end + 1; continue; }
    }
    if (rest.startsWith("**") || rest.startsWith("__")) {
      const mark = rest.slice(0, 2);
      const end = src.indexOf(mark, i + 2);
      if (end > i + 2) { flush(); out.push({ t: "strong", c: parseInline(src.slice(i + 2, end)) }); i = end + 2; continue; }
    }
    if (rest.startsWith("~~")) {
      const end = src.indexOf("~~", i + 2);
      if (end > i + 2) { flush(); out.push({ t: "del", c: parseInline(src.slice(i + 2, end)) }); i = end + 2; continue; }
    }
    if ((ch === "*" || ch === "_") && src[i + 1] && src[i + 1] !== " " && src[i + 1] !== ch) {
      // _ only counts at word boundaries (snake_case stays literal)
      const prev = src[i - 1];
      if (ch === "*" || !prev || /\W/.test(prev)) {
        let end = i + 1;
        while ((end = src.indexOf(ch, end)) !== -1) {
          const after = src[end + 1];
          if (src[end - 1] !== " " && (ch === "*" || !after || /\W/.test(after))) break;
          end++;
        }
        if (end > i + 1) { flush(); out.push({ t: "em", c: parseInline(src.slice(i + 1, end)) }); i = end + 1; continue; }
      }
    }
    if (ch === "[") {
      const m = /^\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"]*")?\)/.exec(rest);
      if (m) {
        const href = safeUrl(m[2]);
        flush();
        if (href) out.push({ t: "link", href, c: parseInline(m[1]) });
        else out.push(...parseInline(m[1]));
        i += m[0].length; continue;
      }
    }
    if (/^https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/.test(rest) && (!src[i - 1] || /[\s(]/.test(src[i - 1]))) {
      const m = /^https?:\/\/[^\s<>()]*[^\s<>().,;:!?'"]/.exec(rest)!;
      flush(); out.push({ t: "link", href: m[0], c: [{ t: "text", v: m[0] }] }); i += m[0].length; continue;
    }
    buf += ch; i++;
  }
  flush();
  return out;
}

const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const fence = /^\s*(```|~~~)\s*([\w+-]*)\s*$/.exec(line);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) body.push(lines[i++]);
      i++;
      blocks.push({ type: "code", lang: fence[2] || undefined, v: body.join("\n") });
      continue;
    }
    const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) { blocks.push({ type: "heading", level: Math.min(4, h[1].length) as 1 | 2 | 3 | 4, c: parseInline(h[2]) }); i++; continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { blocks.push({ type: "hr" }); i++; continue; }
    const img = /^\s*!\[([^\]]*)\]\(([^)\s]+)\)\s*$/.exec(line);
    if (img) { const src = safeUrl(img[2]); if (src) blocks.push({ type: "img", src, alt: img[1] }); i++; continue; }

    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) body.push(lines[i++].replace(/^\s*>\s?/, ""));
      const co = /^\[!(TIP|NOTE|WARNING|IMPORTANT|CAUTION)\]\s*/i.exec(body[0] ?? "");
      if (co) {
        body[0] = body[0].slice(co[0].length);
        const k = co[1].toLowerCase();
        blocks.push({ type: "callout", kind: k === "tip" ? "tip" : k === "note" || k === "important" ? "note" : "warning", c: parseMarkdown(body.join("\n")) });
      } else blocks.push({ type: "quote", c: parseMarkdown(body.join("\n")) });
      continue;
    }

    const lm = LIST_RE.exec(line);
    if (lm && lm[1].length < 2) {
      const ordered = /\d/.test(lm[2]);
      const items: { c: Inline[]; children?: Block }[] = [];
      while (i < lines.length) {
        const m = LIST_RE.exec(lines[i]);
        if (m && m[1].length < 2 && /\d/.test(m[2]) === ordered) {
          const text = [m[3]];
          i++;
          const nested: string[] = [];
          while (i < lines.length && lines[i].trim() && !(LIST_RE.exec(lines[i]) && LIST_RE.exec(lines[i])![1].length < 2)) {
            if (/^\s{2,}/.test(lines[i]) && LIST_RE.test(lines[i])) nested.push(lines[i].replace(/^\s{2,4}/, ""));
            else if (nested.length) nested.push(lines[i].replace(/^\s{2,4}/, ""));
            else text.push(lines[i].trim());
            i++;
          }
          const children = nested.length ? parseMarkdown(nested.join("\n")).find((b) => b.type === "list") : undefined;
          items.push({ c: parseInline(text.join("\n")), children });
          // allow a single blank line between items
          if (i < lines.length && !lines[i].trim() && i + 1 < lines.length && LIST_RE.exec(lines[i + 1])?.[1].length === 0) i++;
        } else break;
      }
      blocks.push({ type: "list", ordered, start: ordered ? parseInt(lm[2], 10) : undefined, items });
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*```|\s*~~~|\s*>)/.test(lines[i]) && !(LIST_RE.test(lines[i]) && para.length === 0)
      && !(LIST_RE.exec(lines[i]) && LIST_RE.exec(lines[i])![1].length < 2)) {
      para.push(lines[i]);
      i++;
    }
    if (!para.length) { para.push(lines[i]); i++; }
    blocks.push({ type: "p", c: parseInline(para.join("\n").replace(/\s+$/, "")) });
  }
  return blocks;
}
