/**
 * Share card builder — pure, framework-free. Produces one SVG string used for BOTH the on-screen preview and the
 * PNG export, so what people see is exactly what they post.
 *
 * Colours are literal here on purpose: an exported image can't read CSS variables. They mirror the tokens in
 * styles.css (guarded by shareCardSvg.test.ts).
 */
export type ShareLang = "en" | "ru";
export type ShareKind = "day" | "streak";
export type ShareFormat = "portrait" | "landscape"; // 1080×1350 (feeds, Telegram, stories-safe) · 1200×630 (X, link previews)
export type ShareTheme = "light" | "dark";

export type ShareCardData = {
  kind: ShareKind;
  lang: ShareLang;
  /** Day just completed (1–66). For kind="streak" it's still used for the grid. */
  day: number;
  /** Native day title, e.g. "Ship it: your page goes live". Optional for streak cards. */
  title?: string;
  track?: "apps" | "video" | null;
  /** Current streak in days. */
  streak?: number;
  /** XP to show: total XP (or XP earned that day — pass `xpLabel` to say which). */
  xp?: number;
  xpLabel?: string;
  name?: string | null;
  /** Days completed so far (defaults to 1..day). Rest/boss days are marked from the program shape. */
  completed?: number[];
};

export const SHARE_SIZES: Record<ShareFormat, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1350 },
  landscape: { w: 1200, h: 630 },
};

export const SHARE_PALETTE = {
  light: { bg: "#fafaf7", surface: "#ffffff", surface2: "#f2f2ed", fg: "#15171a", muted: "#5d636b", line: "#e4e4dc", lineStrong: "#cfcfc6",
    accent: "#187a4e", accentFg: "#ffffff", accentInk: "#136b44", accentSoft: "#e6f2eb", gold: "#8a6410", goldBright: "#d4a23a", goldSoft: "#f7efdc" },
  dark: { bg: "#0e1012", surface: "#15181b", surface2: "#1c2024", fg: "#eceeef", muted: "#9ba2aa", line: "#262b30", lineStrong: "#353b42",
    accent: "#43c38a", accentFg: "#04140c", accentInk: "#6fdcab", accentSoft: "#13281e", gold: "#e3b95e", goldBright: "#e8bd5c", goldSoft: "#2a2416" },
};

/** Boss days (OUTLINE.md) and rest days (every 7th). */
export const BOSS_DAYS = new Set([13, 27, 41, 55, 65]);
export const isRest = (d: number) => d % 7 === 0;

const FONT = `'Onest Variable', Onest, Inter, system-ui, sans-serif`;
const SERIF = `'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif`;

const COPY = {
  en: {
    dayOf: (d: number) => `DAY ${d} OF 66`,
    done: "done",
    streakEyebrow: "STREAK",
    streakLine: (n: number) => `${n === 1 ? "day" : "days"} in a row, building with AI`,
    streak: (n: number) => `${n}-day streak`,
    xp: "XP",
    track: { apps: "Apps track", video: "Video track" },
    footer: "66 days of building with AI",
    tag: "#FlowLeaf66",
  },
  ru: {
    dayOf: (d: number) => `ДЕНЬ ${d} ИЗ 66`,
    done: "пройден",
    streakEyebrow: "СЕРИЯ",
    streakLine: (n: number) => `${ruDays(n)} подряд создаю с ИИ`,
    streak: (n: number) => `${n} ${ruDays(n)} подряд`,
    xp: "XP",
    track: { apps: "Трек «Приложения»", video: "Трек «Видео»" },
    footer: "66 дней создаю с ИИ",
    tag: "#FlowLeaf66",
  },
};

export function ruDays(n: number) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "день";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "дня";
  return "дней";
}

export function escapeXml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
}

