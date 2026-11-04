/**
 * OWNER: learn. A small, safe markdown parser for lesson bodies → plain AST (rendered by Markdown.tsx as React
 * elements, never as raw HTML). Supports what CONTENT-FORMAT.md promises: headings, paragraphs, lists (nested,
 * ordered/unordered, task lists), fenced code, inline code, bold/italic/strike, links, images, blockquotes with
 * callouts (`> **Tip:** …`), tables, horizontal rules. Raw HTML is shown as text.
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "code"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "del"; c: Inline[] }
  | { t: "link"; href: string; c: Inline[] }
  | { t: "img"; src: string; alt: string }
  | { t: "br" };

export type CalloutKind = "tip" | "note" | "warn" | "stuck";

export type Block =
  | { t: "h"; level: 1 | 2 | 3 | 4; c: Inline[]; id: string }
  | { t: "p"; c: Inline[] }
  | { t: "code"; lang: string; v: string }
  | { t: "list"; ordered: boolean; start: number; items: { checked: boolean | null; c: Block[] }[] }
  | { t: "quote"; callout: CalloutKind | null; c: Block[] }
  | { t: "table"; align: ("left" | "center" | "right" | null)[]; head: Inline[][]; rows: Inline[][][] }
  | { t: "hr" };

/** Only allow safe URL schemes. Returns null for anything else (javascript:, data:, vbscript:…). */
export function safeUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (/^(https?:|mailto:)/i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null; // any other scheme
  if (url.startsWith("//")) return null;
  return url; // relative path or #anchor
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

const CALLOUTS: [RegExp, CalloutKind][] = [
  [/^(tip|pro tip|совет|лайфхак|подсказка)(?!\p{L})/iu, "tip"],
  [/^(if you'?re stuck|stuck|если застрял|застрял)/iu, "stuck"],
  [/^(warning|warn|careful|caution|important|safety|security|ethics|внимание|важно|осторожно|безопасность|этика)/iu, "warn"],
];
/** Kind of a `> **Label:** …` callout. Any bold-led quote is a callout; unknown labels are notes. */
export function calloutKind(label: string): CalloutKind {
  const l = label.replace(/[:：.!?]+$/, "").trim();
  for (const [re, k] of CALLOUTS) if (re.test(l)) return k;
  return "note";
}

// ---------------- inline ----------------

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => {
    if (buf) { out.push({ t: "text", v: buf }); buf = ""; }
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    const rest = src.slice(i);
    // escapes
    if (ch === "\\" && i + 1 < src.length && /[\\`*_{}\[\]()#+\-.!|~>]/.test(src[i + 1])) {
      buf += src[i + 1]; i += 2; continue;
    }
    // hard line break: two spaces + newline, or backslash-newline handled above as text
    if (ch === "\n") {
      if (buf.endsWith("  ")) { buf = buf.replace(/ +$/, ""); flush(); out.push({ t: "br" }); }
      else buf += " ";
      i++; continue;
    }
    if (ch === "`") {
      const m = /^(`+)([\s\S]*?[^`])\1(?!`)/.exec(rest);
      if (m) { flush(); out.push({ t: "code", v: m[2].replace(/\n/g, " ").replace(/^ (.*) $/, "$1") }); i += m[0].length; continue; }
    }
    if (ch === "!" && src[i + 1] === "[") {
      const m = /^!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/.exec(rest);
      if (m) {
        const s = safeUrl(m[2]);
        flush();
        if (s && /^(https?:|\/)/i.test(s)) out.push({ t: "img", src: s, alt: m[1] });
        else out.push({ t: "text", v: m[1] });
        i += m[0].length; continue;
      }
    }
    if (ch === "[") {
      const close = findClosing(src, i, "[", "]");
      if (close > 0 && src[close + 1] === "(") {
        const m = /^\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/.exec(src.slice(close + 1));
        if (m) {
          const href = safeUrl(m[1]);
          const label = parseInline(src.slice(i + 1, close));
          flush();
          if (href) out.push({ t: "link", href, c: label });
          else out.push(...label);
          i = close + 1 + m[0].length; continue;
        }
      }
    }
    if (ch === "<") {
      const m = /^<(https?:\/\/[^\s>]+)>/.exec(rest);
      if (m) { flush(); out.push({ t: "link", href: m[1], c: [{ t: "text", v: m[1] }] }); i += m[0].length; continue; }
    }
    if ((ch === "h" || ch === "H") && /^https?:\/\//i.test(rest) && !/[\w/]$/.test(buf)) {
      const m = /^https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"»”)\]]/i.exec(rest);
      if (m) { flush(); out.push({ t: "link", href: m[0], c: [{ t: "text", v: m[0] }] }); i += m[0].length; continue; }
    }
    if (ch === "~" && src[i + 1] === "~") {
      const end = src.indexOf("~~", i + 2);
      if (end > i + 2) { flush(); out.push({ t: "del", c: parseInline(src.slice(i + 2, end)) }); i = end + 2; continue; }
    }
    if (ch === "*" || ch === "_") {
      const dbl = src[i + 1] === ch;
      const marker = dbl ? ch + ch : ch;
      // underscores inside words are literal (snake_case)
      const prev = i > 0 ? src[i - 1] : " ";
      const leftOk = !/\s/.test(src[i + marker.length] ?? " ") && (ch === "*" || !/[\p{L}\p{N}]/u.test(prev));
      if (leftOk) {
        const end = findEmphasisEnd(src, i + marker.length, marker);
        if (end > 0) {
          flush();
          const inner = parseInline(src.slice(i + marker.length, end));
          out.push(dbl ? { t: "strong", c: inner } : { t: "em", c: inner });
          i = end + marker.length; continue;
        }
      }
    }
    buf += ch; i++;
  }
  flush();
  return out;
}

function findClosing(s: string, from: number, open: string, close: string): number {
  let depth = 0;
  for (let j = from; j < s.length; j++) {
    if (s[j] === "\\") { j++; continue; }
    if (s[j] === "`") { const e = s.indexOf("`", j + 1); if (e > 0) { j = e; continue; } }
    if (s[j] === open) depth++;
    else if (s[j] === close) { depth--; if (depth === 0) return j; }
  }
  return -1;
}

function findEmphasisEnd(s: string, from: number, marker: string): number {
  let j = from;
  while (j < s.length) {
    if (s[j] === "\\") { j += 2; continue; }
    if (s[j] === "`") { const e = s.indexOf("`", j + 1); if (e > 0) { j = e + 1; continue; } }
    if (s.startsWith(marker, j) && !/\s/.test(s[j - 1] ?? " ")) {
      // for single markers, don't stop on a double marker
      if (marker.length === 1 && s[j + 1] === marker) { j += 2; continue; }
      const next = s[j + marker.length] ?? " ";
      if (marker[0] === "_" && /[\p{L}\p{N}]/u.test(next)) { j++; continue; }
      if (j > from) return j;
    }
    j++;
  }
  return -1;
}

/** Plain text of inline nodes (for ids, aria labels). */
export function inlineText(c: Inline[]): string {
  return c.map((n) => (n.t === "text" || n.t === "code" ? n.v : n.t === "img" ? n.alt : n.t === "br" ? " " : inlineText(n.c))).join("");
}

// ---------------- blocks ----------------

const reFence = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)[^\n]*$/;
const reHeading = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const reHr = /^ {0,3}([-*_])( *\1){2,}\s*$/;
const reQuote = /^ {0,3}> ?/;
const reBullet = /^( *)([-*+])\s+(.*)$/;
const reOrdered = /^( *)(\d{1,9})[.)]\s+(.*)$/;
const reTableSep = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  const ids = new Map<string, number>();
  return parseBlocks(lines, ids);
}

function uniqueId(ids: Map<string, number>, text: string) {
  const base = slugify(text) || "section";
  const n = ids.get(base) ?? 0;
  ids.set(base, n + 1);
  return n ? `${base}-${n + 1}` : base;
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const cells: string[] = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") { cur += "|"; i++; continue; }
    if (s[i] === "|") { cells.push(cur.trim()); cur = ""; continue; }
    cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}

function isBlockStart(line: string): boolean {
  return reFence.test(line) || reHeading.test(line) || reHr.test(line) || reQuote.test(line) || reBullet.test(line) || /^ {0,3}\d{1,9}[.)]\s+/.test(line);
}

function parseBlocks(lines: string[], ids: Map<string, number>): Block[] {
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const fence = reFence.exec(line);
    if (fence) {
      const marker = fence[1];
      const indent = line.length - line.trimStart().length;
      const body: string[] = [];
      i++;
      while (i < lines.length && !new RegExp(`^ {0,3}${marker[0]}{${marker.length},}\\s*$`).test(lines[i])) {
        body.push(lines[i].slice(Math.min(indent, lines[i].length - lines[i].trimStart().length)));
        i++;
      }
      i++; // closing fence (or EOF)
      out.push({ t: "code", lang: fence[2] || "", v: body.join("\n") });
      continue;
    }

    const h = reHeading.exec(line);
    if (h) {
      const level = Math.min(4, Math.max(1, h[1].length)) as 1 | 2 | 3 | 4;
      const c = parseInline(h[2]);
      out.push({ t: "h", level, c, id: uniqueId(ids, inlineText(c)) });
      i++; continue;
    }

    if (reHr.test(line)) { out.push({ t: "hr" }); i++; continue; }

    if (reQuote.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && (reQuote.test(lines[i]) || (lines[i].trim() && !isBlockStart(lines[i]) && inner.length && inner[inner.length - 1].trim()))) {
        inner.push(lines[i].replace(reQuote, ""));
        i++;
      }
      const c = parseBlocks(inner, ids);
      let callout: CalloutKind | null = null;
      const first = c[0];
      if (first?.t === "p" && first.c[0]?.t === "strong") {
        callout = calloutKind(inlineText(first.c[0].c));
      }
      out.push({ t: "quote", callout, c });
      continue;
    }

    const bullet = reBullet.exec(line);
    const ord = reOrdered.exec(line);
    if ((bullet && bullet[1].length < 4) || (ord && ord[1].length < 4)) {
      const r = parseList(lines, i, ids);
      out.push(r.block);
      i = r.next;
      continue;
    }

    // table: header row followed by separator row
    if (line.includes("|") && i + 1 < lines.length && reTableSep.test(lines[i + 1])) {
      const head = splitRow(line);
      const align = splitRow(lines[i + 1]).map((c) =>
        c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : c.startsWith(":") ? "left" : null,
      );
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        const cells = splitRow(lines[i]);
        rows.push(head.map((_, k) => parseInline(cells[k] ?? "")));
        i++;
      }
      out.push({ t: "table", align, head: head.map(parseInline), rows });
      continue;
    }

    // paragraph
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !(para.length && isBlockStart(lines[i]))) {
      if (para.length && i + 1 < lines.length && lines[i].includes("|") && reTableSep.test(lines[i + 1])) break;
      para.push(lines[i].replace(/^ {0,3}/, ""));
      i++;
    }
    out.push({ t: "p", c: parseInline(para.join("\n").replace(/\s+$/, "")) });
  }
  return out;
}

function parseList(lines: string[], start: number, ids: Map<string, number>): { block: Block; next: number } {
  const first = reBullet.exec(lines[start]) ?? reOrdered.exec(lines[start])!;
  const ordered = !reBullet.test(lines[start]);
  const baseIndent = first[1].length;
  const items: { checked: boolean | null; c: Block[] }[] = [];
  let i = start;
  let loose = false;
  while (i < lines.length) {
    const m = ordered ? reOrdered.exec(lines[i]) : reBullet.exec(lines[i]);
    if (!m || m[1].length !== baseIndent) break;
    const contentIndent = lines[i].length - m[3].length;
    let text = m[3];
    let checked: boolean | null = null;
    const task = /^\[([ xX])\]\s+(.*)$/.exec(text);
    if (task) { checked = task[1] !== " "; text = task[2]; }
    const body = [text];
    i++;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) {
        // blank line: continue the item only if the next non-blank line is indented under it
        let j = i + 1;
        while (j < lines.length && !lines[j].trim()) j++;
        if (j < lines.length && lines[j].length - lines[j].trimStart().length >= Math.min(contentIndent, baseIndent + 2)) {
          body.push(...lines.slice(i, j)); i = j; loose = true; continue;
        }
        break;
      }
      const ind = l.length - l.trimStart().length;
      const sibling = (ordered ? reOrdered : reBullet).exec(l);
      if (sibling && sibling[1].length === baseIndent) break;
      if (ind <= baseIndent && isBlockStart(l)) break;
      body.push(ind >= baseIndent + 2 ? l.slice(Math.min(ind, contentIndent)) : l.trimStart());
      i++;
    }
    const blocks = parseBlocks(body, ids);
    items.push({ checked, c: blocks });
    // blank line between items → keep going if the next line is another item
    let j = i;
    while (j < lines.length && !lines[j].trim()) j++;
    const nxt = j < lines.length ? (ordered ? reOrdered : reBullet).exec(lines[j]) : null;
    if (j > i && nxt && nxt[1].length === baseIndent) { i = j; loose = true; continue; }
  }
  void loose;
  return { block: { t: "list", ordered, start: ordered ? Number(first[2]) : 1, items }, next: i };
}