/** Text width: real measurement in the browser, a calibrated estimate elsewhere (tests / SSR). */
let ctx: CanvasRenderingContext2D | null | undefined;
let uid = 0;
export function measure(text: string, size: number, weight = 600): number {
  if (ctx === undefined) {
    try { ctx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null; } catch { ctx = null; }
  }
  if (ctx) { ctx.font = `${weight} ${size}px ${FONT}`; return ctx.measureText(text).width; }
  let w = 0;
  for (const ch of text) w += /[\s.,:;'’!|]/.test(ch) ? 0.28 : /[A-ZА-ЯЁМШЩЖЮmwшщжю]/.test(ch) ? 0.72 : /\d/.test(ch) ? 0.6 : 0.54;
  return w * size;
}

/** Greedy word wrap to `maxLines`; the last line gets an ellipsis if it overflows. */
export function wrap(text: string, maxWidth: number, size: number, maxLines: number, weight = 600): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (let i = 0; i < words.length; i++) {
    const next = cur ? `${cur} ${words[i]}` : words[i];
    if (measure(next, size, weight) <= maxWidth || !cur) { cur = next; continue; }
    lines.push(cur);
    cur = words[i];
    if (lines.length === maxLines) { cur = ""; break; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) lines.length = maxLines;
  const used = lines.join(" ").split(/\s+/).length;
  if (used < words.length || measure(lines[lines.length - 1] ?? "", size, weight) > maxWidth) {
    let last = lines[lines.length - 1] ?? "";
    while (last && measure(last + "…", size, weight) > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[lines.length - 1] = last.replace(/[\s,:;–—-]+$/, "") + "…";
  }
  return lines;
}

const ICON = {
  flame: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  zap: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
  crown: "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294zM5 21h14",
  moon: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
  check: "M20 6 9 17l-5-5",
};
const icon = (name: keyof typeof ICON, x: number, y: number, size: number, color: string, fill = false, sw = 2) =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})"><path d="${ICON[name]}" fill="${fill ? color : "none"}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></g>`;

const leaf = (x: number, y: number, size: number, c: typeof SHARE_PALETTE.light) =>
  `<g transform="translate(${x} ${y}) scale(${size / 32})">` +
  `<path d="M27 5C14.5 5 6 11.6 6 21.2c0 2.2.5 4 1.3 5.3C9 27.4 11 28 13.4 28 22 28 27 19.6 27 5Z" fill="${c.accent}"/>` +
  `<path d="M7.3 26.5C11 20 16.4 14.6 22.6 10.4M13.6 19.4l.3-4.4M17.4 16l3.6.6" stroke="${c.accentFg}" stroke-width="2" stroke-linecap="round" fill="none"/>` +
  `<path d="M7.3 26.5c-1.1 1.4-2.5 2-4.3 1.9" stroke="${c.accent}" stroke-width="2" stroke-linecap="round" fill="none"/></g>`;

function grid(x: number, y: number, cell: number, gap: number, data: ShareCardData, c: typeof SHARE_PALETTE.light) {
  const done = new Set(data.completed ?? Array.from({ length: data.day }, (_, i) => i + 1));
  let s = "";
  for (let d = 1; d <= 66; d++) {
    const col = (d - 1) % 11, row = Math.floor((d - 1) / 11);
    const cx = x + col * (cell + gap), cy = y + row * (cell + gap), r = cell * 0.22;
    if (d === data.day) {
      s += `<rect x="${cx - 3}" y="${cy - 3}" width="${cell + 6}" height="${cell + 6}" rx="${r + 3}" fill="none" stroke="${c.accent}" stroke-width="3"/>`;
      s += `<rect x="${cx + 3}" y="${cy + 3}" width="${cell - 6}" height="${cell - 6}" rx="${r - 1}" fill="${c.accent}"/>`;
    } else if (done.has(d)) s += `<rect x="${cx}" y="${cy}" width="${cell}" height="${cell}" rx="${r}" fill="${c.accent}"/>`;
    else if (BOSS_DAYS.has(d)) {
      s += `<rect x="${cx + 1}" y="${cy + 1}" width="${cell - 2}" height="${cell - 2}" rx="${r}" fill="${c.goldSoft}" stroke="${c.goldBright}" stroke-width="2"/>`;
      s += icon("crown", cx + cell * 0.26, cy + cell * 0.26, cell * 0.48, c.goldBright, false, 2.2);
    } else if (isRest(d)) s += `<rect x="${cx + 1}" y="${cy + 1}" width="${cell - 2}" height="${cell - 2}" rx="${r}" fill="none" stroke="${c.lineStrong}" stroke-width="2" stroke-dasharray="5 4"/>`;
    else s += `<rect x="${cx}" y="${cy}" width="${cell}" height="${cell}" rx="${r}" fill="${c.surface2}"/>`;
  }
  return s;
}

function stat(x: number, y: number, ic: keyof typeof ICON, color: string, value: string, label: string, c: typeof SHARE_PALETTE.light, size = 1) {
  return icon(ic, x, y - 34 * size, 34 * size, color, ic === "zap", 2.2) +
    `<text x="${x + 46 * size}" y="${y}" font-family="${FONT}" font-weight="650" font-size="${44 * size}" fill="${c.fg}">${escapeXml(value)}</text>` +
    `<text x="${x + 46 * size + measure(value, 44 * size, 650) + 12 * size}" y="${y}" font-family="${FONT}" font-weight="500" font-size="${28 * size}" fill="${c.muted}">${escapeXml(label)}</text>`;
}

/**
 * Build the share card SVG. `fontCss` (optional) is injected into <style> — the exporter passes base64 @font-face
 * rules so the PNG renders with Onest even though an <img>-loaded SVG can't see page fonts.
 */
export function shareCardSvg(data: ShareCardData, format: ShareFormat = "portrait", theme: ShareTheme = "light", fontCss = ""): string {
  const { w, h } = SHARE_SIZES[format];
  const c = SHARE_PALETTE[theme];
  const t = COPY[data.lang];
  const day = Math.max(1, Math.min(66, Math.round(data.day)));
  const d = { ...data, day };
  const streak = Math.max(0, data.streak ?? 0);
  const isStreak = data.kind === "streak";
  const big = isStreak ? String(streak) : String(day);
  const eyebrow = isStreak ? t.streakEyebrow : t.dayOf(day);
  const name = data.name?.trim() || "";
  const trackLabel = data.track ? t.track[data.track] : "";
  const L = format === "portrait";

  const pad = L ? 88 : 64;
  const u = `fl${++uid}`; // unique ids: several inline previews can share a page
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  if (fontCss) s += `<style>${fontCss}</style>`;
  s += `<defs><pattern id="${u}d" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="${c.lineStrong}"/></pattern>` +
    `<linearGradient id="${u}f" x1="0" x2="1" y1="0" y2="0"><stop offset="0.35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>` +
    `<mask id="${u}m"><rect width="${w}" height="${h}" fill="url(#${u}f)"/></mask></defs>`;
  s += `<rect width="${w}" height="${h}" fill="${c.bg}"/><rect width="${w}" height="${h}" fill="url(#${u}d)" mask="url(#${u}m)" opacity="0.7"/>`;

  // header: logo + track pill
  const logoSize = L ? 56 : 44;
  s += leaf(pad, pad, logoSize, c);
  const brandSize = L ? 38 : 30;
  s += `<text x="${pad + logoSize + 14}" y="${pad + logoSize * 0.72}" font-family="${FONT}" font-weight="600" font-size="${brandSize}" fill="${c.fg}" letter-spacing="-0.5">FlowLeaf <tspan fill="${c.accentInk}" font-weight="500">66</tspan></text>`;
  if (trackLabel) {
    const ps = L ? 26 : 22, pw = measure(trackLabel, ps, 550) + ps * 1.6, ph = ps * 1.9;
    const px = w - pad - pw, py = pad + (logoSize - ph) / 2;
    s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${ph / 2}" fill="${c.surface}" stroke="${c.line}" stroke-width="2"/>`;
    s += `<text x="${px + pw / 2}" y="${py + ph * 0.66}" text-anchor="middle" font-family="${FONT}" font-weight="550" font-size="${ps}" fill="${c.muted}">${escapeXml(trackLabel)}</text>`;
  }

  // headline block
  const colW = L ? w - pad * 2 : 560;
  const eyeY = L ? 240 : 200;
  const eyeSize = L ? 34 : 26;
  s += `<text x="${pad}" y="${eyeY}" font-family="${FONT}" font-weight="650" font-size="${eyeSize}" letter-spacing="3" fill="${c.accentInk}">${escapeXml(eyebrow)}</text>`;
  const bigSize = L ? 270 : 190;
  const bigY = eyeY + bigSize * 0.86;
  const bigW = measure(big, bigSize, 650);
  s += `<text x="${pad - bigSize * 0.04}" y="${bigY}" font-family="${FONT}" font-weight="650" font-size="${bigSize}" letter-spacing="${-bigSize * 0.04}" fill="${c.fg}">${escapeXml(big)}</text>`;
  const tailX = pad + bigW - bigSize * 0.08 + (L ? 24 : 16);
  if (isStreak) {
    s += icon("flame", tailX, bigY - bigSize * 0.62, bigSize * 0.5, c.goldBright, false, 2.4);
  } else {
    s += `<text x="${tailX}" y="${bigY}" font-family="${SERIF}" font-style="italic" font-weight="500" font-size="${bigSize * 0.36}" fill="${c.accentInk}">${escapeXml(t.done)}</text>`;
  }
  const line = isStreak ? t.streakLine(streak) : data.title || "";
  const titleSize = L ? 54 : 36;
  const lines = line ? wrap(line, colW, titleSize, 2) : [];
  const titleY = bigY + (L ? 90 : 62);
  lines.forEach((ln, i) => {
    s += `<text x="${pad}" y="${titleY + i * titleSize * 1.18}" font-family="${FONT}" font-weight="600" font-size="${titleSize}" letter-spacing="-0.6" fill="${c.fg}">${escapeXml(ln)}</text>`;
  });

  // grid + stats
  const statsItems: Array<[keyof typeof ICON, string, string, string]> = [];
  if (!isStreak && streak > 0) statsItems.push(["flame", c.goldBright, String(streak), data.lang === "ru" ? `${ruDays(streak)} подряд` : "day streak"]);
  if (isStreak) statsItems.push(["check", c.accent, String(d.completed?.length ?? day), data.lang === "ru" ? "из 66" : "of 66 days"]);
  if (data.xp != null) statsItems.push(["zap", c.goldBright, new Intl.NumberFormat(data.lang === "ru" ? "ru-RU" : "en-US").format(data.xp).replace(/ /g, " "), data.xpLabel ?? t.xp]);

  if (L) {
    const cell = 58, gap = 13, gy = 756;
    s += grid(pad, gy, cell, gap, d, c);
    // stats row sits between the title and the grid (more breathing room at the bottom)
    let sx = pad;
    const rowY = gy - 46;
    for (const [ic, col, v, lab] of statsItems) {
      s += stat(sx, rowY, ic, col, v, lab, c);
      sx += 46 + measure(v, 44, 650) + 12 + measure(lab, 28, 500) + 56;
    }
    const fy = h - pad + 6;
    s += `<line x1="${pad}" x2="${w - pad}" y1="${fy - 62}" y2="${fy - 62}" stroke="${c.line}" stroke-width="2"/>`;
    s += `<text x="${pad}" y="${fy}" font-family="${FONT}" font-weight="500" font-size="30" fill="${c.muted}">${escapeXml(name ? `${name} · ${t.footer}` : t.footer)}</text>`;
    s += `<text x="${w - pad}" y="${fy}" text-anchor="end" font-family="${FONT}" font-weight="600" font-size="30" fill="${c.accentInk}">${t.tag}</text>`;
  } else {
    const cell = 38, gap = 9, gx = w - pad - (11 * cell + 10 * gap), gy = 168;
    s += `<rect x="${gx - 28}" y="${gy - 28}" width="${11 * cell + 10 * gap + 56}" height="${6 * cell + 5 * gap + 56}" rx="26" fill="${c.surface}" stroke="${c.line}" stroke-width="2"/>`;
    s += grid(gx, gy, cell, gap, d, c);
    let sx = gx - 4;
    const sy = gy + 6 * cell + 5 * gap + 92;
    for (const [ic, col, v, lab] of statsItems) {
      s += stat(sx, sy, ic, col, v, lab, c, 0.8);
      sx += (46 + measure(v, 44, 650) + 12 + measure(lab, 28, 500)) * 0.8 + 44;
    }
    const fy = h - pad + 4;
    s += `<text x="${pad}" y="${fy}" font-family="${FONT}" font-weight="500" font-size="24" fill="${c.muted}">${escapeXml(name ? `${name} · ${t.footer}` : t.footer)}</text>`;
    s += `<text x="${w - pad}" y="${fy}" text-anchor="end" font-family="${FONT}" font-weight="600" font-size="24" fill="${c.accentInk}">${t.tag}</text>`;
  }
  return s + "</svg>";
}

/** Ready-to-post text for the share sheet / clipboard (native per language). */
export function shareText(data: ShareCardData): string {
  const streak = data.streak ?? 0;
  if (data.lang === "ru") {
    if (data.kind === "streak") return `${streak} ${ruDays(streak)} подряд создаю с ИИ. Цель — 66. #FlowLeaf66`;
    return `День ${data.day} из 66 пройден${data.title ? `: «${data.title}»` : ""}.${streak > 1 ? ` Серия — ${streak} ${ruDays(streak)}.` : ""} #FlowLeaf66`;
  }
  if (data.kind === "streak") return `${streak} ${streak === 1 ? "day" : "days"} in a row building with AI. Going for 66. #FlowLeaf66`;
  return `Day ${data.day} of 66, done${data.title ? `: "${data.title}"` : ""}.${streak > 1 ? ` ${streak}-day streak.` : ""} #FlowLeaf66`;
}
